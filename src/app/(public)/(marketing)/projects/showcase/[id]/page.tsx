import { getShowcaseProject, summarize } from "@/lib/publicPages";
import { SITE_NAME, pageMetadata } from "@/lib/seo";
import { PublicProjectShowcaseView } from "./PublicProjectShowcaseView";

type Params = { params: Promise<{ id: string }> };

// Rendered on the server for its metadata (code review M08-10).
export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  const project = await getShowcaseProject(id);
  if (!project) return { title: `Student project | ${SITE_NAME}`, robots: { index: false } };
  const student = project.user ? `${project.user.firstName} ${project.user.lastName}`.trim() : "";
  const byLine = [student && `by ${student}`, project.course?.title && `from ${project.course.title}`].filter(Boolean).join(" ");
  return pageMetadata({
    title: project.title,
    description: summarize(project.description, `A student project ${byLine || `from ${SITE_NAME}`}.`),
    path: `/projects/showcase/${project.id}`,
    image: project.thumbnailUrl,
  });
}

export default async function PublicProjectShowcasePage({ params }: Params) {
  const { id } = await params;
  return <PublicProjectShowcaseView id={id} />;
}
