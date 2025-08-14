import { Card, CardContent } from "@/components/ui/card";
import { getReviewerMetrics } from "@/lib/api";
import { notFound } from "next/navigation";
import { ReviewerMetrics, FundDesignation, ImpactStory } from "@/types/api";
export default async function Briefing({ params }: { params: { org: string }}) {
  const org = params.org || "spark";
  const data = await getReviewerMetrics(org);
  if (!data) notFound();
  return (<div className="grid gap-4">
    <Card><CardContent>
      <h1 className="text-xl font-semibold mb-1 capitalize">{org} — Reviewer Briefing</h1>
      <p className="opacity-75">Mission, logic model, shipment metrics, and impact highlights.</p>
    </CardContent></Card>
    <div className="grid md:grid-cols-2 gap-4">
      <Card><CardContent><div className="text-sm opacity-70">Boxes Shipped (YTD)</div><div className="text-3xl font-semibold">{data.shippedYTD}</div></CardContent></Card>
      <Card><CardContent><div className="text-sm opacity-70">On-time Delivery %</div><div className="text-3xl font-semibold">{data.onTimePct}%</div></CardContent></Card>
      <Card><CardContent><div className="text-sm opacity-70">Beneficiaries Served</div><div className="text-3xl font-semibold">{data.beneficiaries}</div></CardContent></Card>
      <Card><CardContent><div className="text-sm opacity-70">Funds by Designation</div>
        <ul className="mt-2 space-y-1">{data.fundsByDesignation.map((fund: FundDesignation) => (
          <li key={fund.name} className="flex justify-between">
            <span>{fund.name}</span>
            <span>${fund.value.toLocaleString()}</span>
          </li>
        ))}</ul>
      </CardContent></Card>
    </div>
    <Card><CardContent>
      <div className="font-semibold mb-2">Impact Stories</div>
      <div className="grid md:grid-cols-2 gap-3">
        {data.impactStories.map((story: ImpactStory, index: number) => (
          <div key={index} className="card p-3">
            <div className="font-medium">{story.title}</div>
            <div className="text-sm opacity-75">{story.blurb}</div>
          </div>
        ))}
      </div>
    </CardContent></Card>
  </div>);
}