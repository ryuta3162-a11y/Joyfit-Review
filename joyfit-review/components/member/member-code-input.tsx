"use client";

import { useCallback, useRef, type ClipboardEvent, type KeyboardEvent } from "react";

import { memberFormDigitClass } from "@/components/member/member-form-styles";
import { cn } from "@/lib/utils";

const LENGTH = 10;

type Props = {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  id?: string;
};

export function MemberCodeInput({ value, onChange, invalid, id }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");

  const applyDigits = useCallback(
    (next: string) => {
      onChange(next.replace(/\D/g, "").slice(0, LENGTH));
    },
    [onChange],
  );

  const focusAt = (index: number) => {
    const i = Math.max(0, Math.min(index, LENGTH - 1));
    refs.current[i]?.focus();
    refs.current[i]?.select();
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text");
    applyDigits(pasted);
    const nextFocus = Math.min(pasted.replace(/\D/g, "").length, LENGTH - 1);
    requestAnimationFrame(() => focusAt(nextFocus));
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      focusAt(index - 1);
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusAt(index - 1);
      return;
    }
    if (event.key === "ArrowRight" && index < LENGTH - 1) {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const handleChange = (index: number, raw: string) => {
    const only = raw.replace(/\D/g, "");
    if (!only) {
      const next = digits.slice();
      next[index] = "";
      applyDigits(next.join(""));
      return;
    }
    if (only.length > 1) {
      applyDigits(digits.slice(0, index).join("") + only);
      focusAt(index + only.length);
      return;
    }
    const next = digits.slice();
    next[index] = only;
    applyDigits(next.join(""));
    if (index < LENGTH - 1) focusAt(index + 1);
  };

  return (
    <div
      id={id}
      role="group"
      aria-label="会員番号10桁"
      className="grid grid-cols-10 gap-1.5 sm:gap-2"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          aria-label={`会員番号 ${index + 1}桁目`}
          aria-invalid={invalid || undefined}
          className={cn(memberFormDigitClass, invalid && "border-[color:var(--joyfit-red)]/40")}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}
