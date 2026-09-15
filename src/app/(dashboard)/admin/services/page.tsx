"use client";

import { useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Eye,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { selectAuthUser } from "@/features/auth/authSelectors";
import {
  type AdminLearningServiceSummary,
  type LearningService,
  useCreateLearningServiceMutation,
  useDeleteLearningServiceMutation,
  useGetAdminLearningServiceSummariesQuery,
  useTransitionLearningServiceMutation,
  useUpdateLearningServiceMutation,
} from "@/features/catalog/catalogApi";
import { AdminCatalogBreadcrumbs } from "@/features/catalog/components/AdminCatalogBreadcrumbs";
import { AdminCatalogPageHeader } from "@/features/catalog/components/AdminCatalogPageHeader";
import { AdminSummaryStrip } from "@/features/catalog/components/AdminSummaryStrip";
import { NavigableTableRow } from "@/features/catalog/components/NavigableTableRow";
import { hasPermission, PERMISSIONS } from "@/lib/access";
import { getApiErrorMessage } from "@/lib/api";
import { LEARNING_SERVICE_STATUS_STYLES } from "@/lib/statusColors";
import { useAppSelector } from "@/store/hooks";

type ServiceForm = Pick<
  LearningService,
  "key" | "slug" | "title" | "description" | "sortOrder"
> & { profile: "PAID" | "FREE" };
const emptyForm: ServiceForm = {
  key: "",
  slug: "",
  title: "",
  description: "",
  sortOrder: 0,
  profile: "PAID",
};
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const keyify = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

export default function AdminServicesPage() {
  const user = useAppSelector(selectAuthUser);
  const canManage = hasPermission(user, PERMISSIONS.LEARNING_SERVICES_MANAGE);
  const canPublish = hasPermission(user, PERMISSIONS.LEARNING_SERVICES_PUBLISH);
  const canDelete = hasPermission(
    user,
    PERMISSIONS.LEARNING_SERVICES_DELETE_PERMANENTLY,
  );
  const { data, isLoading, isError, refetch } =
    useGetAdminLearningServiceSummariesQuery();
  const services = data?.services ?? [];
  const [editing, setEditing] = useState<
    AdminLearningServiceSummary | "new" | null
  >(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [createService, createState] = useCreateLearningServiceMutation();
  const [updateService, updateState] = useUpdateLearningServiceMutation();
  const [transitionService, transitionState] =
    useTransitionLearningServiceMutation();
  const [deleteService, deleteState] = useDeleteLearningServiceMutation();

  const totals = services.reduce(
    (total, service) => ({
      categories: total.categories + service.categories.total,
      courses: total.courses + service.courses.total,
      learners: total.learners + service.learners.activeUnique,
      attention: total.attention + service.attentionCount,
    }),
    { categories: 0, courses: 0, learners: 0, attention: 0 },
  );

  const openEditor = (service?: AdminLearningServiceSummary) => {
    setEditing(service ?? "new");
    setForm(
      service
        ? {
            key: service.key,
            slug: service.slug,
            title: service.title,
            description: service.description,
            sortOrder: service.sortOrder,
            profile: service.accessType,
          }
        : emptyForm,
    );
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const policy =
      form.profile === "FREE"
        ? {
            accessType: "FREE" as const,
            courseMode: "EVERGREEN" as const,
            enrollmentMode: "SELF" as const,
            paymentRequirement: "NOT_REQUIRED" as const,
          }
        : {
            accessType: "PAID" as const,
            courseMode: "SEASONAL" as const,
            enrollmentMode: "ADMIN" as const,
            paymentRequirement: "REQUIRED" as const,
          };
    try {
      if (editing === "new") {
        await createService({
          key: form.key,
          slug: form.slug,
          title: form.title,
          description: form.description,
          sortOrder: form.sortOrder,
          ...policy,
        }).unwrap();
      } else if (editing) {
        await updateService({
          id: editing.id,
          body: {
            slug: form.slug,
            title: form.title,
            description: form.description,
            sortOrder: form.sortOrder,
            ...policy,
          },
        }).unwrap();
      }
      toast.success(
        editing === "new"
          ? "Learning service created as draft"
          : "Learning service updated",
      );
      setEditing(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not save learning service"));
    }
  };

  const transition = async (
    service: AdminLearningServiceSummary,
    action: "activate" | "deactivate" | "archive" | "unarchive",
  ) => {
    try {
      await transitionService({
        id: service.id,
        action,
        expectedStatus: service.status,
      }).unwrap();
      toast.success(`Learning service ${action}d`);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Could not change learning-service status"),
      );
    }
  };

  const remove = async (service: AdminLearningServiceSummary) => {
    if (
      !window.confirm(`Permanently delete unused service “${service.title}”?`)
    )
      return;
    try {
      await deleteService(service.id).unwrap();
      toast.success("Unused learning service permanently deleted");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Could not delete learning service"),
      );
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <AdminCatalogBreadcrumbs crumbs={[{ label: "Services" }]} />
      <AdminCatalogPageHeader
        title="Services"
        description="Learning services own access, course mode, enrollment, and payment policy for everything below them."
        action={
          canManage ? (
            <Button onClick={() => openEditor()}>
              <Plus /> New service
            </Button>
          ) : null
        }
      />
      <AdminSummaryStrip
        items={[
          {
            label: "Categories",
            value: totals.categories,
            detail: "Across all services",
          },
          {
            label: "Course records",
            value: totals.courses,
            detail: "Intakes and evergreen courses",
          },
          {
            label: "Active learners",
            value: totals.learners,
            detail: "Unique per service",
          },
          {
            label: "Needs attention",
            value: totals.attention,
            detail: "Drafts and delivery gaps",
          },
        ]}
      />
      <div className="overflow-hidden rounded-md border bg-card">
        <Table className="table-fixed">
          <TableCaption className="sr-only">
            Learning services summary
          </TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="px-4">Service</TableHead>
              <TableHead className="w-28">Categories</TableHead>
              <TableHead className="w-36">Course lifecycle</TableHead>
              <TableHead className="w-32">Learners</TableHead>
              <TableHead className="w-44">Inherited policy</TableHead>
              <TableHead className="w-24">Attention</TableHead>
              <TableHead className="w-24 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <span role="status" aria-live="polite">
                    Loading services…
                  </span>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <p role="alert" className="text-destructive">
                    Could not load services.
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
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  No learning services exist yet.
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <NavigableTableRow
                  key={service.id}
                  href={`/admin/services/${service.slug}/categories`}
                  label={`Open ${service.title} categories`}
                >
                  <TableCell className="max-w-sm whitespace-normal px-4 py-4">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{service.title}</p>
                      <Badge variant="outline" className={LEARNING_SERVICE_STATUS_STYLES[service.status]}>
                        {service.status}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground" title={service.description}>
                      {service.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="truncate font-mono">
                      {service.categories.published} /{" "}
                      {service.categories.total - service.categories.archived}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      published / active
                    </p>
                  </TableCell>
                  <TableCell>
                    <p
                      className="truncate font-mono"
                      title={`${service.courses.openActive} / ${service.courses.closedActive} / ${service.courses.completed}`}
                    >
                      {service.courses.openActive} /{" "}
                      {service.courses.closedActive} /{" "}
                      {service.courses.completed}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      open / closed-active / completed
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="truncate font-mono">{service.learners.activeUnique}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {service.learners.activeEnrollments} active enrollments
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="truncate font-medium">
                      {service.accessType} · {service.courseMode}
                    </p>
                    <p
                      className="truncate text-xs text-muted-foreground"
                      title={`${service.enrollmentMode} enrollment · payment ${service.paymentRequirement.toLowerCase().replace("_", " ")}`}
                    >
                      {service.enrollmentMode} enrollment · payment{" "}
                      {service.paymentRequirement
                        .toLowerCase()
                        .replace("_", " ")}
                    </p>
                  </TableCell>
                  <TableCell>
                    {service.attentionCount ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700"
                      >
                        <AlertTriangle className="size-3" />
                        {service.attentionCount}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                      >
                        <CheckCircle2 className="size-3" />
                        Ready
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="pr-4 text-right" data-no-row-navigation>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${service.title}`}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canManage && service.status !== "ARCHIVED" ? (
                          <DropdownMenuItem
                            onSelect={() => openEditor(service)}
                          >
                            <Pencil /> Edit service
                          </DropdownMenuItem>
                        ) : null}
                        {canPublish && service.status === "DRAFT" ? (
                          <DropdownMenuItem
                            onSelect={() => transition(service, "activate")}
                          >
                            <Eye /> Activate
                          </DropdownMenuItem>
                        ) : null}
                        {canPublish && service.status === "ACTIVE" ? (
                          <DropdownMenuItem
                            onSelect={() => transition(service, "deactivate")}
                          >
                            <EyeOff /> Return to draft
                          </DropdownMenuItem>
                        ) : null}
                        {canPublish && service.status === "ARCHIVED" ? (
                          <DropdownMenuItem
                            onSelect={() => transition(service, "unarchive")}
                          >
                            <ArchiveRestore /> Restore as draft
                          </DropdownMenuItem>
                        ) : null}
                        {canPublish && service.status !== "ARCHIVED" ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => transition(service, "archive")}
                            >
                              <Archive /> Archive
                            </DropdownMenuItem>
                          </>
                        ) : null}
                        {canDelete &&
                        service.status === "ARCHIVED" &&
                        service.categoryCount === 0 ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={deleteState.isLoading}
                              onSelect={() => remove(service)}
                            >
                              <Trash2 /> Delete permanently
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </NavigableTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing === "new"
                ? "New learning service"
                : "Edit learning service"}
            </DialogTitle>
            <DialogDescription>
              Choose one supported delivery profile. Identity and policy lock
              after the first category is created.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="service-title">Title</Label>
                <Input
                  id="service-title"
                  required
                  minLength={3}
                  value={form.title}
                  onChange={(event) => {
                    const title = event.target.value;
                    setForm((current) => ({
                      ...current,
                      title,
                      ...(editing === "new"
                        ? { slug: slugify(title), key: keyify(title) }
                        : {}),
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-key">Stable key</Label>
                <Input
                  id="service-key"
                  required
                  disabled={editing !== "new"}
                  value={form.key}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      key: keyify(event.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="service-slug">Public slug</Label>
                <Input
                  id="service-slug"
                  required
                    disabled={editing !== null && editing !== "new" && editing.categoryCount > 0}
                  value={form.slug}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      slug: slugify(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-order">Sort order</Label>
                <Input
                  id="service-order"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sortOrder: Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-description">Description</Label>
              <textarea
                id="service-description"
                required
                minLength={10}
                className="min-h-24 w-full rounded-md border bg-background p-3 text-sm"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-profile">Delivery policy</Label>
              <select
                id="service-profile"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                disabled={editing !== null && editing !== "new" && editing.categoryCount > 0}
                value={form.profile}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    profile: event.target.value as "PAID" | "FREE",
                  }))
                }
              >
                <option value="PAID">
                  Paid · seasonal · admin enrollment · payment required
                </option>
                <option value="FREE">
                  Free · evergreen · self enrollment · no payment
                </option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createState.isLoading ||
                  updateState.isLoading ||
                  transitionState.isLoading
                }
              >
                Save service
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
