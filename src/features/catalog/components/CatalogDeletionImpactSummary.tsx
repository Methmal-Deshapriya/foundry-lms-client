import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api";
import type { CatalogDeletionImpact } from "../catalogApi";

export function CatalogDeletionImpactSummary({ impact, isLoading, error }: { impact?: CatalogDeletionImpact; isLoading: boolean; error?: unknown }) {
  if (isLoading) return <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground" aria-live="polite">Checking course, curriculum, and learner history…</div>;
  if (error) return <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{getApiErrorMessage(error, "Could not check whether permanent deletion is safe.")}</div>;
  if (!impact) return null;
  const inventory: (readonly [string, number])[] = [
    ["Courses", impact.courses ?? 0],
    ["Intakes", impact.intakes ?? 0],
    ["Curriculum links", impact.curriculumLinks ?? 0],
    ["Enrollments / history", impact.enrollments ?? impact.history ?? 0],
  ];
  if (impact.projects !== undefined) inventory.push(["Projects", impact.projects]);
  // EnrollmentRequest.intake is a Restrict FK — a nonzero count here blocks
  // deletion even with everything else clear. See Finding C of the
  // 2026-08-30 system guide/audit.
  if (impact.enrollmentRequests !== undefined) inventory.push(["Enrollment requests", impact.enrollmentRequests]);
  return <div className={impact.deletable ? "space-y-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3" : "space-y-3 rounded-md border border-destructive/40 bg-destructive/10 p-3"} aria-live="polite">
    <div className="flex items-start gap-2">{impact.deletable ? <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" /> : <AlertTriangle className="mt-0.5 size-4 text-destructive" />}<div><p className="text-sm font-semibold">{impact.deletable ? "Only unused setup will be removed" : "Permanent deletion is blocked"}</p><p className="text-xs text-muted-foreground">{impact.deletable ? "No curriculum or learner history was found." : "Keep this record archived so history remains intact."}</p></div></div>
    <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">{inventory.map(([label, value]) => <div key={label} className="rounded border bg-background/60 px-2 py-1.5"><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold tabular-nums">{value}</dd></div>)}</dl>
  </div>;
}
