import { Layers, BookOpen, Compass } from "lucide-react";
import type { PublicServiceConfig } from "@/components/marketing/public-service/types";
import { SERVICE_ACCENT } from "@/components/marketing/public-service/accent";

export const pretechServiceConfig: PublicServiceConfig = {
  basePath: "/pretech-courses",
  accent: SERVICE_ACCENT,
  hero: {
    eyebrow: "PreTech",
    title: "Build a strong foundation before",
    highlight: "university starts",
    description:
      "Structured preparation in the core subjects every BICT, BBST and BET student needs — built to make your first year feel familiar, not overwhelming.",
    illustration: {
      src: "/pretech.webp",
      alt: "A student preparing for university with PreTech coursework",
      width: 1536,
      height: 1024,
    },
    indicators: [
      { icon: Layers, label: "4 core subjects" },
      { icon: BookOpen, label: "Exam-style practice" },
      { icon: Compass, label: "Foundation-level pacing" },
    ],
  },
  categorySection: {
    title: "Choose your",
    highlight: "subject",
    description: "Start with the subject you want to strengthen before your first semester.",
    itemLabel: "subjects",
    items: [],
  },
  processSection: {
    title: "How PreTech works",
    description: "A steady path from assessing your foundation to being ready for your first university modules.",
    steps: [
      { title: "Assess your foundation", description: "See where you stand before your first semester begins." },
      { title: "Learn core theory", description: "Build a clear understanding of the key concepts in each subject." },
      { title: "Practise questions", description: "Work through exam-style problems to build confidence." },
      { title: "Prepare for university modules", description: "Enter your first year with the foundations already in place." },
    ],
  },
  faqSection: {
    title: "Frequently asked questions",
    items: [
      {
        question: "Do I need to have studied these subjects before?",
        answer:
          "Some subjects assume no prior background, while others build on general secondary-level knowledge. Each subject page shows what's expected before you start.",
      },
      {
        question: "Which subject should I start with?",
        answer:
          "Most students begin with Mathematics and Physics, since they underpin the other subjects, but you can start wherever you feel least confident.",
      },
      {
        question: "Is this the same as my university's syllabus?",
        answer:
          "PreTech covers the core foundations shared across BICT, BBST and BET rather than one specific university's syllabus, so it transfers well regardless of where you enrol.",
      },
      {
        question: "Can I study more than one subject at a time?",
        answer:
          "Yes. Many students work through two subjects in parallel, especially Mathematics alongside Physics or Statistics.",
      },
      {
        question: "How is this different from the IT bootcamps?",
        answer:
          "PreTech is aimed at preparing you before university starts, while the IT bootcamps are industry-facing tracks for building job-ready skills.",
      },
    ],
  },
  ctaSection: {
    title: "Pick a subject and start preparing.",
    description: "Compare the modules inside each subject and start at the level that matches where you are right now.",
    primaryLabel: "Explore subjects",
    secondaryLabel: "Not sure where to begin?",
    secondaryHref: "/consultations",
  },
};
