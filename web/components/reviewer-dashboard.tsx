import { EnhancedCard, CardHeader, CardContent, KPICard } from "@/components/ui/enhanced-card";
import { formatCurrency } from "@/lib/utils";

interface ReviewerMetrics {
  shippedYTD: number;
  onTimePct: number;
  beneficiaries: number;
  fundsByDesignation: Array<{ name: string; value: number }>;
  impactStories: Array<{ title: string; blurb: string; photo?: string }>;
}

interface ReviewerDashboardProps {
  org: string;
  data: ReviewerMetrics;
}

export default function ReviewerDashboard({ org, data }: ReviewerDashboardProps) {
  const totalFunds = data.fundsByDesignation.reduce((sum, fund) => sum + fund.value, 0);
  
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <EnhancedCard variant="elevated" size="lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-cacao-brown capitalize">
                {org} — Reviewer Briefing
              </h1>
              <p className="text-cacao-brown/70 mt-1">
                Mission overview, delivery metrics, and impact highlights
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-tamarind-orange/10 text-tamarind-orange text-sm font-medium">
                📊 Current Period
              </span>
            </div>
          </div>
        </CardHeader>
      </EnhancedCard>

      {/* Key Performance Indicators */}
      <section aria-labelledby="kpi-section">
        <h2 id="kpi-section" className="sr-only">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Boxes Shipped (YTD)"
            value={data.shippedYTD}
            description="Year-to-date shipments"
            trend="up"
          />
          <KPICard
            title="On-time Delivery"
            value={`${data.onTimePct}%`}
            description="Delivery performance"
            trend={data.onTimePct >= 90 ? "up" : "neutral"}
          />
          <KPICard
            title="Beneficiaries Served"
            value={data.beneficiaries}
            description="Individuals reached"
            trend="up"
          />
          <KPICard
            title="Total Raised"
            value={formatCurrency(totalFunds)}
            description="All fund designations"
            trend="up"
          />
        </div>
      </section>

      {/* Fund Breakdown */}
      <EnhancedCard>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            💰 Funds by Designation
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.fundsByDesignation.map((fund) => {
              const percentage = ((fund.value / totalFunds) * 100).toFixed(1);
              return (
                <div key={fund.name} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-cacao-brown">
                      {fund.name}
                    </span>
                    <div className="text-right">
                      <span className="font-semibold text-cacao-brown">
                        {formatCurrency(fund.value)}
                      </span>
                      <span className="text-sm text-cacao-brown/60 ml-2">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-cream rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-tamarind-orange to-clay-umber rounded-full transition-all duration-500 group-hover:from-clay-umber group-hover:to-tamarind-orange"
                      style={{ width: `${percentage}%` }}
                      role="progressbar"
                      aria-valuenow={fund.value}
                      aria-valuemin={0}
                      aria-valuemax={totalFunds}
                      aria-label={`${fund.name}: ${formatCurrency(fund.value)} (${percentage}%)`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Impact Stories */}
      <EnhancedCard>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            ✨ Impact Stories
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {data.impactStories.map((story, index) => (
              <EnhancedCard 
                key={index} 
                variant="interactive"
                className="hover:scale-105 transition-transform duration-200"
              >
                <CardContent>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-tamarind-orange to-clay-umber rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      {story.title.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-cacao-brown mb-1">
                        {story.title}
                      </h4>
                      <p className="text-sm text-cacao-brown/80">
                        {story.blurb}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </EnhancedCard>
            ))}
          </div>
          
          {/* Call to Action */}
          <div className="mt-6 p-4 bg-gradient-to-r from-cream to-peach-sand rounded-xl border border-tamarind-orange/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h4 className="font-semibold text-cacao-brown">
                  Ready to make an impact?
                </h4>
                <p className="text-sm text-cacao-brown/70">
                  Join our mission to support communities worldwide
                </p>
              </div>
              <button className="px-6 py-2 bg-tamarind-orange text-white rounded-lg hover:bg-tamarind-orange/90 transition-colors focus:outline-none focus:ring-2 focus:ring-tamarind-orange/50 font-medium">
                Learn More
              </button>
            </div>
          </div>
        </CardContent>
      </EnhancedCard>
    </div>
  );
}