import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, Loader2, RotateCcw, Mail, Phone, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { Button } from '../../components/shared/Button';
import { API_URL } from '../../lib/api';

const REFUND_PAYOUT_SESSION_KEY = 'refund_payout_session';

export function RefundsPage() {
  const [refunds, setRefunds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectModalTxn, setRejectModalTxn] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchRefunds = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/payments/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch refunds');
      }

      const transactions = data.transactions || [];
      const refundedOnly = transactions
        .filter((txn) => txn.status === 'refunded')
        .sort((a, b) => new Date(b.refundedAt || b.updatedAt || b.createdAt) - new Date(a.refundedAt || a.updatedAt || a.createdAt));
      setRefunds(refundedOnly);
    } catch (err) {
      setError(err.message || 'Failed to fetch refunds');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  // Complete refund payout after returning from Stripe Checkout.
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const stored = sessionStorage.getItem(REFUND_PAYOUT_SESSION_KEY);
    let parsedStored = null;
    try {
      parsedStored = stored ? JSON.parse(stored) : null;
    } catch (_e) {
      parsedStored = null;
    }
    const transactionId = searchParams.get('refund_payout') || parsedStored?.transactionId;
    const sid = sessionId || parsedStored?.sessionId;

    if (!transactionId || !sid) return;

    const doneKey = `refund_payout_done_${sid}`;
    if (sessionStorage.getItem(doneKey) === '1') {
      sessionStorage.removeItem(REFUND_PAYOUT_SESSION_KEY);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('session_id');
        next.delete('refund_payout');
        return next;
      }, { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `${API_URL}/api/payments/transactions/${transactionId}/refund-payout/complete`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId: sid })
          }
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Could not complete refund payout');
        }
        if (cancelled) return;

        sessionStorage.setItem(doneKey, '1');
        sessionStorage.removeItem(REFUND_PAYOUT_SESSION_KEY);
        setActionMessage({ type: 'success', text: 'Refund payout marked as paid.' });
        await fetchRefunds();
      } catch (err) {
        if (!cancelled) {
          setActionMessage({ type: 'error', text: err.message || 'Refund payout completion failed' });
        }
      } finally {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('session_id');
          next.delete('refund_payout');
          return next;
        }, { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams, fetchRefunds]);

  const handlePayRefund = async (txn) => {
    if (!window.confirm(`Pay refund of $${(txn.amount || 0).toFixed(2)} via Stripe?`)) return;

    setActionMessage(null);
    setPayingId(txn._id);
    try {
      const token = localStorage.getItem('token');
      const origin = window.location.origin;
      const res = await fetch(
        `${API_URL}/api/payments/transactions/${txn._id}/refund-payout/checkout`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currency: txn.currency || 'usd',
            successUrl: `${origin}/admin/refunds?refund_payout=${txn._id}`,
            cancelUrl: `${origin}/admin/refunds?refund_payout_cancel=1`
          })
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Could not start refund payout');
      }
      if (!data.url || !data.sessionId) {
        throw new Error('No payment page URL returned');
      }
      sessionStorage.setItem(
        REFUND_PAYOUT_SESSION_KEY,
        JSON.stringify({ transactionId: txn._id, sessionId: data.sessionId })
      );
      window.location.href = data.url;
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Could not start refund payout' });
      setPayingId(null);
    }
  };

  const openRejectModal = (txn) => {
    setActionMessage(null);
    setRejectReason('');
    setRejectModalTxn(txn);
  };

  const handleConfirmReject = async () => {
    if (!rejectModalTxn) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setActionMessage({ type: 'error', text: 'Please enter a rejection reason.' });
      return;
    }

    setRejectingId(rejectModalTxn._id);
    setActionMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_URL}/api/payments/transactions/${rejectModalTxn._id}/refund-payout/reject`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason })
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Could not reject refund payout');
      }
      setRejectModalTxn(null);
      setRejectReason('');
      setActionMessage({ type: 'success', text: 'Refund payout rejected. The patient will see the reason on their appointments.' });
      await fetchRefunds();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Rejection failed' });
    } finally {
      setRejectingId(null);
    }
  };

  const renderPayoutBadge = (txn) => {
    const status = txn.refundPayoutStatus || 'none';
    const map = {
      paid: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700' },
      pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
      rejected: { label: 'Rejected', className: 'bg-rose-100 text-rose-800' },
      none: { label: 'Unpaid', className: 'bg-slate-100 text-slate-700' }
    };
    const cfg = map[status] || map.none;
    return <Badge className={cfg.className}>{cfg.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Refund Requests</h1>
          <p className="text-slate-500">
            Review patient refund requests, then pay via Stripe or reject with a reason the patient can see.
          </p>
        </div>
        <Button variant="outline" onClick={fetchRefunds} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      {actionMessage && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            actionMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2">
            <RotateCcw size={18} />
            Refund History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="p-6 text-sm text-red-700 bg-red-50 border-t border-red-100">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="p-12 flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : refunds.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              No refunded transactions yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900">Transaction</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900">Appointment</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900">Requester</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900">Pay Amount</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900">Method</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900">Submitted</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900">Reason</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900">Refund ID</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900">Payout</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {refunds.map((txn) => {
                    const payoutPaid = txn.refundPayoutStatus === 'paid';
                    const payoutRejected = txn.refundPayoutStatus === 'rejected';
                    const requesterName =
                      txn.refundRequesterName || txn.patientName || txn.patientId || 'Unknown';
                    return (
                      <tr key={txn._id} className="hover:bg-slate-50/50 transition-colors align-top">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">
                          #{txn._id?.slice(-8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {txn.appointmentId || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">{requesterName}</div>
                          {txn.refundRequesterEmail && (
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span>{txn.refundRequesterEmail}</span>
                            </div>
                          )}
                          {txn.refundRequesterPhone && (
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{txn.refundRequesterPhone}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                          ${txn.amount?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 capitalize">
                          {txn.paymentMethod || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {txn.refundedAt ? new Date(txn.refundedAt).toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 max-w-xs">
                          {txn.refundReason ? (
                            <span className="block whitespace-pre-wrap break-words line-clamp-3" title={txn.refundReason}>
                              {txn.refundReason}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {txn.refundId ? (
                            <Badge className="bg-blue-100 text-blue-700">{txn.refundId}</Badge>
                          ) : (
                            <span className="text-xs text-slate-400">Manual</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderPayoutBadge(txn)}
                          {txn.refundPayoutPaidAt && (
                            <div className="text-xs text-slate-500 mt-1">
                              {new Date(txn.refundPayoutPaidAt).toLocaleString()}
                            </div>
                          )}
                          {payoutRejected && txn.refundPayoutRejectReason && (
                            <div className="text-xs text-slate-600 mt-2 max-w-xs whitespace-pre-wrap break-words">
                              <span className="font-medium text-slate-700">Admin: </span>
                              {txn.refundPayoutRejectReason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {payoutPaid ? (
                            <span className="text-xs text-emerald-700">Paid</span>
                          ) : payoutRejected ? (
                            <span className="text-xs text-rose-700">Rejected</span>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handlePayRefund(txn)}
                                disabled={payingId === txn._id || Boolean(rejectingId)}
                                className="gap-2"
                              >
                                {payingId === txn._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CreditCard className="h-4 w-4" /> Pay Refund
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openRejectModal(txn)}
                                disabled={payingId === txn._id || Boolean(rejectingId)}
                                className="text-rose-700 border-rose-200 hover:bg-rose-50"
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {rejectModalTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Reject refund payout</h2>
                <p className="text-sm text-slate-500 mt-1">
                  The patient will see this status and your reason on their appointment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !rejectingId && setRejectModalTxn(null)}
                disabled={Boolean(rejectingId)}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Reason for rejection
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Explain why this refund payout cannot be completed..."
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => !rejectingId && setRejectModalTxn(null)}
                  disabled={Boolean(rejectingId)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={Boolean(rejectingId) || !rejectReason.trim()}
                  className="bg-rose-600 hover:bg-rose-700 text-white gap-2"
                >
                  {rejectingId === rejectModalTxn._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Confirm reject'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
