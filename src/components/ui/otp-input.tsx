"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
  id?: string;
}

/**
 * Six separate digit boxes instead of one text field — matches the OTP
 * pattern most apps use. Value/onChange still deal in a single string so
 * it drops into the existing zod schema (`code: z.string().regex(/^\d{6}$/)`)
 * unchanged.
 */
export function OtpInput({ value, onChange, onBlur, length = 6, disabled, error, id }: OtpInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const digits = React.useMemo(() => {
    const arr = value.split("").slice(0, length);
    while (arr.length < length) arr.push("");
    return arr;
  }, [value, length]);

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...digits];
      next[index] = "";
      onChange(next.join(""));
      return;
    }
    const next = [...digits];
    let i = index;
    for (const ch of cleaned) {
      if (i >= length) break;
      next[i] = ch;
      i++;
    }
    onChange(next.join(""));
    inputRefs.current[Math.min(i, length - 1)]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      onChange(next.join(""));
      inputRefs.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex justify-between gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          id={index === 0 ? id : undefined}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onBlur={onBlur}
          className={cn(
            "h-14 w-12 rounded-xl border border-zinc-200 bg-white text-center text-xl font-semibold text-[#191919] transition-colors focus-visible:border-[#191919] focus-visible:outline-none sm:h-16 sm:w-14",
            error && "border-[#C91414] focus-visible:border-[#C91414]"
          )}
        />
      ))}
    </div>
  );
}
