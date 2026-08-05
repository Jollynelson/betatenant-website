import AgentPortfolioPage from "./client";

export function generateStaticParams() {
  return [{ shareId: "placeholder" }];
}

export default function Page({ params }: { params: Promise<{ shareId: string }> }) {
  return <AgentPortfolioPage params={params} />;
}
