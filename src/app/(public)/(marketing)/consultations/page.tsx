"use client";

import React from "react";
import { Reveal } from "@/components/ui/reveal";
import { PageSlide } from "@/components/marketing/catalog/PageSlide";
import { ContactCTAButton } from "@/components/marketing/catalog/ContactCTAButton";

export default function ConsultationsPage() {
  return (
    <PageSlide background="#FAFAFA">
      <div className="w-full max-w-5xl mx-auto px-2">
        <div className="flex min-h-[65vh] flex-col items-center justify-center">
          <Reveal className="text-center max-w-3xl mx-auto">
            <p className="font-alt flex items-center justify-center gap-2 text-sm sm:text-base font-semibold tracking-widest text-[#71717A] uppercase mb-4">
              <span className="text-[#E91717]">—</span> Project Consultations
            </p>
            <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl font-bold text-[#191919] leading-tight tracking-tight">
              Guidance when it actually matters
            </h1>
            <p className="font-alt text-[#71717A] text-base sm:text-lg mt-5 max-w-lg mx-auto">
              We help students push university and research projects across the finish line.
            </p>
            <div className="mt-8">
              <ContactCTAButton
                message="Hello! I'd like to book a project consultation session."
                label="Book a session"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </PageSlide>
  );
}
