import { CheckCircle2, MailWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EMAIL_VERIFICATION_STYLES } from "@/lib/statusColors";

/** Small Verified/Unverified indicator, shared by the Users table, the
 * admin user detail sheet, and the self Account page header. */
export function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <Badge
      variant="outline"
      className={EMAIL_VERIFICATION_STYLES[verified ? "VERIFIED" : "UNVERIFIED"]}
    >
      {verified ? (
        <CheckCircle2 className="mr-1 size-3" aria-hidden="true" />
      ) : (
        <MailWarning className="mr-1 size-3" aria-hidden="true" />
      )}
      {verified ? "Verified" : "Unverified"}
    </Badge>
  );
}
