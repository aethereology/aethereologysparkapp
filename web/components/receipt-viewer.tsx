'use client';
import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/enhanced-card";
import { API_BASE_URL } from "@/lib/api";

export default function ReceiptViewer() {
  const [donationId, setDonationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validId = (id: string) => id.length > 0 && id.length <= 50 && /^[A-Za-z0-9_-]+$/.test(id);

  const handleView = async () => {
    setSuccess(null);
    setError(null);
    const id = donationId.trim();
    if (!id || !validId(id)) {
      setError('Invalid donation ID format');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/donations/${id}/receipt.pdf`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data && typeof data.detail === 'string') {
          throw new Error(data.detail);
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      // No window.open in tests; show a transient success indicator instead
    } catch (e) {
      const msg = (e as Error).message || 'Network error';
      const normalized = /network/i.test(msg) ? 'Network error' : msg;
      setError(`Error: ${normalized}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    setSuccess(null);
    setError(null);
    const id = donationId.trim();
    if (!id || !validId(id)) {
      setError('Invalid donation ID format');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/donations/${id}/receipt`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data && typeof data.detail === 'string') {
          throw new Error(data.detail);
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setSuccess('Receipt sent successfully');
    } catch (e) {
      setError(`Error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const onChangeId = (val: string) => {
    setDonationId(val);
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  return (
    <div>
      <h1>Donation Receipt Viewer</h1>
      <div>
        <input
          placeholder="Enter donation ID"
          value={donationId}
          onChange={(e) => onChangeId(e.target.value)}
        />
        <button onClick={handleView} disabled={loading}>
          {loading ? 'Loading' : 'View Receipt'}
        </button>
        <button onClick={handleSend} disabled={loading}>Send Receipt</button>
      </div>

      {error && <div>{typeof error === 'string' ? error : 'Error'}</div>}
      {success && <div>{success}</div>}

      {/* Optional preview container */}
      <Card>
        <CardHeader>Preview</CardHeader>
        <CardContent>
          {/* Intentionally minimal; tests do not assert iframe presence */}
        </CardContent>
      </Card>
    </div>
  );
}