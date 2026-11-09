import { Quote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Marquee } from "@/components/ui/marquee";
import { TESTIMONIALS, type Testimonial } from "@/data/testimonials";

const ACCENT = "bg-zinc-100 text-[#191919]";

// Two rows instead of the old 3-column grid — split the list roughly in
// half rather than tying a specific student to a specific row, so editing
// src/data/testimonials.ts (add/remove/reorder) never needs a matching
// change here.
const midpoint = Math.ceil(TESTIMONIALS.length / 2);
const ROW_ONE = TESTIMONIALS.slice(0, midpoint);
const ROW_TWO = TESTIMONIALS.slice(midpoint);

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex h-full w-80 shrink-0 flex-col rounded-2xl border border-zinc-200 bg-white p-5 sm:w-96 sm:p-6">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${ACCENT}`}>
        <Quote className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="font-alt mb-5 flex-1 text-sm leading-relaxed text-[#3F3F46]">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      <div className="flex items-center gap-3 border-t border-zinc-100 pt-4">
        <Avatar size="lg">
          <AvatarFallback className={`text-sm font-semibold ${ACCENT}`}>
            {testimonial.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-alt truncate text-sm font-semibold text-[#191919]">
            {testimonial.name}
          </p>
          <p className="font-alt truncate text-xs text-[#71717A]">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Testimonials
 *
 * Renders every entry in src/data/testimonials.ts as two auto-scrolling
 * rows — that file is the one place to edit to add, remove, or reorder
 * what shows here. Row 1 drifts right-to-left, row 2 the opposite way;
 * hovering (or focusing) either row pauses just that row.
 */
export function Testimonials() {
  return (
    <div className="w-full">
      <div className="mx-auto max-w-6xl px-2">
        <div className="max-w-2xl mb-8 sm:mb-10">
          <p className="font-alt flex items-center gap-2 text-xs font-semibold tracking-widest text-[#71717A] uppercase mb-2">
            <span className="text-[#E91717]">—</span> What our students say
          </p>
          <h2 className="font-sans text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-[#191919]">
            What our students say
          </h2>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5">
        <Marquee durationSeconds={50}>
          {ROW_ONE.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </Marquee>
        <Marquee reverse durationSeconds={55}>
          {ROW_TWO.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </Marquee>
      </div>
    </div>
  );
}

export default Testimonials;
