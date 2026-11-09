export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  initials: string;
}

/**
 * The one place to edit what shows in the "What our students say" section
 * on the landing page — add, remove, or reorder entries here and the
 * section picks it up automatically.
 *
 * PLACEHOLDER CONTENT: every entry below is a sample, not a real student
 * quote. Replace these with actual student feedback before this goes live —
 * publishing fabricated testimonials on a real site is misleading to
 * visitors, even as a placeholder oversight.
 */
export const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    name: "Nadeesha P.",
    role: "Software Engineering Bootcamp",
    quote:
      "The weekly live sessions kept me accountable in a way self-paced courses never did. I went from barely knowing what a function was to shipping my own project in four months.",
    initials: "NP",
  },
  {
    id: "2",
    name: "Kasun W.",
    role: "Machine Learning Bootcamp",
    quote:
      "What stood out was how practical everything was — every concept came with an exercise, not just slides. The mentorship after hours made a huge difference when I got stuck.",
    initials: "KW",
  },
  {
    id: "3",
    name: "Hansika R.",
    role: "PreTech Courses",
    quote:
      "I started PreTech straight after my A/Ls with zero direction. The structured path and the calculator-and-ruler-on-the-desk kind of practice sessions genuinely got me university-ready.",
    initials: "HR",
  },
  {
    id: "4",
    name: "Dinuka S.",
    role: "Free Learning",
    quote:
      "Being able to start for free before committing to anything paid removed all the hesitation. I ended up finishing two courses back to back because the material was that good.",
    initials: "DS",
  },
  {
    id: "5",
    name: "Ishara F.",
    role: "DevOps Bootcamp",
    quote:
      "The certificate isn't just a PDF — I actually had to demonstrate the skills through assignments and a final project. That made it something I could talk about confidently in interviews.",
    initials: "IF",
  },
  {
    id: "6",
    name: "Tharindu M.",
    role: "Project Consultations",
    quote:
      "I was stuck on my final-year project for weeks. One consultation session helped me restructure the whole approach — my supervisor actually noticed the improvement.",
    initials: "TM",
  },
  {
    id: "7",
    name: "Chamodi L.",
    role: "Artificial Intelligence Bootcamp",
    quote:
      "Coming from a non-CS background, I was worried I'd be lost. The pacing and the mentorship meant I never felt like I was falling behind the rest of the cohort.",
    initials: "CL",
  },
  {
    id: "8",
    name: "Sahan G.",
    role: "PreTech Courses",
    quote:
      "The study materials were more organised than anything I'd used before — notes, examples, and practice all in one place instead of scattered across ten different sources.",
    initials: "SG",
  },
  {
    id: "9",
    name: "Piumi J.",
    role: "Software Engineering Bootcamp",
    quote:
      "Real-world projects, not toy examples. By the time I finished, I had actual work to show, not just a certificate saying I'd sat through a course.",
    initials: "PJ",
  },
];
