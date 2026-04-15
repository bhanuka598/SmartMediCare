import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Calendar, Clock, Video, MapPin, Loader2, CheckCircle, CreditCard } from 'lucide-react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Card } from '../shared/Card';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SPECIALTIES = [
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'General Medicine',
  'ENT',
  'Ophthalmology',
  'Gynecology'
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

const normalizeSlotTime = (t) => {
  if (t == null || t === '') return '';
  const m = String(t).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return String(t).trim();
  return `${String(parseInt(m[1], 10)).padStart(2, '0')}:${m[2]}`;
};

const slotTimeToMinutes = (t) => {
  const n = normalizeSlotTime(t);
  const [h, mm] = n.split(':').map((x) => parseInt(x, 10) || 0);
  return h * 60 + mm;
};

const getToken = () => localStorage.getItem('token');

const WEEK_DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const WEEK_DAY_SHORT = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};

/** Human-readable line from doctor default weekly schedule (public API). */
const formatWeeklyAvailabilityHint = (defaultSchedule) => {
  if (!defaultSchedule || typeof defaultSchedule !== 'object') return '';
  const active = WEEK_DAY_KEYS.filter((d) => defaultSchedule[d]?.isAvailable);
  if (active.length === 0) return 'This doctor has no weekly working hours set yet.';
  const labels = active.map((d) => WEEK_DAY_SHORT[d] || d);
  return `Usually available on: ${labels.join(', ')}.`;
};

const normalizeDoctor = (doctor) => ({
  ...doctor,
  id: doctor.id || doctor.userId || doctor._id,
  userId: doctor.userId || doctor.id || doctor._id,
  name:
    doctor.name ||
    doctor.fullName ||
    `${doctor.profile?.firstName || ''} ${doctor.profile?.lastName || ''}`.trim() ||
    doctor.username ||
    'Dr. Unknown',
  specialty:
    doctor.specialty ||
    doctor.professional?.specialization ||
    'General Medicine',
  image:
    doctor.image ||
    doctor.profile?.avatar ||
    doctor.profileImage ||
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150',
  experience: doctor.experience || doctor.professional?.yearsOfExperience || doctor.yearsOfExperience || 0,
  consultationFee: (() => {
    const raw = doctor.consultationFee ?? doctor.practice?.consultationFee ?? 0;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  })(),
  currency: doctor.practice?.currency || doctor.currency || 'USD'
});

export function BookAppointmentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  patientId, 
  patientName, 
  patientEmail, 
  patientPhone,
  preSelectedDoctor = null 
}) {
  const [step, setStep] = useState(preSelectedDoctor ? 2 : 1); // Skip to step 2 if doctor pre-selected
  const [selectedSpecialty, setSelectedSpecialty] = useState(preSelectedDoctor?.specialty || '');
  const [doctors, setDoctors] = useState(preSelectedDoctor ? [normalizeDoctor(preSelectedDoctor)] : []);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(preSelectedDoctor ? normalizeDoctor(preSelectedDoctor) : null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('IN_PERSON');
  const [reason, setReason] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [weeklyAvailabilityHint, setWeeklyAvailabilityHint] = useState('');
  const [patientContact, setPatientContact] = useState({
    name: patientName || '',
    email: patientEmail || '',
    phone: patientPhone || ''
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (preSelectedDoctor) {
        setStep(2);
        setSelectedSpecialty(preSelectedDoctor.specialty);
        setDoctors([normalizeDoctor(preSelectedDoctor)]);
        setSelectedDoctor(normalizeDoctor(preSelectedDoctor));
      } else {
        setStep(1);
        setSelectedSpecialty('');
        setDoctors([]);
        setSelectedDoctor(null);
      }
      setSelectedDate('');
      setSelectedTime('');
      setAppointmentType('IN_PERSON');
      setReason('');
      setSymptoms('');
      setDuration(30);
      setError(null);
      setPatientContact({
        name: patientName || '',
        email: patientEmail || '',
        phone: patientPhone || ''
      });
    }
  }, [isOpen, preSelectedDoctor, patientEmail, patientName, patientPhone]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPatientProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/api/patient/profile`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        if (!response.ok || !data.success) return;

        const profile = data.profile || {};
        setPatientContact((prev) => ({
          name:
            `${profile.profile?.firstName || ''} ${profile.profile?.lastName || ''}`.trim() ||
            prev.name ||
            patientName ||
            '',
          email: profile.email || prev.email || patientEmail || '',
          phone: profile.profile?.phone || prev.phone || patientPhone || ''
        }));
      } catch (err) {
        console.error('Patient profile fetch for booking failed:', err);
      }
    };

    fetchPatientProfile();
  }, [isOpen, patientEmail, patientName, patientPhone]);

  useEffect(() => {
    if (!isOpen || step !== 2 || !selectedDoctor) {
      setWeeklyAvailabilityHint('');
      return;
    }
    const doctorId = selectedDoctor.userId || selectedDoctor.id || selectedDoctor._id;
    if (!doctorId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/doctors/public/${doctorId}/availability`);
        const data = await res.json();
        if (cancelled || !data.success) return;
        setWeeklyAvailabilityHint(formatWeeklyAvailabilityHint(data.defaultSchedule));
      } catch {
        if (!cancelled) setWeeklyAvailabilityHint('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, step, selectedDoctor]);

  // Search doctors by specialty
  const searchDoctors = async () => {
    if (!selectedSpecialty) return;
    
    setLoadingDoctors(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_URL}/api/appointments/doctors/search?specialty=${encodeURIComponent(selectedSpecialty)}`,
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Searching doctors for specialty:', selectedSpecialty);
      
      const data = await response.json();
      console.log('Doctor search response:', data);
      
      if (data.success) {
        // Backend returns data directly, not nested in data.data
        const doctorList = (Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []))
          .map(normalizeDoctor);
        console.log('Found doctors:', doctorList.length);
        setDoctors(doctorList);
        if (doctorList.length === 0) {
          setError('No doctors found for this specialty. Please try another.');
        }
      } else {
        setError(data.message || 'Failed to search doctors');
      }
    } catch (err) {
      console.error('Doctor search error:', err);
      setError('Network error. Please check that the appointment service is running.');
    } finally {
      setLoadingDoctors(false);
    }
  };

  /** Each slot: time (HH:mm), disabled (not bookable), booked (taken — show blocked style). */
  const [slotRows, setSlotRows] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const fetchAvailableSlots = useCallback(async () => {
    if (!selectedDoctor || !selectedDate) return;

    const doctorId = selectedDoctor.userId || selectedDoctor.id || selectedDoctor._id;
    if (!doctorId) {
      setSlotRows(TIME_SLOTS.map((time) => ({ time: normalizeSlotTime(time), disabled: false, booked: false })));
      return;
    }

    setLoadingSlots(true);
    try {
      const response = await fetch(
        `${API_URL}/api/appointments/doctors/${doctorId}/slots?date=${encodeURIComponent(selectedDate)}`,
        {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!data.success || !data.data) {
        setSlotRows([]);
        return;
      }

      const d = data.data;
      const bookedKeys = new Set((d.bookedSlots || []).map((b) => normalizeSlotTime(b.start)));

      const availableRaw = d.availableSlots || d.slots || [];
      const availableKeys = new Set(
        availableRaw
          .map((slot) =>
            normalizeSlotTime(typeof slot === 'string' ? slot : slot.start || slot.startTime)
          )
          .filter(Boolean)
      );

      const allFromApi = (d.allSlots || [])
        .map((slot) =>
          normalizeSlotTime(typeof slot === 'string' ? slot : slot.start || slot.startTime)
        )
        .filter(Boolean);

      const hasResolvedSchedule =
        d.hasScheduleForDate === true || (Array.isArray(d.allSlots) && d.allSlots.length > 0);

      const gridTimes = hasResolvedSchedule
        ? allFromApi.length > 0
          ? [...new Set(allFromApi)].sort((a, b) => slotTimeToMinutes(a) - slotTimeToMinutes(b))
          : []
        : [...TIME_SLOTS];

      const rows = gridTimes.map((time) => {
        const norm = normalizeSlotTime(time);
        const booked = bookedKeys.has(norm);
        let disabled;
        if (hasResolvedSchedule) {
          disabled = !availableKeys.has(norm);
        } else if (bookedKeys.size === 0) {
          disabled = false;
        } else {
          disabled = booked;
        }
        return { time: norm, disabled, booked };
      });

      setSlotRows(rows);
    } catch (err) {
      setSlotRows([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, selectedDoctor]);

  useEffect(() => {
    fetchAvailableSlots();
  }, [selectedDoctor, selectedDate]);

  useEffect(() => {
    setSelectedTime('');
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedTime) return;
    const row = slotRows.find((r) => r.time === selectedTime);
    if (row?.disabled) setSelectedTime('');
  }, [slotRows, selectedTime]);

  const formatMoney = (amount, currencyCode) => {
    const code = currencyCode && /^[A-Z]{3}$/i.test(String(currencyCode).trim())
      ? String(currencyCode).trim().toUpperCase()
      : 'USD';
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(amount);
    } catch {
      return `${currencyCode || ''} ${Number(amount).toFixed(2)}`.trim();
    }
  };

  const consultationFee = selectedDoctor?.consultationFee ?? 0;
  const currency = selectedDoctor?.currency || 'USD';

  /**
   * Free visits: mark PAID immediately.
   * Paid visits: save as PENDING, then redirect to Stripe Checkout (hosted card page).
   */
  const submitAppointment = async () => {
    const resolvedPatientId = patientId;
    const resolvedDoctorId = selectedDoctor?.userId || selectedDoctor?.id || selectedDoctor?._id;

    if (!resolvedPatientId) {
      setError('Your patient account details are missing. Please sign in again and try booking.');
      return;
    }

    if (!resolvedDoctorId || !selectedDoctor?.specialty || !selectedDate || !selectedTime) {
      setError('Please select a doctor, date, and time slot before booking.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const appointmentData = {
        patientId: resolvedPatientId,
        patientName: patientContact.name || patientName,
        patientEmail: patientContact.email || patientEmail,
        patientPhone: patientContact.phone || patientPhone,
        doctorId: resolvedDoctorId,
        doctorName: selectedDoctor.name,
        specialty: selectedDoctor.specialty,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        endTime: calculateEndTime(selectedTime, duration),
        duration,
        reason,
        symptoms: symptoms.split(',').map((s) => s.trim()).filter((s) => s),
        type: appointmentType,
        fee: consultationFee,
        paymentStatus: consultationFee > 0 ? 'PENDING' : 'PAID'
      };

      const response = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || data.error || 'Failed to book appointment');
        return;
      }

      const created = data.data;
      const appointmentId = created?._id || created?.id;

      if (consultationFee <= 0) {
        try {
          await fetch(`${API_URL}/api/payments/transactions`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${getToken()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              appointmentId,
              amount: 0,
              doctorId: resolvedDoctorId,
              doctorName: selectedDoctor.name,
              patientName: patientContact.name || patientName,
              paymentMethod: 'none',
              currency,
              status: 'completed'
            })
          });
        } catch (payErr) {
          console.warn('Payment record sync failed:', payErr);
        }
        setStep(5);
        onSuccess?.(created);
        return;
      }

      const origin = window.location.origin;
      const checkoutRes = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId,
          currency,
          successUrl: `${origin}/patient/appointments?checkout=success`,
          cancelUrl: `${origin}/patient/doctors?checkout=cancelled`
        })
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok) {
        setError(
          checkoutData.message ||
            'Could not start Stripe Checkout. Set STRIPE_SECRET_KEY on the payment service (use your Stripe test secret key sk_test_…).'
        );
        return;
      }

      if (checkoutData.url) {
        if (checkoutData.sessionId) {
          sessionStorage.setItem('stripe_last_checkout_session', checkoutData.sessionId);
        }
        window.location.href = checkoutData.url;
        return;
      }

      setError('No checkout URL returned from server.');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-900">
            {step === 5 ? 'Appointment Booked!' : 'Book an Appointment'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Progress Steps */}
        {step < 5 && (
          <div className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-50">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {s}
                </div>
                {s < 4 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step > s ? 'bg-blue-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Select Specialty & Doctor */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Specialty
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SPECIALTIES.map((specialty) => (
                    <button
                      key={specialty}
                      onClick={() => setSelectedSpecialty(specialty)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedSpecialty === specialty
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {specialty}
                    </button>
                  ))}
                </div>
              </div>

              {selectedSpecialty && (
                <Button
                  onClick={searchDoctors}
                  disabled={loadingDoctors}
                  className="w-full"
                >
                  {loadingDoctors ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search Doctors
                    </>
                  )}
                </Button>
              )}

              {loadingDoctors && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-slate-600">Searching doctors...</span>
                </div>
              )}

              {doctors.length === 0 && !loadingDoctors && selectedSpecialty && (
                <div className="text-center py-4 text-slate-500 text-sm">
                  <p>Click "Search Doctors" to find available doctors</p>
                </div>
              )}

              {doctors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Select Doctor ({doctors.length} found)
                  </label>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {doctors.map((doctor) => (
                      <Card
                        key={doctor.userId || doctor.id || doctor._id}
                        className={`cursor-pointer transition-all ${
                          (selectedDoctor?.userId || selectedDoctor?.id || selectedDoctor?._id) === (doctor.userId || doctor.id || doctor._id)
                            ? 'ring-2 ring-blue-500 bg-blue-50'
                            : 'hover:bg-slate-50'
                        }`}
                        onClick={() => setSelectedDoctor(doctor)}
                      >
                        <div className="p-4 flex items-center gap-4">
                          <img
                            src={doctor.image}
                            alt={doctor.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{doctor.name}</h4>
                            <p className="text-sm text-slate-500">{doctor.specialty}</p>
                            {doctor.experience > 0 && (
                              <p className="text-xs text-slate-400">{doctor.experience} years experience</p>
                            )}
                          </div>
                          {(selectedDoctor?.userId || selectedDoctor?.id || selectedDoctor?._id) === (doctor.userId || doctor.id || doctor._id) && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {selectedDoctor && (
                <Button
                  onClick={() => setStep(2)}
                  className="w-full"
                >
                  Continue to Select Date & Time
                </Button>
              )}
            </div>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Select Date
                </label>
                <Input
                  type="date"
                  min={getMinDate()}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full"
                />
                {weeklyAvailabilityHint && (
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    {weeklyAvailabilityHint} Pick a matching day, then choose a time below.
                  </p>
                )}
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Select Time Slot
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Unavailable slots are blocked — already booked or outside the doctor&apos;s schedule.
                  </p>
                  {loadingSlots ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : slotRows.length === 0 ? (
                    <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      No bookable times on this date. Choose another day that fits the doctor&apos;s usual
                      schedule.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {slotRows.map(({ time, disabled, booked }) => (
                        <button
                          key={time}
                          type="button"
                          disabled={disabled}
                          onClick={() => !disabled && setSelectedTime(time)}
                          title={
                            disabled
                              ? booked
                                ? 'This time is already booked'
                                : 'Not available for this date'
                              : 'Select this time'
                          }
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                            disabled
                              ? booked
                                ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed line-through opacity-90'
                                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                              : selectedTime === time
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedDate && selectedTime && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Appointment Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setAppointmentType('IN_PERSON')}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          appointmentType === 'IN_PERSON'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <MapPin className="h-5 w-5 mx-auto mb-2 text-slate-600" />
                        <span className="text-sm font-medium">In-Person</span>
                      </button>
                      <button
                        onClick={() => setAppointmentType('TELEMEDICINE')}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          appointmentType === 'TELEMEDICINE'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Video className="h-5 w-5 mx-auto mb-2 text-slate-600" />
                        <span className="text-sm font-medium">Video Call</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Duration (minutes)
                    </label>
                    <div className="flex gap-2">
                      {[15, 30, 45, 60].map((d) => (
                        <button
                          key={d}
                          onClick={() => setDuration(d)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            duration === d
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {d} min
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      className="flex-1"
                    >
                      Continue
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Appointment Details */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Summary */}
              <Card className="bg-blue-50 border-blue-100">
                <div className="p-4 space-y-2">
                  <p className="text-sm">
                    <span className="font-medium text-slate-700">Doctor:</span>{' '}
                    <span className="text-slate-900">{selectedDoctor?.name}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-slate-700">Date:</span>{' '}
                    <span className="text-slate-900">{selectedDate}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-slate-700">Time:</span>{' '}
                    <span className="text-slate-900">{selectedTime} ({duration} min)</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-slate-700">Type:</span>{' '}
                    <span className="text-slate-900">
                      {appointmentType === 'TELEMEDICINE' ? 'Video Consultation' : 'In-Person Visit'}
                    </span>
                  </p>
                </div>
              </Card>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for Visit
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe the reason for your appointment..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Symptoms (comma separated)
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g., headache, fever, cough"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                  disabled={submitting}
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={submitting || !reason.trim()}
                  className="flex-1"
                >
                  Continue to payment
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className="space-y-6">
              <Card className="bg-slate-50 border-slate-200">
                <div className="p-4 space-y-2">
                  <p className="text-sm font-medium text-slate-900">Payment summary</p>
                  <p className="text-sm text-slate-600">
                    <span className="text-slate-700">Doctor:</span>{' '}
                    <span className="text-slate-900">{selectedDoctor?.name}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="text-slate-700">Visit:</span>{' '}
                    <span className="text-slate-900">
                      {selectedDate} at {selectedTime}
                    </span>
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-2">
                    <span className="text-sm font-medium text-slate-700">Consultation fee</span>
                    <span className="text-lg font-semibold text-slate-900">
                      {formatMoney(consultationFee, currency)}
                    </span>
                  </div>
                  {consultationFee <= 0 && (
                    <p className="text-xs text-emerald-800 bg-emerald-50 rounded-lg px-3 py-2">
                      No payment required for this booking.
                    </p>
                  )}
                </div>
              </Card>

              {consultationFee <= 0 && (
                <p className="text-xs text-slate-500">
                  No card required for free consultations.
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="flex-1"
                  disabled={submitting}
                >
                  Back
                </Button>
                <Button onClick={submitAppointment} disabled={submitting} className="flex-1 gap-2">
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      {consultationFee > 0 ? 'Continue to Stripe' : 'Confirm appointment'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Appointment Confirmed!
              </h3>
              <p className="text-slate-500 mb-6">
                Your appointment with {selectedDoctor?.name} has been scheduled for {selectedDate} at {selectedTime}.
              </p>
              <Button onClick={onClose} className="w-full">
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
