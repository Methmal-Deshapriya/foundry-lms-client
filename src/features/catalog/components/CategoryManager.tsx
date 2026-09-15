"use client";

import { useState, type FormEvent } from "react";
import {
  Archive,
  ArchiveRestore,
  Eye,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/store/hooks";
import { selectAuthUser } from "@/features/auth/authSelectors";
import { getApiErrorMessage } from "@/lib/api";
import { hasPermission, PERMISSIONS } from "@/lib/access";
import {
  type AdminCategory,
  type CategoryInput,
  useArchiveCategoryMutation,
  useCreateCategoryMutation,
  useDeleteCategoryPermanentlyMutation,
  useGetAdminCategoriesQuery,
  type AdminLearningServiceSummary,
  useLazyGetCategoryDeletionImpactQuery,
  usePublishCategoryMutation,
  useUnarchiveCategoryMutation,
  useUnpublishCategoryMutation,
  useUpdateCategoryMutation,
} from "../catalogApi";
import { AdminCatalogPageHeader } from "./AdminCatalogPageHeader";
import { AdminSummaryStrip } from "./AdminSummaryStrip";
import { CatalogDeletionImpactSummary } from "./CatalogDeletionImpactSummary";
import { CatalogStatusBadge } from "./CatalogStatusBadge";
import { NavigableTableRow } from "./NavigableTableRow";

const emptyCategory = (serviceId: string): CategoryInput => ({
  serviceId,
  slug: "",
  title: "",
  description: "",
  visualKey: "sparkles",
  audienceLabel: "",
  badgeLabel: "",
  sortOrder: 0,
});

const VISUAL_KEYS = [
  "sparkles",
  "cpu",
  "code2",
  "workflow",
  "calculator",
  "atom",
  "bar-chart3",
  "terminal",
  "git-branch",
  "globe",
  "languages",
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

type DestructiveAction = {
  type: "archive" | "delete";
  category: AdminCategory;
};

export function CategoryManager({
  service,
}: {
  service: AdminLearningServiceSummary;
}) {
  const { data, isLoading, isError, refetch } = useGetAdminCategoriesQuery({
    serviceId: service.id,
  });
  const categories = data?.categories ?? [];
  const user = useAppSelector(selectAuthUser);
  const canEdit = hasPermission(user, PERMISSIONS.CATALOG_EDIT_DRAFTS);
  const canPublish = hasPermission(user, PERMISSIONS.CATALOG_PUBLISH);
  const canDelete = hasPermission(user, PERMISSIONS.CATALOG_DELETE_PERMANENTLY);

  const [selected, setSelected] = useState<AdminCategory | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<CategoryInput>(() =>
    emptyCategory(service.id),
  );
  const [destructiveAction, setDestructiveAction] =
    useState<DestructiveAction | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [createCategory, createState] = useCreateCategoryMutation();
  const [updateCategory, updateState] = useUpdateCategoryMutation();
  const [publishCategory] = usePublishCategoryMutation();
  const [unpublishCategory] = useUnpublishCategoryMutation();
  const [archiveCategory, archiveState] = useArchiveCategoryMutation();
  const [unarchiveCategory] = useUnarchiveCategoryMutation();
  const [deleteCategoryPermanently, deleteState] =
    useDeleteCategoryPermanentlyMutation();
  const [getDeletionImpact, deletionImpactState] =
    useLazyGetCategoryDeletionImpactQuery();

  const openEditor = (category: AdminCategory | null) => {
    setSelected(category);
    setForm(
      category
        ? {
            serviceId: category.serviceId,
            slug: category.slug,
            title: category.title,
            description: category.description,
            visualKey: category.visualKey,
            audienceLabel: category.audienceLabel,
            badgeLabel: category.badgeLabel,
            sortOrder: category.sortOrder,
          }
        : emptyCategory(service.id),
    );
    setEditorOpen(true);
  };

  const change = (key: keyof CategoryInput, value: string | number) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      ...form,
      audienceLabel: form.audienceLabel?.trim() || null,
      badgeLabel: form.badgeLabel?.trim() || null,
    };

    try {
      if (selected) {
        const { serviceId: fixedService, ...mutablePayload } = payload;
        void fixedService;
        await updateCategory({
          id: selected.id,
          body: mutablePayload,
        }).unwrap();
      } else {
        await createCategory(payload).unwrap();
      }
      toast.success(
        selected ? "Category updated" : "Category created as a draft",
      );
      setEditorOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not save category"));
    }
  };

  const lifecycle = async (
    category: AdminCategory,
    action: "publish" | "unpublish" | "unarchive",
  ) => {
    try {
      if (action === "publish") await publishCategory(category.id).unwrap();
      if (action === "unpublish") {
        await unpublishCategory(category.id).unwrap();
      }
      if (action === "unarchive") {
        await unarchiveCategory(category.id).unwrap();
      }
      toast.success(
        action === "unarchive"
          ? "Category restored as a draft. Its courses remain archived."
          : `Category ${action}ed`,
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Action failed"));
    }
  };

  const confirmDestructiveAction = async () => {
    if (!destructiveAction) return;
    const { category, type } = destructiveAction;
    if (type === "delete" && !deletionImpactState.data?.deletable) return;

    try {
      if (type === "archive") {
        await archiveCategory(category.id).unwrap();
        toast.success("Category and its courses archived");
      } else {
        await deleteCategoryPermanently(category.id).unwrap();
        toast.success("Unused category permanently deleted");
      }
      setDestructiveAction(null);
      setDeleteConfirmation("");
      deletionImpactState.reset();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          type === "archive" ? "Archive failed" : "Permanent deletion failed",
        ),
      );
    }
  };

  const openPermanentDelete = (category: AdminCategory) => {
    setDeleteConfirmation("");
    deletionImpactState.reset();
    setDestructiveAction({ type: "delete", category });
    void getDeletionImpact(category.id);
  };

  const publishedCount = categories.filter(
    (category) => category.status === "PUBLISHED",
  ).length;
  const activeCategoryCount = categories.filter(
    (category) => category.status !== "ARCHIVED",
  ).length;
  const courseCount = categories.reduce(
    (total, category) => total + category.courseCount,
    0,
  );
  const requiredDeleteText = destructiveAction
    ? `DELETE ${destructiveAction.category.title}`
    : "";

  return (
    <div className="space-y-6">
      <AdminCatalogPageHeader
        title={`${service.title} categories`}
        description={`Create and manage categories that belong only to ${service.title}.`}
        action={
          canEdit ? (
            <Button onClick={() => openEditor(null)}>
              <Plus className="size-4" /> New category
            </Button>
          ) : null
        }
      />

      <AdminSummaryStrip
        items={[
          {
            label: "Categories",
            value: activeCategoryCount,
            detail: `${categories.length - activeCategoryCount} archived`,
          },
          {
            label: "Published",
            value: publishedCount,
            detail: `${activeCategoryCount - publishedCount} unpublished`,
          },
          {
            label: "Courses",
            value: courseCount,
            detail: "Across these categories",
          },
          {
            label: "Active learners",
            value: service.learners.activeUnique,
            detail: "Unique in this service",
          },
        ]}
      />

      <div
        className="overflow-hidden rounded-md border bg-card"
        aria-busy={isLoading}
      >
        <Table className="table-fixed">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="px-4">Category</TableHead>
              <TableHead className="w-28">Audience</TableHead>
              <TableHead className="w-20">Courses</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-24 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground"
                >
                  <span role="status" aria-live="polite">
                    Loading categories…
                  </span>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <p role="alert" className="text-sm text-destructive">
                    Could not load categories.
                  </p>
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="outline"
                    onClick={() => refetch()}
                  >
                    Try again
                  </Button>
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-36 text-center text-muted-foreground"
                >
                  No categories have been created for this service yet.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => {
                const href = `/admin/services/${service.slug}/categories/${category.id}/courses`;
                const isArchived = category.status === "ARCHIVED";

                return (
                  <NavigableTableRow
                    key={category.id}
                    href={href}
                    label={`Open ${category.title} courses`}
                  >
                    <TableCell className="max-w-sm whitespace-normal px-4 py-4">
                      <p className="font-semibold">{category.title}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        /{category.slug}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-xs whitespace-normal text-muted-foreground">
                      {category.audienceLabel || "Not specified"}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">
                      {category.courseCount}
                    </TableCell>
                    <TableCell>
                      <CatalogStatusBadge status={category.status} />
                    </TableCell>
                    <TableCell
                      className="pr-4 text-right"
                      data-no-row-navigation
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Actions for ${category.title}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEdit ? (
                            <DropdownMenuItem
                              disabled={isArchived}
                              onSelect={() => openEditor(category)}
                            >
                              <Pencil /> Edit
                            </DropdownMenuItem>
                          ) : null}
                          {canPublish && isArchived ? (
                            <DropdownMenuItem
                              onSelect={() => lifecycle(category, "unarchive")}
                            >
                              <ArchiveRestore /> Unarchive
                            </DropdownMenuItem>
                          ) : null}
                          {canPublish && !isArchived ? (
                            <DropdownMenuItem
                              onSelect={() =>
                                lifecycle(
                                  category,
                                  category.status === "PUBLISHED"
                                    ? "unpublish"
                                    : "publish",
                                )
                              }
                            >
                              {category.status === "PUBLISHED" ? (
                                <EyeOff />
                              ) : (
                                <Eye />
                              )}
                              {category.status === "PUBLISHED"
                                ? "Unpublish"
                                : "Publish"}
                            </DropdownMenuItem>
                          ) : null}
                          {canPublish && !isArchived ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() =>
                                  setDestructiveAction({
                                    type: "archive",
                                    category,
                                  })
                                }
                              >
                                <Archive /> Archive
                              </DropdownMenuItem>
                            </>
                          ) : null}
                          {canDelete && isArchived ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => openPermanentDelete(category)}
                              >
                                <Trash2 /> Delete permanently
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </NavigableTableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selected ? "Edit category" : "New category"}
            </DialogTitle>
            <DialogDescription>
              {selected
                ? `Update ${selected.title}. Published category slugs remain locked.`
                : `Create a new ${service.title} category. It will start unpublished.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="category-title">Title</Label>
                <Input
                  id="category-title"
                  required
                  minLength={2}
                  value={form.title}
                  onChange={(event) => {
                    change("title", event.target.value);
                    if (!selected) change("slug", slugify(event.target.value));
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category-slug">Slug</Label>
                <Input
                  id="category-slug"
                  required
                  pattern="[a-z0-9-]+"
                  value={form.slug}
                  onChange={(event) => change("slug", event.target.value)}
                  disabled={selected?.status === "PUBLISHED"}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category-description">Description</Label>
              <textarea
                id="category-description"
                required
                minLength={10}
                className="min-h-28 w-full rounded-md border bg-background p-3 text-sm"
                value={form.description}
                onChange={(event) => change("description", event.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="category-visual-key">Visual key</Label>
                <select
                  id="category-visual-key"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.visualKey}
                  onChange={(event) => change("visualKey", event.target.value)}
                >
                  {VISUAL_KEYS.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category-sort-order">Sort order</Label>
                <Input
                  id="category-sort-order"
                  type="number"
                  min={0}
                  value={form.sortOrder ?? 0}
                  onChange={(event) =>
                    change("sortOrder", Number(event.target.value))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="category-audience">Audience label</Label>
                <Input
                  id="category-audience"
                  value={form.audienceLabel ?? ""}
                  onChange={(event) =>
                    change("audienceLabel", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category-badge">Badge (optional)</Label>
                <Input
                  id="category-badge"
                  value={form.badgeLabel ?? ""}
                  onChange={(event) => change("badgeLabel", event.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditorOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createState.isLoading || updateState.isLoading}
              >
                {selected ? "Save changes" : "Create unpublished category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(destructiveAction)}
        onOpenChange={(open) => {
          if (!open) {
            setDestructiveAction(null);
            setDeleteConfirmation("");
            deletionImpactState.reset();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {destructiveAction?.type === "delete"
                ? "Permanently delete category?"
                : "Archive category?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {destructiveAction?.type === "delete"
                ? `Permanent deletion is available only for unused archived catalog setup. ${destructiveAction.category.title} will remain archived if any curriculum or learner history exists.`
                : `This archives ${destructiveAction?.category.title} and its courses. Existing enrolled learners keep access to their learning records.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {destructiveAction?.type === "delete" ? (
            <div className="space-y-3">
              <CatalogDeletionImpactSummary
                impact={deletionImpactState.data}
                isLoading={deletionImpactState.isFetching}
                error={deletionImpactState.error}
              />
              {deletionImpactState.data?.deletable ? (
                <div className="space-y-2">
                  <Label htmlFor="category-delete-confirmation">
                    Type <span className="font-mono">{requiredDeleteText}</span>{" "}
                    to confirm
                  </Label>
                  <Input
                    id="category-delete-confirmation"
                    value={deleteConfirmation}
                    onChange={(event) =>
                      setDeleteConfirmation(event.target.value)
                    }
                    autoComplete="off"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={
                archiveState.isLoading ||
                deleteState.isLoading ||
                (destructiveAction?.type === "delete" &&
                  (deletionImpactState.isFetching ||
                    !deletionImpactState.data?.deletable ||
                    deleteConfirmation !== requiredDeleteText))
              }
              onClick={confirmDestructiveAction}
            >
              {destructiveAction?.type === "delete"
                ? "Delete permanently"
                : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
