import { redirect } from "next/navigation";

export default async function ProfileShortLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`https://api.betatenant.com/m/${code}`);
}
