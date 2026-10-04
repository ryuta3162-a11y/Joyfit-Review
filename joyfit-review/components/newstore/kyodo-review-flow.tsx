"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";

import {
  memberFormChoiceClass,
  memberFormHintClass,
  memberFormTextareaClass,
} from "@/components/member/member-form-styles";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { brandCssVars, BRAND_THEMES } from "@/lib/brand";
import {
  buildKyodoReviewDraft,
  pickKyodoReviewChips,
} from "@/lib/newstore/kyodo-review";
import {
  DRAFT_FIELD_TITLE,
  DRAFT_PLACEHOLDER,
  MAX_REVIEW_POSITIVES,
  REVIEW_LP_COPIED,
  REVIEW_LP_GOOGLE_AGAIN,
  REVIEW_LP_SUBMIT_LABEL,
  REVIEW_LP_THANKS,
  REVIEW_LP_TITLE,
  REVIEW_POSITIVES_HINT,
  REVIEW_POSITIVES_TITLE,
  SUCCESS_DRAFT_LABEL,
  toggleLimited,
  type ClosingStore,
  type TodaVisitType,
} from "@/lib/newstore/toda-closing";
import { cn } from "@/lib/utils";

type Props = {
  store: ClosingStore;
};

function FieldLabel({
  children,
  required,
}: {
  children: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <p className="text-[14px] font-semibold tracking-tight text-zinc-800">
        {children}
      </p>
      {required ? (
        <span className="text-[11px] font-medium text-[color:var(--joyfit-red)]">
          必須
        </span>
      ) : null}
    </div>
  );
}

function VisitTypeButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "h-16 rounded-2xl text-[1.35rem] font-bold tracking-[0.18em] transition",
        selected
          ? "border border-[color:var(--joyfit-red)] bg-[color:var(--joyfit-red)] text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)]"
          : "border border-zinc-800/80 bg-white text-zinc-900 shadow-[0_4px_12px_rgba(24,24,27,0.08)] hover:-translate-y-0.5",
      )}
    >
      {label}
    </button>
  );
}

export function KyodoReviewFlow({ store }: Props) {
  const theme = BRAND_THEMES[store.brand];
  const brandVars = useMemo(() => brandCssVars(theme), [theme]);
  const googleReviewUrl = store.googleReviewUrl.trim();

  const [seed, setSeed] = useState(0);
  const [visitType, setVisitType] = useState<TodaVisitType | null>(null);
  const [positives, setPositives] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [draftTouched, setDraftTouched] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setSeed(Math.floor(Math.random() * 1_000_000_000) + 1);
  }, []);

  const visibleChips = useMemo(
    () => (seed ? pickKyodoReviewChips(seed, visitType) : []),
    [seed, visitType],
  );

  const liveDraft = useMemo(() => {
    if (!visitType || !seed) return "";
    return buildKyodoReviewDraft({
      storeName: store.name,
      visitType,
      positives,
      seed,
    });
  }, [store.name, visitType, positives, seed]);

  const shownDraft = draftTouched ? draft : liveDraft;
  const formReady = visitType !== null && positives.length > 0;

  function openGoogle(text: string) {
    try {
      void navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
    if (googleReviewUrl) {
      window.open(googleReviewUrl, "_blank", "noopener,noreferrer");
    }
  }

  function handleSubmit() {
    if (!formReady || visitType === null || sent) return;
    const generatedReview = shownDraft.trim();
    setDraft(generatedReview);
    setSent(true);
    openGoogle(generatedReview);
  }

  if (sent) {
    return (
      <div data-brand={store.brand} style={brandVars}>
        <div className="px-2 pb-8 pt-8 text-center text-white">
          <div className="survey-success-icon mx-auto" aria-hidden>
            <span className="survey-success-ring" />
            <span className="survey-success-ring survey-success-ring--delay" />
            <span className="survey-success-circle">
              <Check className="survey-success-check h-7 w-7" strokeWidth={2.75} />
            </span>
          </div>
          <h2 className="survey-success-fade-up mt-6 text-[22px] font-bold tracking-tight [text-shadow:0_2px_0_rgba(0,0,0,0.18)]">
            {REVIEW_LP_THANKS}
          </h2>
          <p className="survey-success-fade-up survey-success-fade-up--delay-1 mx-auto mt-3 max-w-xs text-[14px] leading-relaxed text-white/90">
            {REVIEW_LP_COPIED}
          </p>
        </div>

        <div className="space-y-5 rounded-[1.75rem] bg-white px-5 py-7 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
          {shownDraft ? (
            <div className="survey-success-fade-up survey-success-fade-up--delay-2 text-left">
              <p className="mb-2 text-[13px] font-semibold text-zinc-700">
                {SUCCESS_DRAFT_LABEL}
              </p>
              <pre className="whitespace-pre-wrap rounded-xl border border-zinc-800/75 bg-zinc-50 px-4 py-3 text-[13px] leading-relaxed text-zinc-800">
                {shownDraft}
              </pre>
            </div>
          ) : null}
          {googleReviewUrl ? (
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => openGoogle(shownDraft.trim())}
              className="survey-google-open-btn survey-success-fade-up survey-success-fade-up--delay-3 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[color:var(--joyfit-red)] px-4 text-[15px] font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)]"
            >
              {REVIEW_LP_GOOGLE_AGAIN}
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div data-brand={store.brand} style={brandVars}>
      <div className="px-2 pb-8 pt-4 text-center text-white">
        <div className="relative z-[1] mx-auto flex justify-center">
          <div className="w-[11.5rem] drop-shadow-[0_8px_16px_rgba(0,0,0,0.28)]">
            <Image
              src="/joyfit-logo-mark.png"
              alt="JOYFIT24"
              width={579}
              height={122}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
        </div>
        <h1 className="relative z-[1] mt-5 text-[1.55rem] font-bold tracking-tight [text-shadow:0_2px_0_rgba(0,0,0,0.2),0_10px_18px_rgba(0,0,0,0.22)]">
          {REVIEW_LP_TITLE}
        </h1>
        <p className="relative z-[1] mt-3 inline-flex rounded-full bg-white px-4 py-1.5 text-[13px] font-bold text-[color:var(--joyfit-red)] shadow-[0_8px_18px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)]">
          {store.name}
        </p>
        <p className="relative z-[1] mx-auto mt-3 max-w-xs text-[13px] leading-relaxed text-white/90">
          見学・体験どちらでもご利用ください
        </p>
      </div>

      <div className="space-y-5 rounded-[1.75rem] bg-white px-5 py-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
        <div className="grid grid-cols-2 gap-3">
          <VisitTypeButton
            label="見学"
            selected={visitType === "kengaku"}
            onClick={() => {
              setVisitType("kengaku");
              setPositives([]);
              setDraftTouched(false);
            }}
          />
          <VisitTypeButton
            label="体験"
            selected={visitType === "taiken"}
            onClick={() => {
              setVisitType("taiken");
              setPositives([]);
              setDraftTouched(false);
            }}
          />
        </div>

        <section className="space-y-2">
          <div className="space-y-1">
            <FieldLabel required>{REVIEW_POSITIVES_TITLE}</FieldLabel>
            <p className={memberFormHintClass}>
              {REVIEW_POSITIVES_HINT}（最大{MAX_REVIEW_POSITIVES}つ）
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleChips.map((opt) => {
              const active = positives.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={active}
                  className={memberFormChoiceClass(active)}
                  onClick={() =>
                    setPositives((prev) =>
                      toggleLimited(prev, opt, MAX_REVIEW_POSITIVES),
                    )
                  }
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <FieldLabel>{DRAFT_FIELD_TITLE}</FieldLabel>
          <Textarea
            value={shownDraft}
            onChange={(e) => {
              setDraftTouched(true);
              setDraft(e.target.value);
            }}
            rows={5}
            className={memberFormTextareaClass}
            autoComplete="off"
            placeholder={DRAFT_PLACEHOLDER}
          />
        </section>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!formReady}
          className="h-12 w-full rounded-2xl border-0 bg-[color:var(--joyfit-red)] text-base font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)] disabled:bg-zinc-200 disabled:text-zinc-400"
        >
          {REVIEW_LP_SUBMIT_LABEL}
        </Button>
      </div>
    </div>
  );
}
