import EditListingClient from "./client";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  return <EditListingClient params={params} />;
}
