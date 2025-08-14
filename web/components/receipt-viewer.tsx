'use client';
import { useEffect, useState } from "react";
import { EnhancedCard, CardHeader, CardContent } from "@/components/ui/enhanced-card";
import { API_URL } from "@/lib/api";

interface ReceiptViewerProps {
  donationId: string;
  showDownload?: boolean;
  showEmail?: boolean;
}

export default function ReceiptViewer({ 
  donationId, 
  showDownload = true, 
  showEmail = false 
}: ReceiptViewerProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const receiptUrl = `${API_URL}/api/v1/donations/${donationId}/receipt.pdf`;
    setSrc(receiptUrl);
    setLoading(false);
  }, [donationId]);

  const handleDownload = async () => {
    if (!src) return;
    
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${donationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download receipt');
    }
  };

  const handleEmail = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/donations/${donationId}/receipt`, {
        method: 'POST',
      });
      
      if (response.ok) {
        alert('Receipt sent to your email address!');
      } else {
        throw new Error('Failed to send email');
      }
    } catch (err) {
      setError('Failed to send receipt via email');
    }
  };

  if (loading) {
    return (
      <EnhancedCard className="animate-pulse">
        <CardHeader>Loading Receipt...</CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </CardContent>
      </EnhancedCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Receipt Header with Actions */}
      <EnhancedCard>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Tax Receipt</h2>
            <p className="text-sm text-cacao-brown/70">Donation ID: {donationId}</p>
          </div>
          <div className="flex gap-2">
            {showDownload && (
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-tamarind-orange text-white rounded-lg hover:bg-tamarind-orange/90 transition-colors focus:outline-none focus:ring-2 focus:ring-tamarind-orange/50"
                aria-label="Download receipt PDF"
              >
                📥 Download
              </button>
            )}
            {showEmail && (
              <button
                onClick={handleEmail}
                className="px-4 py-2 bg-clay-umber text-white rounded-lg hover:bg-clay-umber/90 transition-colors focus:outline-none focus:ring-2 focus:ring-clay-umber/50"
                aria-label="Email receipt to donor"
              >
                📧 Email
              </button>
            )}
          </div>
        </CardHeader>
      </EnhancedCard>

      {/* Receipt Display */}
      <EnhancedCard size="lg">
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {src ? (
            <div className="relative">
              <iframe 
                className="w-full h-[80vh] border rounded-xl bg-white"
                src={src}
                title={`Tax receipt for donation ${donationId}`}
                loading="lazy"
              />
              
              {/* Mobile fallback message */}
              <div className="md:hidden mt-4 p-4 bg-cream rounded-lg border border-peach-sand">
                <p className="text-sm text-cacao-brown/80">
                  <strong>Having trouble viewing?</strong> Download the PDF for better mobile viewing.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-cacao-brown/60">
              <p>Unable to load receipt</p>
            </div>
          )}
        </CardContent>
      </EnhancedCard>
    </div>
  );
}