import React, { useEffect, useMemo, useState } from 'react';
import { X, RotateCcw, Loader2, AlertCircle, Calendar, Clock, User } from 'lucide-react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';

const REFUND_REASONS = [
  'Doctor cancelled the appointment',
  'No longer need the consultation',
  'Scheduling conflict',
  'Booked the wrong appointment',
  'Service issue / dissatisfied',
  'Other'
];

const NAME_MIN = 2;
const NAME_MAX = 60;
const EMAIL_MAX = 120;
const DETAILS_MAX = 500;
const DETAILS_MIN_FOR_OTHER = 10;

const NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]{0,59}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_ALLOWED = /^[+()\-\s\d]+$/;

const validateName = (raw) => {
  const v = raw.trim();
  if (!v) return 'Name is required';
  if (v.length < NAME_MIN) return `Name must be at least ${NAME_MIN} characters`;
  if (v.length > NAME_MAX) return `Name must be ${NAME_MAX} characters or less`;
  if (!NAME_REGEX.test(v)) return "Use letters, spaces, . ' - only";
  return null;
};

const validateEmail = (raw) => {
  const v = raw.trim();
  if (!v) return 'Email is required';
  if (v.length > EMAIL_MAX) return `Email must be ${EMAIL_MAX} characters or less`;
  if (!EMAIL_REGEX.test(v)) return 'Enter a valid email address';
  return null;
};

const validatePhone = (raw) => {
  const v = raw.trim();
  if (!v) return null;
  if (!PHONE_ALLOWED.test(v)) return 'Use digits, spaces, + - ( ) only';
  const digits = v.replace(/\D/g, '');
  if (digits.length < 7) return 'Phone number is too short';
  if (digits.length > 15) return 'Phone number is too long';
  return null;
};

const validateReasonChoice = (choice) => {
  if (!choice) return 'Please pick a reason';
  return null;
};

const validateReasonDetails = (details, choice) => {
  const v = details.trim();
  if (choice === 'Other') {
    if (!v) return 'Please describe your reason';
    if (v.length < DETAILS_MIN_FOR_OTHER) {
      return `Please give at least ${DETAILS_MIN_FOR_OTHER} characters`;
    }
  }
  if (v.length > DETAILS_MAX) {
    return `Please keep it under ${DETAILS_MAX} characters`;
  }
  return null;
};

export function RefundRequestModal({
  isOpen,
  onClose,
  appointment,
  defaultName = '',
  defaultEmail = '',
  defaultPhone = '',
  isSubmitting = false,
  errorMessage = null,
  onSubmit
}) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [reasonChoice, setReasonChoice] = useState('');
  const [reasonDetails, setReasonDetails] = useState('');
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    reasonChoice: false,
    reasonDetails: false
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName || '');
      setEmail(defaultEmail || '');
      setPhone(defaultPhone || '');
      setReasonChoice('');
      setReasonDetails('');
      setTouched({
        name: false,
        email: false,
        phone: false,
        reasonChoice: false,
        reasonDetails: false
      });
      setSubmitAttempted(false);
    }
  }, [isOpen, defaultName, defaultEmail, defaultPhone]);

  const errors = useMemo(
    () => ({
      name: validateName(name),
      email: validateEmail(email),
      phone: validatePhone(phone),
      reasonChoice: validateReasonChoice(reasonChoice),
      reasonDetails: validateReasonDetails(reasonDetails, reasonChoice)
    }),
    [name, email, phone, reasonChoice, reasonDetails]
  );

  const showErr = (key) =>
    (touched[key] || submitAttempted) && errors[key] ? errors[key] : undefined;

  const isValid = !Object.values(errors).some(Boolean);
  const canSubmit = isValid && !isSubmitting;

  const detailsLength = reasonDetails.length;
  const detailsCounterClass =
    detailsLength > DETAILS_MAX
      ? 'text-red-500'
      : detailsLength > DETAILS_MAX - 50
        ? 'text-amber-600'
        : 'text-slate-400';

  if (!isOpen) return null;

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedDetails = reasonDetails.trim();
  const finalReason =
    reasonChoice === 'Other'
      ? trimmedDetails
      : trimmedDetails
        ? `${reasonChoice} — ${trimmedDetails}`
        : reasonChoice;

  const markTouched = (key) => setTouched((p) => ({ ...p, [key]: true }));

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!canSubmit) return;
    onSubmit?.({
      requesterName: trimmedName,
      requesterEmail: trimmedEmail,
      requesterPhone: phone.trim(),
      reason: finalReason
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">

        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Request a refund</h2>
              <p className="text-sm text-slate-500">
                Please confirm your details and tell us why you need a refund.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto" noValidate>
          <div className="p-6 space-y-5">

            {appointment && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  <span className="font-medium text-slate-900">{appointment.doctorName}</span>
                  {appointment.specialty && (
                    <span className="text-slate-500">· {appointment.specialty}</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> {appointment.date}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> {appointment.time}
                  </span>
                </div>
                {appointment.feeFormatted && (
                  <div className="text-sm text-slate-700">
                    Refund amount: <span className="font-semibold">{appointment.feeFormatted}</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => markTouched('name')}
                placeholder="Your full name"
                disabled={isSubmitting}
                maxLength={NAME_MAX}
                aria-invalid={Boolean(showErr('name'))}
                error={showErr('name')}
              />

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markTouched('email')}
                placeholder="you@example.com"
                disabled={isSubmitting}
                maxLength={EMAIL_MAX}
                aria-invalid={Boolean(showErr('email'))}
                error={showErr('email')}
              />
            </div>

            <Input
              label="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => markTouched('phone')}
              placeholder="e.g. +94 71 234 5678"
              disabled={isSubmitting}
              inputMode="tel"
              maxLength={20}
              aria-invalid={Boolean(showErr('phone'))}
              error={showErr('phone')}
              helperText={
                !showErr('phone') && phone.trim()
                  ? 'We may contact you here about the refund.'
                  : undefined
              }
            />

            <div>
              <label
                htmlFor="refund-reason-choice"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Reason for refund <span className="text-red-500">*</span>
              </label>
              <select
                id="refund-reason-choice"
                value={reasonChoice}
                onChange={(e) => setReasonChoice(e.target.value)}
                onBlur={() => markTouched('reasonChoice')}
                disabled={isSubmitting}
                aria-invalid={Boolean(showErr('reasonChoice'))}
                className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 ${
                  showErr('reasonChoice')
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              >
                <option value="">Select a reason...</option>
                {REFUND_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {showErr('reasonChoice') && (
                <p className="mt-1.5 text-sm text-red-500">{showErr('reasonChoice')}</p>
              )}
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label
                  htmlFor="refund-reason-details"
                  className="block text-sm font-medium text-slate-700"
                >
                  {reasonChoice === 'Other'
                    ? 'Tell us more'
                    : 'Additional details (optional)'}
                  {reasonChoice === 'Other' && <span className="text-red-500"> *</span>}
                </label>
                <span className={`text-xs ${detailsCounterClass}`}>
                  {detailsLength}/{DETAILS_MAX}
                </span>
              </div>
              <textarea
                id="refund-reason-details"
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                onBlur={() => markTouched('reasonDetails')}
                disabled={isSubmitting}
                rows={3}
                maxLength={DETAILS_MAX + 50}
                aria-invalid={Boolean(showErr('reasonDetails'))}
                placeholder={
                  reasonChoice === 'Other'
                    ? 'Please describe your reason (at least 10 characters)...'
                    : 'Add any extra context to help our team review faster.'
                }
                className={`w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 ${
                  showErr('reasonDetails')
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              />
              {showErr('reasonDetails') && (
                <p className="mt-1.5 text-sm text-red-500">{showErr('reasonDetails')}</p>
              )}
            </div>

            {submitAttempted && !isValid && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Please fix the highlighted fields before submitting.</span>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <p className="text-xs text-slate-500">
              Your request will be reviewed by our admin team. You'll see the
              refund status update on your Appointments page.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" /> Submit Refund Request
                </>
              )}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
