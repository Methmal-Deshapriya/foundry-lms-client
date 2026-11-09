import { BadgeCheck, FolderGit2, MessagesSquare, Wallet } from "lucide-react";

// What a student actually leaves with: each one is a real feature of the
// platform (certificate verification, public student profiles, project
// review, the half-now/half-later payment option). A static display — it
// replaced a "what brings you here?" picker that looked clickable but did
// nothing (code review M06-15).
const OUTCOMES = [
  {
    icon: BadgeCheck,
    title: "A certificate employers can check",
    body: "Every certificate has its own code and a public page that confirms it's genuine.",
  },
  {
    icon: FolderGit2,
    title: "A portfolio of real projects",
    body: "Your projects live on your own public profile, ready to share with recruiters.",
  },
  {
    icon: MessagesSquare,
    title: "Feedback from mentors",
    body: "Submitted work is reviewed by the people teaching the course, not an algorithm.",
  },
  {
    icon: Wallet,
    title: "Fees that fit your budget",
    body: "Pay in full for a discount, or pay half now and the rest later.",
  },
];

export function Outcomes() {
  return (
    <div className="mx-auto w-full max-w-6xl px-2">
      <div className="mb-6 text-center sm:mb-8">
        <p className="font-alt text-xs font-semibold tracking-widest text-[#E91717] uppercase">Why Foundry Academy</p>
        <h2 className="mt-2 font-sans text-2xl font-bold tracking-tight text-[#191919] text-balance sm:text-3xl">
          What you leave with
        </h2>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {OUTCOMES.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#191919] text-white">
              <Icon className="size-4.5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-sans text-sm font-semibold text-[#191919]">{title}</h3>
              <p className="mt-1 font-alt text-xs leading-relaxed text-[#71717A]">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
