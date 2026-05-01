import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Clock, Video, MapPin, Loader2 } from 'lucide-react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { API_URL } from '../../lib/api';

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

/** API may return `YYYY-MM-DD` or ISO; `<input type="date">` needs `YYYY-MM-DD`. */
const normalizeDateInput = (dateVal) => {
  if (dateVal == null || dateVal === '') return '';
  const m = String(dateVal).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
};

const symptomsToFormString = (symptomsField) => {
  if (Array.isArray(symptomsField)) return symptomsField.map((x) => String(x).trim()).filter(Boolean).join(', ');
  if (typeof symptomsField === 'string') return symptomsField.trim();
  return '';
};

const symptomsToOrigArray = (symptomsField) => {
  if (Array.isArray(symptomsField)) {
    return symptomsField.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof symptomsField === 'string' && symptomsField.trim()) return [symptomsField.trim()];
  return [];
};

export function UpdateAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  appointment
}) {
  const orig = appointment?.originalData || {};
  const doctorId = orig.doctorId;
  const appointmentId = appointment?.id;

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('IN_PERSON');
  const [reason, setReason] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [slotRows, setSlotRows] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const originalDate = normalizeDateInput(orig.appointmentDate);
  const originalTime = normalizeSlotTime(orig.appointmentTime || '');

  useEffect(() => {
    if (!isOpen || !appointment) return;
    setSelectedDate(originalDate);
    setSelectedTime(originalTime);
    setAppointmentType(orig.type === 'TELEMEDICINE' ? 'TELEMEDICINE' : 'IN_PERSON');
    setReason(orig.reason || '');
    setSymptoms(symptomsToFormString(orig.symptoms));
    setDuration(Number(orig.duration) > 0 ? Number(orig.duration) : 30);
    setError(null);
  }, [isOpen, appointment, originalDate, originalTime]);

  const fetchAvailableSlots = useCallback(async () => {
    if (!doctorId || !selectedDate) return;

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

      const isOwnCurrentSlot = (norm) =>
        selectedDate === originalDate && norm === originalTime;

      const rows = gridTimes.map((time) => {
        const norm = normalizeSlotTime(time);
        const booked = bookedKeys.has(norm);
        let disabled;
        if (isOwnCurrentSlot(norm)) {
          disabled = false;
        } else if (hasResolvedSchedule) {
          disabled = !availableKeys.has(norm);
        } else if (bookedKeys.size === 0) {
          disabled = false;
        } else {
          disabled = booked;
        }
        return { time: norm, disabled, booked };
      });

      setSlotRows(rows);
    } catch {
      setSlotRows([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [doctorId, selectedDate, originalDate, originalTime]);

  useEffect(() => {
    if (isOpen) fetchAvailableSlots();
  }, [isOpen, fetchAvailableSlots]);

  useEffect(() => {
    if (!selectedTime) return;
    const row = slotRows.find((r) => r.time === selectedTime);
    if (!row) return;
    if (row.disabled) setSelectedTime('');
  }, [slotRows, selectedTime]);

  const calculateEndTime = (startTime, dur) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + dur;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    if (!appointmentId || !doctorId) {
      setError('Missing appointment details.');
      return;
    }
    if (!selectedDate || !selectedTime) {
      setError('Please choose a date and time.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const symptomsArr = symptoms.split(',').map((s) => s.trim()).filter(Boolean);
      const origDuration = Number(orig.duration) > 0 ? Number(orig.duration) : 30;
      const origType = orig.type === 'TELEMEDICINE' ? 'TELEMEDICINE' : 'IN_PERSON';
      const origReason = orig.reason || '';
      const origSymptoms = symptomsToOrigArray(orig.symptoms);

      const body = {};

      if (selectedDate !== originalDate || selectedTime !== originalTime) {
        body.appointmentDate = selectedDate;
        body.appointmentTime = selectedTime;
        body.endTime = calculateEndTime(selectedTime, duration);
      }

      if (Number(duration) !== origDuration) {
        body.duration = duration;
      }

      if (appointmentType !== origType) {
        body.type = appointmentType;
      }

      if (reason !== origReason) {
        body.reason = reason;
      }

      const symptomsSame =
        symptomsArr.length === origSymptoms.length &&
        symptomsArr.every((s, i) => s === origSymptoms[i]);
      if (!symptomsSame) {
        body.symptoms = symptomsArr;
      }

      if (Object.keys(body).length === 0) {
        setError('No changes to save.');
        setSubmitting(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || data.error || 'Could not update appointment');
        return;
      }

      onSuccess?.(data.data);
      onClose?.();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-900">Update appointment</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <img
              src={appointment.doctorImage}
              alt=""
              className="h-12 w-12 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <div>
              <p className="font-semibold text-slate-900">{appointment.doctorName}</p>
              <p className="text-sm text-slate-500">{appointment.specialty}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1 -mt-0.5" />
              Date
            </label>
            <Input
              type="date"
              min={getMinDate()}
              value={selectedDate}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedDate(v);
                if (v === originalDate) setSelectedTime(originalTime);
                else setSelectedTime('');
              }}
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700 mb-2">
              <Clock className="inline h-4 w-4 mr-1 -mt-0.5" />
              Time
            </span>
            {loadingSlots ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading slots…
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slotRows.length === 0 ? (
                  <p className="text-sm text-slate-500">No slots for this date. Try another day.</p>
                ) : (
                  slotRows.map((row) => (
                    <button
                      key={row.time}
                      type="button"
                      disabled={row.disabled}
                      onClick={() => setSelectedTime(row.time)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                        selectedTime === row.time
                          ? 'bg-blue-600 text-white border-blue-600'
                          : row.disabled
                            ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                            : 'border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                    >
                      {row.time}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700 mb-2">Visit type</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAppointmentType('IN_PERSON')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                  appointmentType === 'IN_PERSON'
                    ? 'border-blue-600 bg-blue-50 text-blue-800'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <MapPin className="h-4 w-4" /> In-person
              </button>
              <button
                type="button"
                onClick={() => setAppointmentType('TELEMEDICINE')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                  appointmentType === 'TELEMEDICINE'
                    ? 'border-blue-600 bg-blue-50 text-blue-800'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Video className="h-4 w-4" /> Video
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Duration (minutes)</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              {[15, 30, 45, 60].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[72px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for visit"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Symptoms (comma-separated)</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[72px]"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. headache, fatigue"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting || !selectedDate || !selectedTime}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
