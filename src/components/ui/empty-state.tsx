import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * First-run empty state for a student page (My Courses, Certificates, My
 * Projects…). Rather than a bare "nothing here" box, it explains what the
 * page will hold, how it fills up, and shows a faded preview of that content
 * — so a brand-new student's first look reads as "here's what's coming", not
 * "this is empty". It disappears as soon as the page has real data.
 */
export function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  steps,
  preview,
  className,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  /** Exactly how the page fills up, in order — kept to three short steps. */
  steps: { title: string; description: string }[];
  /** A faded mock of the real content. Decorative only (hidden from assistive tech). */
  preview: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("@container overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="grid grid-cols-1 @3xl:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-6 p-6 @lg:p-8">
          <div className="space-y-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#191919] text-white">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-[#71717A] uppercase">
              <span className="text-[#E91717]">—</span> {eyebrow}
            </p>
            <h2 className="text-xl font-bold text-balance text-foreground">{title}</h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>

          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-foreground tabular-nums">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>

          {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
        </div>

        <div className="relative border-t border-border bg-[#FAFAFA] p-6 pt-14 @lg:p-8 @lg:pt-14 @3xl:border-t-0 @3xl:border-l" aria-hidden="true">
          <span className="absolute top-4 right-4 rounded-full border border-border bg-background px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            Preview
          </span>
          {/* Faded and non-interactive: it's a picture of what's coming, not content. */}
          <div className="pointer-events-none flex h-full items-center opacity-60 select-none">{preview}</div>
        </div>
      </div>
    </section>
  );
}
