import { redirect } from "next/navigation";

export default async function ShortLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`https://api.betatenant.com/s/${code}`);
}
