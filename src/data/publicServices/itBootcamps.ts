import { Layers, Sparkles, Compass } from "lucide-react";
import type { PublicServiceConfig } from "@/components/marketing/public-service/types";
import { SERVICE_ACCENT } from "@/components/marketing/public-service/accent";

export const itBootcampsServiceConfig: PublicServiceConfig = {
  basePath: "/bootcamps",
  accent: SERVICE_ACCENT,
  hero: {
    eyebrow: "Bootcamps",
    title: "Build practical skills for the",
    highlight: "technology industry",
    description:
      "Explore structured learning pathways designed to help you understand core concepts, practise relevant skills, and build real projects.",
    illustration: {
      src: "/bootcamp.png",
      alt: "A student learning to code at a laptop, representing IT bootcamps",
      width: 1374,
      height: 1145,
    },
    indicators: [
      { icon: Layers, label: "4 learning tracks" },
      { icon: Sparkles, label: "Practical learning" },
      { icon: Compass, label: "Beginner-friendly pathways" },
    ],
  },
  categorySection: {
    title: "Choose your",
    highlight: "career path",
    description: "Start with the field that matches what you want to understand, create, or work toward.",
    itemLabel: "tracks",
    items: [],
  },
  processSection: {
    title: "How the bootcamps work",
    description: "A clear learning process that moves from understanding concepts to applying them.",
    steps: [
      { title: "Choose a path", description: "Select a field based on what you want to learn or create." },
      { title: "Learn the foundations", description: "Build a clear understanding of the important concepts." },
      { title: "Practise", description: "Apply what you learn through guided activities and exercises." },
      { title: "Build", description: "Use your knowledge in practical tasks and projects." },
    ],
  },
  faqSection: {
    title: "Frequently asked questions",
    items: [
      {
        question: "Do I need previous experience?",
        answer:
          "Some courses are designed for complete beginners, while others require foundational knowledge. Each course page clearly shows its level and prerequisites.",
      },
      {
        question: "How do I choose the correct learning track?",
        answer:
          "Start with what you want to create or understand. Software Engineering focuses on building applications, Machine Learning focuses on systems that learn from data, Artificial Intelligence covers broader intelligent systems, and DevOps focuses on software delivery and operations.",
      },
      {
        question: "Are the bootcamps practical?",
        answer:
          "Yes. The pathways combine conceptual learning with guided exercises, practical activities, and project-focused work.",
      },
      {
        question: "Can I follow more than one track?",
        answer:
          "Yes. The tracks are connected, and learners may continue into another pathway after building the necessary foundations.",
      },
      {
        question: "How long does a course take?",
        answer:
          "Course duration varies. The expected duration and learning level are shown on each individual course page.",
      },
    ],
  },
  ctaSection: {
    title: "Choose one direction and start exploring.",
    description:
      "You can compare the available courses inside each pathway and begin at the level that matches your current experience.",
    primaryLabel: "Explore bootcamp tracks",
    secondaryLabel: "Not sure where to begin?",
    secondaryHref: "/consultations",
  },
};
