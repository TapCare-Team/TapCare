"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./NfcScrollDemo.module.css";

const stages = [
    {
        eyebrow: "01 · Place",
        title: "Put it somewhere useful.",
        body: "A TapCare sticker can live beside a medicine box, on a notice board, or anywhere a simple shortcut would help.",
    },
    {
        eyebrow: "02 · Tap",
        title: "Just bring the phone close.",
        body: "No app menu to hunt through. Tap or scan the sticker when support is needed.",
    },
    {
        eyebrow: "03 · Open",
        title: "TapCare opens the right action.",
        body: "The sticker can open a caregiver call, WhatsApp, a reminder, useful information, or another trusted resource.",
    },
    {
        eyebrow: "04 · Done",
        title: "No menus. No searching.",
        body: "The caregiver handles the setup. Using it stays simple.",
    },
] as const;

export default function NfcScrollDemo() {
    const sectionRef = useRef<HTMLElement | null>(null);
    const [stage, setStage] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        let frame = 0;

        const update = () => {
            frame = 0;

            const rect = section.getBoundingClientRect();

            // How far we have travelled since the section became pinned.
            const travelled = Math.max(0, -rect.top);

            const maxTravel =
                section.offsetHeight - window.innerHeight;

            if (maxTravel <= 0) return;

            const nextProgress = Math.min(
                1,
                travelled / maxTravel,
            );

            setProgress(nextProgress);

            let nextStage = 0;

            if (nextProgress >= 0.25) nextStage = 1;
            if (nextProgress >= 0.5) nextStage = 2;
            if (nextProgress >= 0.75) nextStage = 3;

            setStage(nextStage);
        };

        const onScroll = () => {
            if (frame) return;

            frame = window.requestAnimationFrame(update);
        };

        update();

        window.addEventListener("scroll", onScroll, {
            passive: true,
        });

        window.addEventListener("resize", onScroll);

        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);

            if (frame) {
                window.cancelAnimationFrame(frame);
            }
        };
    }, []);

    const copy = stages[stage];

    const approachProgress = Math.min(
        1, progress / 0.25,
    );

    const easedApproach =
        1 - Math.pow(1 - approachProgress, 3);

    const phoneX =
        70 - easedApproach * 55;

    const phoneRotation =
        5 - easedApproach * 4;

    return (
        <section
            ref={sectionRef}
            id="how-it-works"
            className="relative h-[350vh] bg-[#eef1e7]"
        >
            <div className="sticky top-0 h-screen overflow-hidden">
                <div className="mx-auto grid h-full w-full max-w-7xl gap-8 px-6 md:grid-cols-[0.75fr_1.25fr] md:items-center md:px-10 lg:gap-16">
                    {/* LEFT TEXT */}
                    <div className="relative z-10 flex flex-col justify-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4c796a]">
                            See how it works
                        </p>

                        <div
                            key={stage}
                            className="mt-8 animate-[fadeStage_450ms_ease]"
                        >
                            <p className="text-sm font-medium text-[#6d8b7e]">
                                {copy.eyebrow}
                            </p>

                            <h2 className="mt-3 max-w-xl text-4xl font-semibold tracking-[-0.04em] text-[#173c35] md:text-5xl lg:text-6xl">
                                {copy.title}
                            </h2>

                            <p className="mt-5 max-w-lg text-base leading-7 text-[#587068] md:text-lg">
                                {copy.body}
                            </p>
                        </div>

                        <div className="mt-10 flex items-center gap-2">
                            {stages.map((_, index) => (
                                <span
                                    key={index}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${index === stage
                                        ? "w-10 bg-[#2f6d5a]"
                                        : index < stage
                                            ? "w-5 bg-[#789c8d]"
                                            : "w-5 bg-[#b5c7bd]"
                                        }`}
                                />
                            ))}
                        </div>

                        <p className="mt-5 text-xs text-[#81958c]">
                            Scroll to continue
                        </p>
                    </div>

                    {/* RIGHT DEMO */}
                    <div
                        className={`${styles.scene} relative h-[76vh] max-h-[700px] min-h-[480px] overflow-hidden rounded-[2.5rem] border border-[#173c35]/[0.06]`}
                    >
                        {/* background cabinet */}
                        <div className="absolute left-[7%] top-[15%] h-[70%] w-[48%] rounded-[1.8rem] border border-[#173c35]/[0.08] bg-[#c9d1bd]">
                            <div className="absolute inset-x-[10%] top-[13%] h-px bg-[#173c35]/10" />

                            <div className="absolute left-[10%] top-[19%] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#577267]">
                                At home
                            </div>

                            {/* sticker */}
                            <div
                                className={`${styles.sticker} absolute right-[12%] top-[38%] flex h-[112px] w-[112px] items-center justify-center rounded-[1.6rem] bg-[#fffdf7]`}
                            >
                                {progress >= 0.18 && progress < 0.5 && (
                                    <div className="pointer-events-none absolute inset-0">
                                        <span className={styles.ripple} />
                                        <span className={styles.ripple} />
                                        <span className={styles.ripple} />
                                    </div>
                                )}

                                <div className="relative z-10 text-center">
                                    <svg
                                        viewBox="0 0 48 48"
                                        className="mx-auto h-9 w-9 text-[#2f6d5a]"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M16 17c4 4 4 10 0 14M22 12c7 7 7 17 0 24M28 7c10 10 10 24 0 34"
                                            stroke="currentColor"
                                            strokeWidth="2.4"
                                            strokeLinecap="round"
                                        />
                                    </svg>

                                    <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.15em] text-[#315c4e]">
                                        TapCare
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* phone */}
                        <div
                            className={`${styles.phone} absolute right-[7%] top-[7%] h-[90%] w-[35%] max-w-[260px] rounded-[2.8rem] border-[7px] border-[#183830] bg-[#183830] p-[5px] `}
                            style={{
                                transform:
                                    progress < 0.25
                                        ? `translateX(${phoneX}px) rotate(${phoneRotation}deg)`
                                        : progress < 0.5
                                            ? "translateX(15px) rotate(1deg)"
                                            : "translateX(0px) rotate(0deg)",
                            }}
                        >
                            <div className="relative h-full overflow-hidden rounded-[2rem] bg-[#faf8f1]">
                                <div className="absolute left-1/2 top-2 h-4 w-16 -translate-x-1/2 rounded-full bg-[#183830]" />

                                <div className="flex h-full flex-col px-5 pb-5 pt-12">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#658276]">
                                        TapCare
                                    </p>

                                    {/* stage 1 */}
                                    {stage === 0 && (
                                        <div className="my-auto text-center">
                                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e4ede3]">
                                                <svg
                                                    viewBox="0 0 48 48"
                                                    className="h-7 w-7 text-[#2f6d5a]"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M16 17c4 4 4 10 0 14M22 12c7 7 7 17 0 24M28 7c10 10 10 24 0 34"
                                                        stroke="currentColor"
                                                        strokeWidth="2.4"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                            </div>

                                            <p className="mt-4 text-sm font-semibold text-[#173c35]">
                                                Ready
                                            </p>
                                        </div>
                                    )}

                                    {/* stage 2 */}
                                    {stage === 1 && (
                                        <div className="my-auto text-center">
                                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e4ede3]">
                                                <span className="text-2xl">⌁</span>
                                            </div>

                                            <p className="mt-4 text-sm font-semibold text-[#173c35]">
                                                NFC detected
                                            </p>

                                            <p className="mt-1 text-[11px] text-[#71847d]">
                                                Hold close to open
                                            </p>
                                        </div>
                                    )}

                                    {/* stage 3 */}
                                    {stage === 2 && (
                                        <div className="my-auto">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0dcc0] text-xl">
                                                ☎
                                            </div>

                                            <p className="mt-5 text-xs text-[#77867f]">
                                                Caregiver
                                            </p>

                                            <h3 className="mt-1 text-xl font-semibold tracking-tight text-[#173c35]">
                                                Call Jason
                                            </h3>

                                            <p className="mt-2 text-xs leading-5 text-[#6c7e77]">
                                                The sticker opens the action set up by the caregiver.
                                            </p>

                                            <div className="mt-5 rounded-full bg-[#2f6d5a] px-4 py-3 text-center text-xs font-semibold text-white">
                                                Call caregiver
                                            </div>
                                        </div>
                                    )}

                                    {/* stage 4 */}
                                    {stage === 3 && (
                                        <div className="my-auto text-center">
                                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#dfeadf] text-2xl text-[#2f6d5a]">
                                                ✓
                                            </div>

                                            <h3 className="mt-5 text-lg font-semibold text-[#173c35]">
                                                That&apos;s it.
                                            </h3>

                                            <p className="mt-2 text-xs leading-5 text-[#6c7e77]">
                                                No searching through apps or menus.
                                            </p>
                                        </div>
                                    )}

                                    <div className="mx-auto mt-auto h-1 w-16 rounded-full bg-[#183830]/15" />
                                </div>
                            </div>
                        </div>

                        {stage === 1 && (
                            <div className="absolute bottom-[7%] right-[8%] -rotate-3 rounded-full bg-white/80 px-4 py-2 font-serif text-xs italic text-[#49675c] shadow-sm">
                                just tap ↖
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
