"use client";

import React from "react";

export function ContactCTAButton({
  message,
  label = "Get in touch",
}: {
  message: string;
  label?: string;
}) {
  const handleClick = () => {
    const phone = "94723622112";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-[#191919] hover:bg-[#27272A] text-white font-alt text-sm sm:text-base font-semibold transition-colors"
    >
      {label}
    </button>
  );
}
