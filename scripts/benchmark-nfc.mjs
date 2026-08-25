import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { PrismaClient } from "@prisma/client";

/**
 * Keep the benchmark dependency-free.
 * Load DATABASE_URL from the shell, .env.local, or .env.
 */
function loadDatabaseUrl() {
    if (process.env.DATABASE_URL) {
        return;
    }

    for (const filename of [".env.local", ".env"]) {
        const filePath = path.join(process.cwd(), filename);

        if (!existsSync(filePath)) {
            continue;
        }

        const line = readFileSync(filePath, "utf8")
            .split(/\r?\n/)
            .find((candidate) =>
                candidate.trim().startsWith("DATABASE_URL=")
            );

        if (!line) {
            continue;
        }

        let value = line
            .trim()
            .slice("DATABASE_URL=".length)
            .trim();

        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        process.env.DATABASE_URL = value;
        return;
    }
}

loadDatabaseUrl();

const prisma = new PrismaClient();

const PUBLIC_CLIENT_COOKIE = "tapcare_public_client";

/**
 * Seeded active RENDER_PAGE sticker.
 * This avoids following WhatsApp/tel redirects during the benchmark.
 */
const DEFAULT_PUBLIC_CODE =
    "550e8400-e29b-41d4-a716-446655440002";

const STICKER_ANALYTICS_LIMIT = 60;

function parseArgs(argv) {
    const values = new Map();

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];

        if (!arg.startsWith("--")) {
            continue;
        }

        const equals = arg.indexOf("=");

        if (equals !== -1) {
            values.set(
                arg.slice(2, equals),
                arg.slice(equals + 1)
            );
            continue;
        }

        const key = arg.slice(2);
        const next = argv[i + 1];

        if (next && !next.startsWith("--")) {
            values.set(key, next);
            i += 1;
        } else {
            values.set(key, "true");
        }
    }

    return values;
}

function numberArg(args, name, fallback) {
    const raw = args.get(name);
    const value =
        raw === undefined ? fallback : Number(raw);

    if (!Number.isFinite(value)) {
        throw new Error(`--${name} must be a number`);
    }

    return value;
}

function percentile(values, percentileValue) {
    if (values.length === 0) {
        return 0;
    }

    const sorted = [...values].sort((a, b) => a - b);

    const index = Math.min(
        sorted.length - 1,
        Math.ceil(
            (percentileValue / 100) * sorted.length
        ) - 1
    );

    return sorted[Math.max(0, index)];
}

function median(values) {
    if (values.length === 0) {
        return 0;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (
            (sorted[middle - 1] + sorted[middle]) / 2
        );
    }

    return sorted[middle];
}

function round(value, digits = 2) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

/**
 * Generates grouped duplicate bursts.
 *
 * Example:
 *   requests = 5000
 *   duplicateRate = 0.8
 *
 * gives:
 *   1000 logical clients
 *   5 requests/client
 *
 * Requests for the same client stay adjacent so they hit
 * TapCare's short Redis dedup window rather than being spread
 * across the entire benchmark.
 */
function buildWorkload({
    requests,
    duplicateRate,
    seed,
    run
}) {
    const uniqueClients = Math.max(
        1,
        Math.min(
            requests,
            Math.round(
                requests * (1 - duplicateRate)
            )
        )
    );

    const groupSizes =
        Array(uniqueClients).fill(1);

    for (
        let remaining = requests - uniqueClients, i = 0;
        remaining > 0;
        remaining -= 1, i += 1
    ) {
        groupSizes[i % uniqueClients] += 1;
    }

    const maxRequestsPerClient =
        Math.max(...groupSizes);

    /**
     * TapCare also has a separate 60/min analytics
     * ceiling. Do not accidentally benchmark that instead.
     */
    if (
        maxRequestsPerClient >=
        STICKER_ANALYTICS_LIMIT
    ) {
        throw new Error(
            `Workload would send ${maxRequestsPerClient} requests ` +
            `for one client. Keep this below TapCare's ` +
            `${STICKER_ANALYTICS_LIMIT}/min analytics ceiling ` +
            `so this measures deduplication rather than rate limiting.`
        );
    }

    const items = [];

    groupSizes.forEach(
        (size, clientIndex) => {
            const clientId =
                `tapcare-bench-${seed}` +
                `-r${run}` +
                `-c${clientIndex}`;

            for (
                let duplicateIndex = 0;
                duplicateIndex < size;
                duplicateIndex += 1
            ) {
                items.push({
                    clientId,
                    duplicateIndex
                });
            }
        }
    );

    return {
        items,
        uniqueClients,
        duplicateRequests:
            requests - uniqueClients,
        maxRequestsPerClient
    };
}

async function countDurableStickerOpens(
    publicCode
) {
    return prisma.interactionEvent.count({
        where: {
            publicCode,
            eventType: "STICKER_OPENED",
            outcome: "SUCCESS"
        }
    });
}

async function executeWorkload({
    url,
    workload,
    concurrency
}) {
    const results =
        new Array(workload.items.length);

    let cursor = 0;

    const runStarted = performance.now();

    async function worker() {
        while (true) {
            const index = cursor;
            cursor += 1;

            if (index >= workload.items.length) {
                return;
            }

            const item = workload.items[index];
            const started = performance.now();

            try {
                /**
                 * Middleware deliberately ignores a caller-provided
                 * x-tapcare-public-client header.
                 *
                 * Sending the real first-party cookie therefore exercises
                 * the same middleware -> header -> runtime path as a
                 * returning browser that tapped an NFC sticker.
                 */
                const response = await fetch(url, {
                    method: "GET",
                    redirect: "manual",
                    headers: {
                        cookie:
                            `${PUBLIC_CLIENT_COOKIE}=` +
                            encodeURIComponent(item.clientId),
                        "cache-control": "no-cache"
                    }
                });

                /**
                 * Consume the full response before marking the request
                 * complete so latency includes the actual HTTP response.
                 */
                await response.arrayBuffer();

                results[index] = {
                    ...item,
                    status: response.status,
                    success:
                        response.status >= 200 &&
                        response.status < 400,
                    latencyMs:
                        performance.now() - started
                };
            } catch (error) {
                results[index] = {
                    ...item,
                    status: 0,
                    success: false,
                    latencyMs:
                        performance.now() - started,
                    error:
                        error instanceof Error
                            ? error.message
                            : String(error)
                };
            }
        }
    }

    const workers = Array.from(
        {
            length: Math.min(
                concurrency,
                workload.items.length
            )
        },
        () => worker()
    );

    await Promise.all(workers);

    const elapsedMs =
        performance.now() - runStarted;

    const latencies = results.map(
        (result) => result.latencyMs
    );

    const failures = results.filter(
        (result) => !result.success
    );

    if (failures.length > 0) {
        console.error("\nSample HTTP failures:");

        for (const failure of failures.slice(0, 3)) {
            console.error({
                status: failure.status,
                error: failure.error,
                latencyMs: failure.latencyMs
            });
        }
    }

    const successful = results.filter(
        (result) => result.success
    );

    return {
        elapsedMs,

        successfulResponses:
            successful.length,

        failedResponses:
            results.length - successful.length,

        successRatePct:
            (successful.length / results.length) *
            100,

        throughputRps:
            results.length /
            (elapsedMs / 1000),

        p50Ms: percentile(latencies, 50),
        p95Ms: percentile(latencies, 95),
        p99Ms: percentile(latencies, 99)
    };
}

async function runOnce(config, run) {
    const workload = buildWorkload({
        requests: config.requests,
        duplicateRate: config.duplicateRate,
        seed: config.seed,
        run
    });

    const url =
        `${config.baseUrl.replace(/\/$/, "")}` +
        `/t/${config.publicCode}`;

    const before =
        await countDurableStickerOpens(
            config.publicCode
        );

    const http = await executeWorkload({
        url,
        workload,
        concurrency: config.concurrency
    });

    const after =
        await countDurableStickerOpens(
            config.publicCode
        );

    const durableWrites = after - before;

    const duplicateWritesAvoided = Math.max(
        0,
        http.successfulResponses -
        durableWrites
    );

    const writeSuppressionPct =
        http.successfulResponses === 0
            ? 0
            : (
                duplicateWritesAvoided /
                http.successfulResponses
            ) * 100;

    /**
     * Normal mode:
     *   one durable write per logical client.
     *
     * Redis-unavailable mode:
     *   dedup fails open, therefore every successful request
     *   should be durably persisted.
     */
    const expectedDurableWrites =
        config.mode === "redis-unavailable"
            ? http.successfulResponses
            : workload.uniqueClients;

    return {
        run,

        requestsSent:
            config.requests,

        uniqueLogicalClients:
            workload.uniqueClients,

        duplicateRequests:
            workload.duplicateRequests,

        maxRequestsPerClient:
            workload.maxRequestsPerClient,

        successfulResponses:
            http.successfulResponses,

        failedResponses:
            http.failedResponses,

        successRatePct:
            round(http.successRatePct),

        throughputRps:
            round(http.throughputRps),

        p50Ms:
            round(http.p50Ms),

        p95Ms:
            round(http.p95Ms),

        p99Ms:
            round(http.p99Ms),

        durableStickerOpenedWrites:
            durableWrites,

        duplicateWritesAvoided,

        writeSuppressionPct:
            round(writeSuppressionPct),

        expectedDurableWrites,

        accountingError:
            durableWrites -
            expectedDurableWrites,

        valid:
            http.failedResponses === 0 &&
            durableWrites ===
            expectedDurableWrites
    };
}

function printRun(result) {
    console.log(`\nRun ${result.run}`);

    console.log(
        `  HTTP success          ` +
        `${result.successfulResponses}/` +
        `${result.requestsSent} ` +
        `(${result.successRatePct}%)`
    );

    console.log(
        `  Throughput            ` +
        `${result.throughputRps} req/s`
    );

    console.log(
        `  Latency p50/p95/p99   ` +
        `${result.p50Ms} / ` +
        `${result.p95Ms} / ` +
        `${result.p99Ms} ms`
    );

    console.log(
        `  Durable opens         ` +
        `${result.durableStickerOpenedWrites}`
    );

    console.log(
        `  Writes avoided        ` +
        `${result.duplicateWritesAvoided} ` +
        `(${result.writeSuppressionPct}%)`
    );

    console.log(
        `  Accounting error      ` +
        `${result.accountingError}`
    );

    console.log(
        `  Valid                 ` +
        `${result.valid ? "YES" : "NO"}`
    );
}

async function main() {
    const args =
        parseArgs(process.argv.slice(2));

    const mode =
        args.get("mode") ?? "normal";

    if (
        mode !== "normal" &&
        mode !== "redis-unavailable"
    ) {
        throw new Error(
            "--mode must be normal or redis-unavailable"
        );
    }

    const config = {
        baseUrl:
            args.get("base-url") ??
            "http://localhost:3000",

        publicCode:
            args.get("public-code") ??
            DEFAULT_PUBLIC_CODE,

        requests: Math.trunc(
            numberArg(args, "requests", 5000)
        ),

        concurrency: Math.trunc(
            numberArg(args, "concurrency", 100)
        ),

        duplicateRate:
            numberArg(
                args,
                "duplicate-rate",
                0.8
            ),

        runs: Math.trunc(
            numberArg(args, "runs", 5)
        ),

        seed: Math.trunc(
            numberArg(args, "seed", 4263)
        ),

        mode
    };

    if (
        config.requests < 1 ||
        config.concurrency < 1 ||
        config.runs < 1
    ) {
        throw new Error(
            "--requests, --concurrency and --runs must be positive"
        );
    }

    if (
        config.duplicateRate < 0 ||
        config.duplicateRate >= 1
    ) {
        throw new Error(
            "--duplicate-rate must be >= 0 and < 1"
        );
    }

    if (!process.env.DATABASE_URL) {
        throw new Error(
            "DATABASE_URL is required for PostgreSQL accounting"
        );
    }

    console.log(
        "\nTapCare NFC Runtime Benchmark"
    );

    console.log(
        `  Target          ` +
        `${config.baseUrl}/t/${config.publicCode}`
    );

    console.log(
        `  Mode            ${config.mode}`
    );

    console.log(
        `  Requests/run    ${config.requests}`
    );

    console.log(
        `  Concurrency     ${config.concurrency}`
    );

    console.log(
        `  Duplicate rate  ` +
        `${round(
            config.duplicateRate * 100
        )}%`
    );

    console.log(
        `  Runs            ${config.runs}`
    );

    console.log(
        `  Seed            ${config.seed}`
    );

    const runs = [];

    for (
        let run = 1;
        run <= config.runs;
        run += 1
    ) {
        const result =
            await runOnce(config, run);

        runs.push(result);
        printRun(result);
    }

    const summary = {
        createdAt:
            new Date().toISOString(),

        config,

        median: {
            successRatePct: round(
                median(
                    runs.map(
                        (run) => run.successRatePct
                    )
                )
            ),

            throughputRps: round(
                median(
                    runs.map(
                        (run) => run.throughputRps
                    )
                )
            ),

            p50Ms: round(
                median(
                    runs.map((run) => run.p50Ms)
                )
            ),

            p95Ms: round(
                median(
                    runs.map((run) => run.p95Ms)
                )
            ),

            p99Ms: round(
                median(
                    runs.map((run) => run.p99Ms)
                )
            ),

            durableStickerOpenedWrites:
                round(
                    median(
                        runs.map(
                            (run) =>
                                run.durableStickerOpenedWrites
                        )
                    )
                ),

            duplicateWritesAvoided:
                round(
                    median(
                        runs.map(
                            (run) =>
                                run.duplicateWritesAvoided
                        )
                    )
                ),

            writeSuppressionPct:
                round(
                    median(
                        runs.map(
                            (run) =>
                                run.writeSuppressionPct
                        )
                    )
                )
        },

        validRuns:
            runs.filter((run) => run.valid)
                .length,

        runs
    };

    const outputDir = path.join(
        process.cwd(),
        "benchmarks",
        "results"
    );

    await mkdir(outputDir, {
        recursive: true
    });

    const timestamp =
        summary.createdAt.replace(
            /[:.]/g,
            "-"
        );

    const outputPath = path.join(
        outputDir,
        `nfc-${config.mode}-${timestamp}.json`
    );

    await writeFile(
        outputPath,
        `${JSON.stringify(
            summary,
            null,
            2
        )}\n`,
        "utf8"
    );

    console.log(
        "\nMedian across runs"
    );

    console.log(
        `  Success rate          ` +
        `${summary.median.successRatePct}%`
    );

    console.log(
        `  Throughput            ` +
        `${summary.median.throughputRps} req/s`
    );

    console.log(
        `  Latency p50/p95/p99   ` +
        `${summary.median.p50Ms} / ` +
        `${summary.median.p95Ms} / ` +
        `${summary.median.p99Ms} ms`
    );

    console.log(
        `  Durable opens         ` +
        `${summary.median.durableStickerOpenedWrites}`
    );

    console.log(
        `  Writes avoided        ` +
        `${summary.median.duplicateWritesAvoided} ` +
        `(${summary.median.writeSuppressionPct}%)`
    );

    console.log(
        `  Valid runs            ` +
        `${summary.validRuns}/${runs.length}`
    );

    console.log(
        `  Raw result            ` +
        `${path.relative(
            process.cwd(),
            outputPath
        )}`
    );

    if (
        summary.validRuns !== runs.length
    ) {
        process.exitCode = 1;
    }
}

main()
    .catch((error) => {
        console.error(
            error instanceof Error
                ? error.stack ?? error.message
                : error
        );

        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
