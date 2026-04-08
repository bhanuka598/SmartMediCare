import React from 'react';
import { Calendar, Clock, Video, FileText, Loader2, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../shared/Button';
import { Card, CardContent } from '../shared/Card';
import { Badge } from '../shared/Badge';

export function AppointmentCard({
  appointment,
  onJoin,
  onCancel,
  onPay,
  onViewNotes,
  isPayLoading = false,
  isJoinLoading = false,
  isCancelLoading = false
}) {
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

  const { variant, label } = statusConfig[appointment.status];
  const paymentConfig = {
    PAID: {
      icon: CheckCircle2,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Paid'
    },
    PENDING: {
      icon: AlertCircle,
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      label: 'Unpaid'
    },
    FAILED: {
      icon: AlertCircle,
      className: 'bg-red-50 text-red-700 border-red-200',
      label: 'Payment Failed'
    },
    REFUNDED: {
      icon: CheckCircle2,
      className: 'bg-sky-50 text-sky-700 border-sky-200',
      label: 'Refunded'
    }
  };
  const paymentState = paymentConfig[appointment.paymentStatus] || paymentConfig.PENDING;
  const PaymentIcon = paymentState.icon;

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

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${paymentState.className}`}>
                    <PaymentIcon className="h-3.5 w-3.5" />
                    {paymentState.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {appointment.currency} {appointment.feeDisplay}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full sm:w-auto flex flex-wrap gap-2 mt-2 sm:mt-0">

              {appointment.paymentStatus !== 'PAID' && appointment.fee > 0 && appointment.rawStatus !== 'CANCELLED' && appointment.rawStatus !== 'REJECTED' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onPay?.(appointment.id)}
                  disabled={isPayLoading}
                  className="flex-1 sm:flex-none gap-2"
                >
                  {isPayLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" /> Pay Now
                    </>
                  )}
                </Button>
              )}

              {appointment.status === 'upcoming' && (
                <>
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

                  <Button
                    size="sm"
                    onClick={() => onJoin?.(appointment.id)}
                    disabled={isJoinLoading || (appointment.type === 'video' && appointment.paymentStatus !== 'PAID')}
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

            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
