import PropertyDetailPage from "./client";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <PropertyDetailPage params={params} />;
}
