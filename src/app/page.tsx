import type { Metadata } from "next";
import Link from "next/link";

import NfcScrollDemo from "@/components/home/NfcScrollDemo";
import styles from "./HomePage.module.css";

export const metadata: Metadata = {
  title: "TapCare | Simple support, one tap away",
  description:
    "Simple NFC and QR support tools for older adults and their caregivers.",
};

const actions = [
  {
    label: "Call",
    description: "Call the phone number.",
    icon: (
      <path
        d="M8 5.5c0-.8.7-1.5 1.5-1.5h2.2c.6 0 1.1.4 1.3 1l1.2 3.4c.2.6 0 1.2-.5 1.6l-1.5 1.1a15 15 0 0 0 6.7 6.7l1.1-1.5c.4-.5 1-.7 1.6-.5L25 17c.6.2 1 .7 1 1.3v2.2c0 .8-.7 1.5-1.5 1.5H23C14.7 22 8 15.3 8 7V5.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "WhatsApp",
    description: "Open the right conversation.",
    icon: (
      <>
        <path
          d="M17 25a9 9 0 1 0-7.2-3.6L9 25l3.8-.9A9 9 0 0 0 17 25Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M14 13.5c1.2 2.5 2.7 4 5.3 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    label: "Reminders",
    description: "Show a simple everyday note.",
    icon: (
      <>
        <rect
          x="8"
          y="7"
          width="18"
          height="18"
          rx="4"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M12 13h10M12 17h7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    label: "Useful links",
    description: "Open trusted information directly.",
    icon: (
      <>
        <path
          d="m14.5 18.5-2 2a4 4 0 0 1-5.7-5.7l3.5-3.5a4 4 0 0 1 5.7 0"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="m19.5 13.5 2-2a4 4 0 0 1 5.7 5.7l-3.5 3.5a4 4 0 0 1-5.7 0"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="m13 19 8-8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </>
    ),
  },
];

function NfcMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
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
  );
}

function HeroScene() {
  return (
    <div className={styles.heroVisual}>
      {/* soft depth layers */}
      <div className={styles.heroGlowOne} />
      <div className={styles.heroGlowTwo} />

      {/* back wall / furniture */}
      <div className={styles.heroCabinet}>
        <p className={styles.heroCabinetLabel}>Everyday support</p>

        <div className={styles.heroCabinetLine} />

        <div className={styles.heroPlant}>
          <span />
          <span />
          <span />
          <span />
          <div />
        </div>
      </div>

      {/* little annotation */}
      <div className={styles.heroNote}>
        <span>one small tap</span>

        <svg
          viewBox="0 0 130 70"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M112 10C91 17 73 32 25 56M38 44L25 56L42 58"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* physical NFC sticker */}
      <div className={styles.heroStickerWrap}>
        <div className={styles.heroSticker}>
          <NfcMark className="h-10 w-10" />

          <span>TapCare</span>
        </div>

        <div className={styles.heroStickerShadow} />
      </div>

      {/* phone */}
      <div className={styles.heroPhone}>
        <div className={styles.heroPhoneScreen}>
          <div className={styles.heroPhoneIsland} />

          <div className={styles.heroPhoneHeader}>
            <span className={styles.heroTinyLogo}>
              <NfcMark className="h-3.5 w-3.5" />
            </span>

            <span>TapCare</span>
          </div>

          <div className={styles.heroPhoneContent}>
            <div className={styles.heroActionIcon}>
              <svg
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M8 6.5C8 5.7 8.7 5 9.5 5h2.2c.6 0 1.1.4 1.3 1l1.1 3.2c.2.6 0 1.2-.5 1.6l-1.4 1a14.4 14.4 0 0 0 6 6l1-1.4c.4-.5 1-.7 1.6-.5L24 17c.6.2 1 .7 1 1.3v2.2c0 .8-.7 1.5-1.5 1.5H22C14.3 22 8 15.7 8 8V6.5Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <p>Caregiver</p>

            <h3>Call Jason</h3>

            <span className={styles.heroPhoneDescription}>
              Reach the right person without searching through apps.
            </span>

            <div className={styles.heroPhoneButton}>
              Call caregiver
            </div>
          </div>

          <div className={styles.heroPhoneBar} />
        </div>
      </div>

      {/* small floating tag */}
      <div className={styles.heroFloatingTag}>
        <span className={styles.heroFloatingDot} />
        No app hunting
      </div>

      {/* foreground blur gives photographic depth */}
      <div className={styles.heroForeground} />
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="overflow-x-clip bg-[#f7f4ec] text-[#173c35]">
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#173c35]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2f6d5a] text-white">
            <NfcMark className="h-4 w-4" />
          </span>

          <span className="font-semibold tracking-[-0.02em]">
            TapCare
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-4 py-2.5 text-sm font-medium text-[#31564a] transition hover:bg-[#173c35]/5"
          >
            Log in
          </Link>

          <Link
            href="/signup"
            className="rounded-full bg-[#2f6d5a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#285e4e]"
          >
            Sign up
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroPill}>
            <NfcMark className="h-4 w-4" />

            <span>NFC shortcuts for everyday support</span>
          </div>

          <h1>
            Simple support,
            <br />
            <em>one tap away.</em>
          </h1>

          <p className={styles.heroSubtitle}>
            TapCare turns a small NFC sticker into a direct
            shortcut for elderly that need a little help navigating their smartphones.
          </p>

          <div className={styles.heroActions}>
            <Link
              href="#how-it-works"
              className={styles.heroPrimary}
            >
              See how it works

              <span aria-hidden="true">↓</span>
            </Link>

            <Link
              href="/signup"
              className={styles.heroSecondary}
            >
              Set up a sticker
            </Link>
          </div>
        </div>

        <HeroScene />

        <div className={styles.heroScrollHint}>
          <span>Scroll to see a tap in action</span>
          <div />
        </div>
      </section>

      <NfcScrollDemo />

      <section className="bg-[#faf8f2] px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5b8172]">
              One sticker, many uses
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-[#173c35] md:text-6xl">
              A shortcut to what matters.
            </h2>

            <p className="mt-5 text-base leading-7 text-[#64766f] md:text-lg">
              The same simple tap can lead to different kinds of
              support, depending on what a caregiver sets up.
            </p>
          </div>

          <div className="mt-16 grid border-y border-[#173c35]/10 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((action, index) => (
              <div
                key={action.label}
                className={`py-8 sm:px-7 lg:py-10 ${index > 0
                  ? "border-t border-[#173c35]/10 sm:border-t-0 sm:border-l"
                  : ""
                  } ${index === 2
                    ? "sm:border-l-0 sm:border-t lg:border-l lg:border-t-0"
                    : ""
                  }`}
              >
                <svg
                  viewBox="0 0 34 34"
                  className="h-8 w-8 text-[#2f6d5a]"
                  fill="none"
                  aria-hidden="true"
                >
                  {action.icon}
                </svg>

                <h3 className="mt-6 text-lg font-semibold text-[#173c35]">
                  {action.label}
                </h3>

                <p className="mt-2 max-w-[15rem] text-sm leading-6 text-[#6a7a74]">
                  {action.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f1eadb] px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6e7963]">
              Reusable stickers
            </p>

            <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.045em] text-[#173c35] md:text-6xl">
              Repurpose the sticker, not the setup.
            </h2>

            <p className="mt-6 max-w-xl text-base leading-7 text-[#667168] md:text-lg md:leading-8">
              The physical sticker points to TapCare rather than
              directly to a phone number, reminder, or external
              website. Change what happens behind it and the sticker
              stays right where it is.
            </p>

            <p className="mt-7 max-w-md font-serif text-lg italic text-[#527063]">
              New number? New reminder? Same sticker.
            </p>
          </div>

          <div className="relative min-h-[450px] rounded-[2.5rem] border border-[#173c35]/[0.07] bg-[#faf8f1] p-6 shadow-[0_30px_70px_rgba(44,69,57,0.1)] md:p-10">
            <div className="absolute left-[10%] top-[25%] flex h-28 w-28 items-center justify-center rounded-[1.8rem] bg-white shadow-[0_20px_50px_rgba(42,69,59,0.14)] md:h-36 md:w-36">
              <div className="text-center text-[#2f6d5a]">
                <NfcMark className="mx-auto h-10 w-10" />
                <span className="mt-2 block text-[9px] font-bold uppercase tracking-[0.18em]">
                  TapCare
                </span>
              </div>
            </div>

            <svg
              viewBox="0 0 180 100"
              className="absolute left-[31%] top-[27%] h-24 w-36 text-[#8a9c82] md:w-48"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M8 52c43 2 73-23 122-9 14 4 27 12 37 23m-18-2 18 2-8-17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 7"
              />
            </svg>

            <div className="absolute right-[7%] top-[13%] w-[49%] min-w-[170px] rounded-[1.8rem] border border-[#173c35]/10 bg-white p-5 shadow-sm md:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#809086]">
                Before
              </p>

              <p className="mt-3 text-sm font-semibold text-[#173c35]">
                Call old contact
              </p>

              <p className="mt-1 text-xs text-[#73817b]">
                9123 4567
              </p>
            </div>

            <div className="absolute bottom-[11%] right-[7%] w-[49%] min-w-[170px] rounded-[1.8rem] bg-[#2f6d5a] p-5 text-white shadow-[0_20px_45px_rgba(47,109,90,0.2)] md:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">
                Updated
              </p>

              <p className="mt-3 text-sm font-semibold">
                Call Jason
              </p>

              <p className="mt-1 text-xs text-white/70">
                Same physical sticker
              </p>

              <div className="mt-4 inline-flex rounded-full bg-white/12 px-3 py-1.5 text-[10px] font-semibold">
                ✓ Ready immediately
              </div>
            </div>

            <div className="absolute bottom-[11%] left-[8%] max-w-[110px] -rotate-3 font-serif text-sm italic leading-5 text-[#678071]">
              leave me right here ↗
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f4ec] px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid overflow-hidden rounded-[2.8rem] border border-[#173c35]/[0.07] lg:grid-cols-2">
            <div className="bg-[#dfe9dc] p-8 md:p-14 lg:p-16">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5e7b70]">
                For older adults
              </p>

              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] text-[#173c35] md:text-5xl">
                Tap.
                <br />
                That&apos;s basically it.
              </h2>

              <div className="mt-10 space-y-5 text-[#5e7169]">
                <p className="border-t border-[#173c35]/10 pt-5">
                  No TapCare account needed to use a sticker.
                </p>

                <p className="border-t border-[#173c35]/10 pt-5">
                  No searching through several apps or screens.
                </p>

                <p className="border-t border-[#173c35]/10 pt-5">
                  The action is done for you within a tap.
                </p>
              </div>
            </div>

            <div className="bg-[#fffdf8] p-8 md:p-14 lg:p-16">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7854]">
                For caregivers
              </p>

              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] text-[#173c35] md:text-5xl">
                Set it up.
                <br />
                Change it anytime.
              </h2>

              <div className="mt-10 space-y-5 text-[#64756e]">
                <p className="border-t border-[#173c35]/10 pt-5">
                  Choose what each sticker should do.
                </p>

                <p className="border-t border-[#173c35]/10 pt-5">
                  Preview and connect NFC stickers.
                </p>

                <p className="border-t border-[#173c35]/10 pt-5">
                  Update the content later without replacing the sticker.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#173c35] px-6 py-24 text-[#f8f5ec] md:px-10 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 md:grid-cols-2 md:gap-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9bbbad]">
              Designed thoughtfully
            </p>

            <h2 className="mt-4 max-w-lg text-4xl font-semibold tracking-[-0.045em] md:text-5xl">
              Simple on the outside.
              <br />
              Managed behind the scenes.
            </h2>

            <p className="mt-6 max-w-lg leading-7 text-[#c5d2cc]">
              Public stickers use opaque TapCare codes rather than
              internal identifiers, while caregiver and administrator
              functions require authenticated accounts.
            </p>
          </div>

          <div className="space-y-8 text-sm leading-6 text-[#c5d2cc]">
            <div className="border-t border-white/10 pt-6">
              <h3 className="font-semibold text-white">
                Privacy by design
              </h3>

              <p className="mt-2">
                TapCare is designed to collect only the information
                needed to operate and maintain the service.
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="font-semibold text-white">
                A support tool, not an emergency service
              </h3>

              <p className="mt-2">
                TapCare is not a medical monitoring or emergency
                response system. Urgent help should still go through
                the appropriate emergency or care service.
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="font-semibold text-white">
                CCSGP Fellowship Award Project
              </h3>

              <p className="mt-2">
                TapCare explores how simple physical touchpoints can
                make common digital support actions easier to access.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f4e7ca] px-6 py-24 text-center md:px-10 md:py-32">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b755b]">
            Ready when they need it
          </p>

          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[#173c35] md:text-6xl">
            Make everyday support
            <br />
            <span className={styles.serifAccent}>
              easier to reach.
            </span>
          </h2>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-[#2f6d5a] px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#285e4e]"
            >
              Sign up as caregiver
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-[#173c35]/10 bg-white/55 px-6 py-3.5 text-sm font-semibold text-[#234b40] transition hover:bg-white"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#f7f4ec] px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-[#173c35]/10 pt-8 text-sm text-[#6b7974] sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="font-semibold text-[#173c35]"
          >
            TapCare
          </Link>

          <p>
            Simple support, one tap away.
          </p>
        </div>
      </footer>
    </main>
  );
}
