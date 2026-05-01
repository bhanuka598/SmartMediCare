import React from 'react';
import { Calendar, Clock, Video, FileText, Loader2, CreditCard } from 'lucide-react';
import { Button } from '../shared/Button';
import { Card, CardContent } from '../shared/Card';
import { Badge } from '../shared/Badge';

export function AppointmentCard({
  appointment,
  onJoin,
  onCancel,
  onPay,
  onRefund,
  onViewNotes,
  onUpdate,
  isJoinLoading = false,
  isCancelLoading = false,
  isPaymentLoading = false,
  isRefundLoading = false,
  isUpdateLoading = false
}) {
  const paymentPending =
    String(appointment.paymentStatus || '').toUpperCase() === 'PENDING';
  const paymentPaid =
    String(appointment.paymentStatus || '').toUpperCase() === 'PAID';
  const paymentRefunded =
    String(appointment.paymentStatus || '').toUpperCase() === 'REFUNDED';
  const needsPayment =
    appointment.status === 'upcoming' &&
    paymentPending &&
    Number(appointment.fee) > 0;
  const canRequestRefund =
    appointment.status === 'cancelled' &&
    paymentPaid;

  const refundPayoutStatus = String(
    appointment.refundPayoutStatus || 'none'
  ).toLowerCase();

  let refundBadgeVariant = 'info';
  let refundBadgeLabel = 'Refunded';
  if (paymentRefunded) {
    if (refundPayoutStatus === 'paid') {
      refundBadgeVariant = 'success';
      refundBadgeLabel = 'Refunded';
    } else if (refundPayoutStatus === 'rejected') {
      refundBadgeVariant = 'error';
      refundBadgeLabel = 'Refund rejected';
    } else if (refundPayoutStatus === 'pending') {
      refundBadgeVariant = 'warning';
      refundBadgeLabel = 'Refund in progress';
    } else if (refundPayoutStatus === 'failed') {
      refundBadgeVariant = 'error';
      refundBadgeLabel = 'Refund failed';
    } else {
      refundBadgeVariant = 'warning';
      refundBadgeLabel = 'Refund pending';
    }
  }

  const statusConfig = {
    upcoming: {
      variant: 'info',
      label: 'Upcoming'
    },
    completed: {
      variant: 'success',
      label: 'Completed'
    },
    cancelled: {
      variant: 'error',
      label: 'Cancelled'
    }
  };

  const rawStatus = appointment?.status;
  const statusKey =
    rawStatus && statusConfig[rawStatus] ? rawStatus : 'upcoming';
  const { variant, label } = statusConfig[statusKey];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">

          {/* Date/Time Section */}
          <div className="bg-slate-50 p-5 sm:w-48 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-slate-100">
            <div className="flex items-center gap-2 text-slate-600 mb-2">
              <Calendar className="h-4 w-4" />
              <span className="font-medium text-slate-900">
                {appointment.date}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="h-4 w-4" />
              <span>{appointment.time}</span>
            </div>

            <div className="mt-4">
              <Badge variant={variant}>{label}</Badge>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-5 flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

            <div className="flex items-center gap-4">
              <img
                src={appointment.doctorImage}
                alt={appointment.doctorName}
                className="h-12 w-12 rounded-full object-cover border border-slate-200"
              />

              <div>
                <h4 className="font-semibold text-slate-900">
                  {appointment.doctorName}
                </h4>

                <p className="text-sm text-slate-500">
                  {appointment.specialty}
                </p>

                <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                  {appointment.type === 'video' ? (
                    <>
                      <Video className="h-3 w-3" /> Video Consultation
                    </>
                  ) : (
                    <>
                      <FileText className="h-3 w-3" /> In-person Visit
                    </>
                  )}
                </div>

                {(appointment.paymentStatus || appointment.feeFormatted) && (
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                    <Badge
                      variant={
                        paymentRefunded
                          ? refundBadgeVariant
                          : paymentPaid
                            ? 'success'
                            : paymentPending
                              ? 'warning'
                              : 'default'
                      }
                    >
                      {paymentRefunded
                        ? refundBadgeLabel
                        : paymentPaid
                          ? 'Paid'
                          : paymentPending
                            ? 'Payment pending'
                            : appointment.paymentStatus || 'Payment'}
                    </Badge>
                    {appointment.feeFormatted && (
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <CreditCard className="h-3 w-3" />
                        {appointment.feeFormatted}
                      </span>
                    )}
                    {paymentRefunded &&
                      refundPayoutStatus === 'rejected' &&
                      appointment.refundPayoutRejectReason?.trim() && (
                        <p className="w-full text-xs text-rose-700 mt-2 leading-snug">
                          <span className="font-medium text-rose-800">Reason: </span>
                          <span className="whitespace-pre-wrap">{appointment.refundPayoutRejectReason.trim()}</span>
                        </p>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="w-full sm:w-auto flex gap-2 mt-2 sm:mt-0">

              {appointment.status === 'upcoming' && (
                <>
                  {appointment.canModify && onUpdate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdate(appointment.id)}
                      disabled={isUpdateLoading}
                      className="flex-1 sm:flex-none"
                    >
                      {isUpdateLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Update'
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCancel?.(appointment.id)}
                    disabled={isCancelLoading}
                    className="flex-1 sm:flex-none"
                  >
                    {isCancelLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Cancel'
                    )}
                  </Button>

                  {needsPayment && onPay && (
                    <Button
                      size="sm"
                      onClick={() => onPay(appointment.id)}
                      disabled={isPaymentLoading}
                      className="flex-1 sm:flex-none gap-2"
                    >
                      {isPaymentLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" /> Pay now
                        </>
                      )}
                    </Button>
                  )}

                  {!needsPayment && appointment.type === 'video' && (
                    <Button
                      size="sm"
                      onClick={() => onJoin?.(appointment.id)}
                      disabled={isJoinLoading}
                      className="flex-1 sm:flex-none gap-2"
                    >
                      {isJoinLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Video className="h-4 w-4" /> Join Call
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}

              {appointment.status === 'completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewNotes?.(appointment.id)}
                  className="w-full sm:w-auto gap-2"
                >
                  <FileText className="h-4 w-4" /> View Notes
                </Button>
              )}

              {canRequestRefund && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRefund?.(appointment.id)}
                  disabled={isRefundLoading}
                  className="w-full sm:w-auto gap-2"
                >
                  {isRefundLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Apply Refund'
                  )}
                </Button>
              )}

            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}