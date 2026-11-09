import { redirect } from "next/navigation";

export default async function LegacyContextNewCoursePage({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service } = await params;
  redirect(`/admin/services/${service}/courses`);
}
