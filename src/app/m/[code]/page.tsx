import ProfileShortLinkPage from "./client";

export function generateStaticParams() {
  return [{ code: "placeholder" }];
}

export default function Page({ params }: { params: Promise<{ code: string }> }) {
  return <ProfileShortLinkPage params={params} />;
}
