import React from "react";
import Link from "next/link";
import { ArrowRight, Video, CalendarClock, BookOpen, ClipboardCheck, Award } from "lucide-react";
import { Reveal, RevealItem } from "@/components/ui/reveal";

const FACTS = [
  { icon: Video, title: "Weekly", body: "Live sessions" },
  { icon: CalendarClock, title: "2–3 hrs", body: "Per session" },
  { icon: Award, title: "3–4 months", body: "Typical programme" },
];

const STAGES = [
  {
    number: "01",
    icon: Video,
    title: "Weekly live sessions",
    description: "Join guided online sessions each week, typically lasting 2–3 hours.",
    metadata: "Live · Interactive · Instructor-led",
  },
  {
    number: "02",
    icon: CalendarClock,
    title: "Learn through a clear programme",
    description: "Most programmes run for approximately 3–4 months, giving you time to learn, practise, and make steady progress.",
    metadata: "Approximately 12–16 weeks",
  },
  {
    number: "03",
    icon: BookOpen,
    title: "Study materials and notes",
    description: "Access organised notes, lesson resources, examples, and supporting materials throughout the programme.",
    metadata: "Resources available online",
  },
  {
    number: "04",
    icon: ClipboardCheck,
    title: "Assignments and quizzes",
    description: "Reinforce each topic through practical assignments, short quizzes, and guided learning activities.",
    metadata: "Practise · Review · Improve",
  },
  {
    number: "05",
    icon: Award,
    title: "Mentorship and certification",
    description: "Receive direct guidance when you need support and earn a digitally shareable certificate after completing the required learning activities.",
    metadata: "Direct mentorship · Shareable certificate",
  },
];

export function LearningExperience() {
  return (
    <div className="w-full max-w-6xl mx-auto px-2">

      <div className="mb-8 flex flex-wrap items-start justify-between gap-6 sm:mb-10">
        <div className="max-w-2xl">
          <p className="font-alt flex items-center gap-2 text-xs font-semibold tracking-widest text-[#71717A] uppercase mb-2">
            <span className="text-[#E91717]">—</span> A simple, structured approach
          </p>
          <h2 className="font-sans text-3xl sm:text-4xl font-bold text-[#191919] leading-tight tracking-tight">
            How learning works
          </h2>
        </div>
        <Link
          href="/consultations"
          className="hidden h-11 shrink-0 items-center gap-2 rounded-full border border-zinc-200 px-5 font-alt text-sm font-semibold text-[#191919] transition-colors hover:border-zinc-300 hover:bg-zinc-50 sm:inline-flex"
        >
          Learn more
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        <Reveal className="text-left">
          <p className="font-alt text-[#71717A] text-sm sm:text-base max-w-md">
            Structured live learning, practical activities, and direct guidance — designed to help you understand
            concepts and apply them consistently.
          </p>

          <div className="bg-zinc-100 rounded-2xl p-4 sm:p-5 mt-5 sm:mt-6 grid grid-cols-3 gap-4">
            {FACTS.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <div className="h-9 w-9 rounded-lg bg-white text-[#191919] flex items-center justify-center mb-2.5">
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </div>
                <p className="font-alt text-base font-semibold text-[#191919]">{title}</p>
                <p className="font-alt text-sm text-[#71717A] leading-snug">{body}</p>
              </div>
            ))}
          </div>

          <p className="font-alt text-sm text-[#71717A]/80 mt-5 max-w-md">
            A consistent weekly rhythm helps you move from understanding a concept to applying it with confidence.
          </p>
        </Reveal>

        <Reveal stagger={0.08}>
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const isLast = i === STAGES.length - 1;
            return (
              <RevealItem key={stage.number} className="relative flex gap-4">
                {!isLast && (
                  <span
                    className="absolute left-[19px] top-10 bottom-0 w-px bg-zinc-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative z-10 shrink-0 h-10 w-10 flex items-center justify-center font-mono text-base font-bold text-[#191919]">
                  {stage.number}
                </div>
                <div className={isLast ? "pb-0" : "pb-7 sm:pb-8"}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-[#191919]" aria-hidden="true" />
                    <h3 className="font-sans font-semibold text-base text-[#191919]">{stage.title}</h3>
                  </div>
                  <p className="font-alt text-sm text-[#71717A] leading-relaxed">{stage.description}</p>
                  <p className="font-alt text-xs text-[#71717A] font-medium mt-1.5">{stage.metadata}</p>
                </div>
              </RevealItem>
            );
          })}
        </Reveal>
      </div>
    </div>
  );
}

export default LearningExperience;
