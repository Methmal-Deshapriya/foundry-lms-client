import { Badge } from "@/components/ui/badge";
import { CATALOG_STATUS_STYLES } from "@/lib/statusColors";
import type { CatalogStatus } from "../catalogApi";

const STATUS_LABELS: Record<CatalogStatus, string> = {
  PUBLISHED: "Published",
  DRAFT: "Unpublished",
  ARCHIVED: "Archived",
};

export function CatalogStatusBadge({ status }: { status: CatalogStatus }) {
  return (
    <Badge variant="outline" className={CATALOG_STATUS_STYLES[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
