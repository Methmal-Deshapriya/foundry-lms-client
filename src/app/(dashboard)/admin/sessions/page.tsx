import SessionLibraryManager from "@/features/sessions/components/admin/SessionLibraryManager";
import { AdminCatalogPageHeader } from "@/features/catalog/components/AdminCatalogPageHeader";
import { Icons } from "@/lib/icons";

export default function AdminSessionLibraryPage() {
  return (
    <div className="space-y-6 pb-20">
      <AdminCatalogPageHeader
        title="Session Library"
        description="Create teaching resources once, then attach them to one or many course curricula."
        icon={Icons.sessionLibrary}
      />
      <SessionLibraryManager />
    </div>
  );
}
