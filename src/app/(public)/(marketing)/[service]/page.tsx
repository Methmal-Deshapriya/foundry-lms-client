import { notFound } from "next/navigation";
import { ServiceLanding } from "@/components/marketing/public-service/ServiceLanding";
import {
  getPublicLearningServices,
  getPublicServiceCatalog,
} from "@/lib/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service } = await params;
  const definitions = await getPublicLearningServices();
  const definition = definitions?.services.find(
    (item) => item.slug === service,
  );
  return definition
    ? {
        title: `${definition.title} | Foundry Academy`,
        description: definition.description,
      }
    : {};
}

export default async function LearningServicePage({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service } = await params;
  const [catalog, definitions] = await Promise.all([
    getPublicServiceCatalog(service),
    getPublicLearningServices(),
  ]);
  const definition = definitions?.services.find(
    (item) => item.slug === service,
  );
  if (!catalog || !definition) notFound();
  return (
    <ServiceLanding
      service={service}
      courses={catalog.courses}
      definition={definition}
    />
  );
}
