import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Loader2,
  RotateCcw,
  X,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Clock,
  Ban,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { Button } from '../../components/shared/Button';
import { API_URL } from '../../lib/api';
import { formatMoneyAmount } from '../../lib/currency';

const REFUND_PAYOUT_SESSION_KEY = 'refund_payout_session';
const ITEMS_PER_PAGE = 10;

const PAYOUT_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'needs_action', label: 'Needs action' },
  { id: 'paid', label: 'Paid out' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'pending', label: 'In progress' }
];

/** Tail end of Mongo-style ids for dense tables; full value in title/tooltip. */
function shortenId(id, tail = 8) {
  if (id == null || id === '') return null;
  const s = String(id).trim();
  if (!s) return null;
  return s.length <= tail ? s : `\u2026${s.slice(-tail)}`;
}

export function RefundsPage() {
  const [refunds, setRefunds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectModalTxn, setRejectModalTxn] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [payConfirmTxn, setPayConfirmTxn] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [payoutFilter, setPayoutFilter] = useState('needs_action');
  const [currentPage, setCurrentPage] = useState(1);
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
        .sort(
          (a, b) =>
            new Date(b.refundedAt || b.updatedAt || b.createdAt) -
            new Date(a.refundedAt || a.updatedAt || a.createdAt)
        );
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, payoutFilter]);

  const stats = useMemo(() => {
    const total = refunds.length;
    const paid = refunds.filter((t) => t.refundPayoutStatus === 'paid').length;
    const rejected = refunds.filter((t) => t.refundPayoutStatus === 'rejected').length;
    const needsAction = refunds.filter(
      (t) => t.refundPayoutStatus !== 'paid' && t.refundPayoutStatus !== 'rejected'
    ).length;
    return { total, paid, rejected, needsAction };
  }, [refunds]);

  const filteredRefunds = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return refunds.filter((txn) => {
      const status = txn.refundPayoutStatus || 'none';
      const paid = status === 'paid';
      const rej = status === 'rejected';

      if (payoutFilter === 'needs_action') {
        if (paid || rej) return false;
      } else if (payoutFilter === 'paid') {
        if (!paid) return false;
      } else if (payoutFilter === 'rejected') {
        if (!rej) return false;
      } else if (payoutFilter === 'pending') {
        if (status !== 'pending') return false;
      }

      if (!q) return true;
      const requester =
        txn.refundRequesterName || txn.patientName || txn.patientId || '';
      const haystack = [
        requester,
        txn.refundRequesterEmail,
        txn.refundRequesterPhone,
        txn.appointmentId,
        txn._id,
        txn.refundReason,
        txn.refundId
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [refunds, searchTerm, payoutFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRefunds.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRefunds = useMemo(() => {
    const page = Math.min(Math.max(1, currentPage), totalPages);
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredRefunds.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRefunds, currentPage, totalPages]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

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
        if (!cancelled) {
          sessionStorage.setItem(doneKey, '1');
          sessionStorage.removeItem(REFUND_PAYOUT_SESSION_KEY);
          setActionMessage({ type: 'success', text: 'Refund payout marked as paid.' });
          await fetchRefunds();
        }
      } catch (err) {
        if (!cancelled) {
          setActionMessage({
            type: 'error',
            text: err.message || 'Refund payout completion failed'
          });
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

  const executePayRefund = async (txn) => {
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
      setActionMessage({
        type: 'error',
        text: err.message || 'Could not start refund payout'
      });
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
      setActionMessage({
        type: 'success',
        text: 'Refund payout rejected. The patient will see the reason on their appointments.'
      });
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

  const formatSubmitted = (txn) => {
    if (!txn.refundedAt) return '—';
    const d = new Date(txn.refundedAt);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const compactRequester = (txn) => {
    const requesterName =
      txn.refundRequesterName || txn.patientName || txn.patientId || 'Unknown';
    const parts = [txn.refundRequesterEmail, txn.refundRequesterPhone].filter(Boolean);
    const secondary = parts.join(' · ');
    return (
      <div className="min-w-0 max-w-[13rem] xl:max-w-[15rem]">
        <div className="truncate text-sm font-medium text-slate-900" title={requesterName}>
          {requesterName}
        </div>
        {secondary ? (
          <div className="mt-0.5 truncate text-xs text-slate-500" title={secondary}>
            {secondary}
          </div>
        ) : null}
      </div>
    );
  };

  const renderRowActions = (txn) => {
    const payoutPaid = txn.refundPayoutStatus === 'paid';
    const payoutRejected = txn.refundPayoutStatus === 'rejected';
    if (payoutPaid) {
      return <span className="text-xs font-medium text-emerald-700">Completed</span>;
    }
    if (payoutRejected) {
      return <span className="text-xs font-medium text-rose-700">No payout</span>;
    }
    return (
      <div className="flex max-w-[9rem] flex-col gap-1.5">
        <Button
          size="sm"
          onClick={() => setPayConfirmTxn(txn)}
          disabled={payingId === txn._id || Boolean(rejectingId)}
          className="gap-2"
        >
          {payingId === txn._id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CreditCard className="h-4 w-4" /> Pay refund
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
    );
  };

  const rejectModalRequester =
    rejectModalTxn &&
    (rejectModalTxn.refundRequesterName ||
      rejectModalTxn.patientName ||
      rejectModalTxn.patientId ||
      'Unknown');

  return (
    <div className="min-w-0 space-y-6 pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Refund payouts
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            Patient refunds appear here after the payment is refunded. Send the payout via Stripe
            or reject with a reason—the patient sees updates on their appointments.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchRefunds}
          disabled={isLoading}
          className="shrink-0 gap-2 self-start"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">Needs action</p>
                <h3 className="text-2xl font-bold tabular-nums text-amber-600">{stats.needsAction}</h3>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Clock size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">Paid out</p>
                <h3 className="text-2xl font-bold tabular-nums text-emerald-600">{stats.paid}</h3>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Wallet size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">Rejected</p>
                <h3 className="text-2xl font-bold tabular-nums text-rose-600">{stats.rejected}</h3>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <Ban size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">Total refunds</p>
                <h3 className="text-2xl font-bold tabular-nums text-slate-900">{stats.total}</h3>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <RotateCcw size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {actionMessage && (
        <div
          role="alert"
          className={`relative flex gap-3 rounded-xl border px-4 py-3 pr-11 text-sm shadow-sm ${
            actionMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
              : 'border-red-200 bg-red-50 text-red-950'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          )}
          <p className="min-w-0 flex-1 leading-relaxed">{actionMessage.text}</p>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="absolute right-3 top-3 rounded-md p-1 text-slate-500 hover:bg-black/5 hover:text-slate-800"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Card className="min-w-0 overflow-hidden border-slate-200/80 shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <RotateCcw size={20} className="text-blue-600" />
            Refund history
          </CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <div className="relative w-full sm:w-56 lg:w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient, appointment, ID…"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {PAYOUT_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPayoutFilter(f.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    payoutFilter === f.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="flex gap-3 border-b border-red-100 bg-red-50 px-6 py-4 text-sm text-red-900">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p>{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              <p className="text-sm text-slate-500">Loading refunds…</p>
            </div>
          ) : refunds.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <RotateCcw className="h-7 w-7" />
              </div>
              <div className="max-w-md space-y-1">
                <p className="text-base font-semibold text-slate-900">No refunded payments yet</p>
                <p className="text-sm text-slate-600">
                  When a transaction is refunded, it will show up here so you can complete the
                  patient payout or reject it with an explanation.
                </p>
              </div>
            </div>
          ) : filteredRefunds.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
              <Sparkles className="h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-900">No matches</p>
              <p className="max-w-sm text-sm text-slate-600">
                Try another search or switch the filter—the table updates instantly.
              </p>
              <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setPayoutFilter('all'); }}>
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile / tablet cards */}
              <div className="divide-y divide-slate-100 lg:hidden">
                {paginatedRefunds.map((txn) => {
                  const requesterName =
                    txn.refundRequesterName || txn.patientName || txn.patientId || 'Unknown';
                  return (
                    <div key={txn._id} className="space-y-3 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{requesterName}</p>
                          <p className="mt-0.5 font-mono text-xs text-slate-500">
                            #{txn._id?.slice(-8)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold tabular-nums text-slate-900">
                            {formatMoneyAmount(txn.amount, txn.currency)}
                          </p>
                          {renderPayoutBadge(txn)}
                        </div>
                      </div>
                      {(txn.refundRequesterEmail || txn.refundRequesterPhone) && (
                        <div
                          className="truncate text-xs text-slate-600"
                          title={[txn.refundRequesterEmail, txn.refundRequesterPhone]
                            .filter(Boolean)
                            .join(' · ')}
                        >
                          {[txn.refundRequesterEmail, txn.refundRequesterPhone]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="min-w-0">
                          <span className="text-slate-400">Appointment</span>
                          <p
                            className="truncate font-mono font-medium text-slate-800"
                            title={txn.appointmentId || undefined}
                          >
                            {txn.appointmentId ? shortenId(txn.appointmentId, 10) : '—'}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400">Submitted</span>
                          <p className="font-medium text-slate-800" title={txn.refundedAt}>
                            {formatSubmitted(txn)}
                          </p>
                        </div>
                      </div>
                      {txn.refundReason && (
                        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700">
                          {txn.refundReason}
                        </p>
                      )}
                      {txn.refundPayoutStatus === 'rejected' && txn.refundPayoutRejectReason && (
                        <p className="rounded-lg border border-rose-100 bg-rose-50/80 px-3 py-2 text-xs leading-relaxed text-rose-900">
                          <span className="font-semibold">Admin note: </span>
                          {txn.refundPayoutRejectReason}
                        </p>
                      )}
                      <div className="pt-1">{renderRowActions(txn)}</div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden min-w-0 lg:block">
                <table className="w-full table-fixed border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/90">
                      <th className="w-[11%] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                        Transaction / Appt
                      </th>
                      <th className="w-[17%] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                        Requester
                      </th>
                      <th className="w-[9%] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                        Amount
                      </th>
                      <th className="hidden w-[7%] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 xl:table-cell">
                        Method
                      </th>
                      <th className="w-[11%] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                        Submitted
                      </th>
                      <th className="w-[17%] min-w-0 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                        Reason
                      </th>
                      <th className="hidden w-[9%] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 2xl:table-cell">
                        Refund ID
                      </th>
                      <th className="w-[10%] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                        Payout
                      </th>
                      <th className="w-[9%] px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginatedRefunds.map((txn) => {
                      const payoutRejected = txn.refundPayoutStatus === 'rejected';
                      const refundIdShort = txn.refundId ? shortenId(txn.refundId, 14) : null;
                      return (
                        <tr key={txn._id} className="align-top transition-colors hover:bg-slate-50/90">
                          <td className="px-3 py-2.5 align-top">
                            <div className="space-y-1 font-mono text-[11px] leading-snug">
                              <div className="truncate" title={txn._id}>
                                <span className="text-slate-400">Txn </span>
                                <span className="font-medium text-slate-800">
                                  #{txn._id?.slice(-8)}
                                </span>
                              </div>
                              <div className="truncate" title={txn.appointmentId || undefined}>
                                <span className="text-slate-400">Appt </span>
                                <span className="font-medium text-slate-800">
                                  {txn.appointmentId ? shortenId(txn.appointmentId, 10) : '—'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="min-w-0 px-3 py-2.5 align-top">{compactRequester(txn)}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 align-top tabular-nums text-sm font-semibold text-slate-900">
                            {formatMoneyAmount(txn.amount, txn.currency)}
                          </td>
                          <td className="hidden whitespace-nowrap px-3 py-2.5 align-top text-xs capitalize text-slate-600 xl:table-cell">
                            {txn.paymentMethod || '—'}
                          </td>
                          <td className="whitespace-normal px-3 py-2.5 align-top text-xs leading-snug text-slate-600">
                            <span
                              title={
                                txn.refundedAt ? new Date(txn.refundedAt).toLocaleString() : ''
                              }
                            >
                              {formatSubmitted(txn)}
                            </span>
                          </td>
                          <td className="min-w-0 overflow-hidden px-3 py-2.5 align-top">
                            {txn.refundReason ? (
                              <span
                                className="line-clamp-4 block whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700"
                                title={txn.refundReason}
                              >
                                {txn.refundReason}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="hidden min-w-0 overflow-hidden px-3 py-2.5 align-top 2xl:table-cell">
                            {txn.refundId ? (
                              <Badge
                                className="inline-block max-w-full truncate bg-blue-100 px-2 py-0.5 font-mono text-[10px] text-blue-900"
                                title={txn.refundId}
                              >
                                {refundIdShort || txn.refundId}
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-slate-400">Manual</span>
                            )}
                          </td>
                          <td className="min-w-0 px-3 py-2.5 align-top">
                            {renderPayoutBadge(txn)}
                            {txn.refundPayoutPaidAt && (
                              <div className="mt-1 text-[11px] text-slate-500">
                                {new Date(txn.refundPayoutPaidAt).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </div>
                            )}
                            {payoutRejected && txn.refundPayoutRejectReason && (
                              <div
                                className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-[11px] text-slate-600"
                                title={txn.refundPayoutRejectReason}
                              >
                                <span className="font-medium text-slate-700">Note </span>
                                {txn.refundPayoutRejectReason}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 align-top text-right">{renderRowActions(txn)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredRefunds.length > ITEMS_PER_PAGE && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row">
                  <p className="text-xs text-slate-600">
                    Showing{' '}
                    <span className="font-medium text-slate-900">
                      {(safePage - 1) * ITEMS_PER_PAGE + 1}
                    </span>
                    –
                    <span className="font-medium text-slate-900">
                      {Math.min(safePage * ITEMS_PER_PAGE, filteredRefunds.length)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium text-slate-900">{filteredRefunds.length}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </Button>
                    <span className="min-w-[4rem] text-center text-xs tabular-nums text-slate-600">
                      Page {safePage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="gap-1"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {payConfirmTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div
            className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            role="dialog"
            aria-labelledby="pay-refund-title"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <h2 id="pay-refund-title" className="text-lg font-semibold text-slate-900">
                  Send payout via Stripe?
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  You will complete payment on Stripe Checkout. Amount matches this refunded
                  transaction.
                </p>
              </div>
              <button
                type="button"
                onClick={() => payingId !== payConfirmTxn._id && setPayConfirmTxn(null)}
                disabled={payingId === payConfirmTxn._id}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto p-6">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-600">Patient</span>
                  <span className="font-medium text-slate-900">
                    {payConfirmTxn.refundRequesterName ||
                      payConfirmTxn.patientName ||
                      payConfirmTxn.patientId ||
                      'Unknown'}
                  </span>
                </div>
                <div className="mt-2 flex justify-between gap-4 border-t border-slate-200/80 pt-2">
                  <span className="text-slate-600">Amount</span>
                  <span className="text-lg font-bold tabular-nums text-slate-900">
                    {formatMoneyAmount(payConfirmTxn.amount, payConfirmTxn.currency)}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => payingId !== payConfirmTxn._id && setPayConfirmTxn(null)}
                  disabled={payingId === payConfirmTxn._id}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const t = payConfirmTxn;
                    setPayConfirmTxn(null);
                    executePayRefund(t);
                  }}
                  disabled={payingId === payConfirmTxn._id}
                  className="gap-2"
                >
                  {payingId === payConfirmTxn._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" /> Continue to Stripe
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectModalTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Reject refund payout</h2>
                <p className="mt-1 text-sm text-slate-600">
                  The patient will see this status and your reason on their appointment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !rejectingId && setRejectModalTxn(null)}
                disabled={Boolean(rejectingId)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto p-6">
              <div className="rounded-xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-sm">
                <p className="font-medium text-slate-900">{rejectModalRequester}</p>
                <p className="mt-1 text-slate-600">
                  {formatMoneyAmount(rejectModalTxn.amount, rejectModalTxn.currency)}
                  <span className="mx-2 text-slate-300">·</span>
                  #{rejectModalTxn._id?.slice(-8)}
                </p>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                Reason for rejection
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Explain why this refund payout cannot be completed..."
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
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
                  className="gap-2 bg-rose-600 text-white hover:bg-rose-700"
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
