import {
  Atom,
  Calculator,
  BarChart3,
  BookOpen,
  Code2,
  Cpu,
  GitBranch,
  Globe,
  Languages,
  Sparkles,
  Terminal,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { createElement } from "react";

export const CATALOG_VISUALS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  cpu: Cpu,
  code2: Code2,
  workflow: Workflow,
  atom: Atom,
  calculator: Calculator,
  "bar-chart3": BarChart3,
  terminal: Terminal,
  "git-branch": GitBranch,
  globe: Globe,
  languages: Languages,
};

export const catalogVisual = (key: string) => CATALOG_VISUALS[key] ?? BookOpen;

export function CatalogIcon({ visualKey, className }: { visualKey: string; className?: string }) {
  return createElement(CATALOG_VISUALS[visualKey] ?? BookOpen, { className });
}
