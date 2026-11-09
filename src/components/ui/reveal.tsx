"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay (seconds) applied to direct motion children via variants propagation. */
  stagger?: number;
  /** Delay before this element's own animation starts. */
  delay?: number;
  as?: "div" | "section";
}

/**
 * Reveal
 *
 * Fades + slides content up once it scrolls into view. Renders content
 * immediately, with no animation, when the visitor prefers reduced motion.
 * Use `stagger` on a parent Reveal wrapping multiple <Reveal.Item> children
 * to cascade their entrance.
 */
export function Reveal({ children, className, stagger, delay = 0, as = "div" }: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const Comp = motion[as];

  if (shouldReduceMotion) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut", delay, staggerChildren: stagger }}
      variants={variants}
    >
      {children}
    </Comp>
  );
}

/**
 * A child of a staggering <Reveal>, inherits the parent's variants so it
 * animates in sequence rather than all at once.
 */
export function RevealItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}
