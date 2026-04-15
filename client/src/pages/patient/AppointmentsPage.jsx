import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar as CalendarIcon, Loader2, AlertCircle, Plus } from 'lucide-react';
import { AppointmentCard } from '../../components/appointments/AppointmentCard';
import { BookAppointmentModal } from '../../components/appointments/BookAppointmentModal';
import { Button } from '../../components/shared/Button';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper to get auth token
const getToken = () => localStorage.getItem('token');

// Map backend status to frontend status
const mapStatus = (backendStatus) => {
  const statusMap = {
    'PENDING': 'upcoming',
    'CONFIRMED': 'upcoming',
    'IN_PROGRESS': 'upcoming',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled',
    'REJECTED': 'cancelled',
    'NO_SHOW': 'cancelled'
  };
  return statusMap[backendStatus] || backendStatus.toLowerCase();
};

// Get status display label
const getStatusLabel = (backendStatus) => {
  const labels = {
    'PENDING': 'Pending',
    'CONFIRMED': 'Confirmed',
    'IN_PROGRESS': 'In Progress',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled',
    'REJECTED': 'Rejected',
    'NO_SHOW': 'No Show'
  };
  return labels[backendStatus] || backendStatus;
};

// Format date for display
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// Format time for display
const formatTime = (timeStr) => {
  // Assuming timeStr is in "HH:MM" format
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

export function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(null);
  const [joinLoading, setJoinLoading] = useState(null);
  const [payLoading, setPayLoading] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState({});

  const { user, isAuthenticated } = useAuth();
  const patientId = user?.id || user?._id;
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [checkoutBanner, setCheckoutBanner] = useState(null);

  // Fetch appointments (silent = no full-page loading state, e.g. after Stripe redirect)
  const fetchAppointments = async (options = {}) => {
    const silent = options.silent === true;
    if (!patientId) {
      setError('Please log in to view appointments');
      setLoading(false);
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const response = await fetch(
        `${API_URL}/api/appointments/my-appointments?sortBy=dateAsc`,
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      
      if (data.success) {
        setAppointments(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch appointments');
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [patientId, activeTab]);

  // Complete Stripe Checkout: session_id from return URL or from sessionStorage (saved before redirect).
  useEffect(() => {
    const sessionId =
      searchParams.get('session_id') ||
      sessionStorage.getItem('stripe_last_checkout_session');
    if (!sessionId || !patientId) return;

    const doneKey = `stripe_checkout_ok_${sessionId}`;
    if (sessionStorage.getItem(doneKey) === '1') {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('checkout');
        next.delete('session_id');
        return next;
      }, { replace: true });
      return;
    }

    const processingKey = `stripe_checkout_processing_${sessionId}`;
    if (sessionStorage.getItem(processingKey) === '1') return;
    sessionStorage.setItem(processingKey, '1');

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/payments/complete-checkout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sessionId })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Could not confirm payment');
        }
        if (cancelled) return;
        sessionStorage.setItem(doneKey, '1');
        sessionStorage.removeItem('stripe_last_checkout_session');
        setCheckoutBanner({
          type: 'success',
          text: 'Payment successful. Your appointment is confirmed.'
        });
        await fetchAppointments({ silent: true });
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('checkout');
          next.delete('session_id');
          return next;
        }, { replace: true });
      } catch (e) {
        if (!cancelled) {
          setCheckoutBanner({
            type: 'error',
            text: e.message || 'Payment confirmation failed. You can refresh this page to try again.'
          });
        }
      } finally {
        sessionStorage.removeItem(processingKey);
      }
    })();

    return () => {
      cancelled = true;
      sessionStorage.removeItem(processingKey);
    };
  }, [searchParams, setSearchParams, patientId]);

  // Poll for appointment updates instead of using WebSocket.
  useEffect(() => {
    if (!patientId) return;

    const intervalId = setInterval(() => {
      fetchAppointments();
    }, 15000);

    return () => {
      clearInterval(intervalId);
    };
  }, [patientId, activeTab]);

  // Cancel appointment
  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setCancelLoading(appointmentId);
      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/appointments/${appointmentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh appointments
        fetchAppointments();
      } else {
        throw new Error(data.message || 'Failed to cancel appointment');
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert(err.message);
    } finally {
      setCancelLoading(null);
    }
  };

  // Join video call - get session details and open meeting link
  const handleJoin = async (appointmentId) => {
    try {
      setJoinLoading(appointmentId);

      const response = await fetch(
        `${API_URL}/api/patient/consultations/${appointmentId}/join`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get session details');
      }
      
      if (data.success && data.data) {
        const meetingLink =
          data.data.meetingLink ||
          data.data.telemedicineSession?.meetingLink ||
          data.data.appointment?.meetingLink;
        
        if (meetingLink) {
          window.open(meetingLink, '_blank');
        } else {
          alert('No meeting link available. Please contact support.');
        }
      } else {
        throw new Error(data.message || 'Failed to get session details');
      }
    } catch (err) {
      console.error('Error joining session:', err);
      alert(err.message);
    } finally {
      setJoinLoading(null);
    }
  };

  const handlePay = async (appointmentId) => {
    try {
      setPayLoading(appointmentId);
      const origin = window.location.origin;
      const checkoutRes = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId,
          currency: 'usd',
          successUrl: `${origin}/patient/appointments?checkout=success`,
          cancelUrl: `${origin}/patient/appointments?checkout=cancelled`
        })
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        throw new Error(checkoutData.message || 'Could not start payment');
      }
      if (checkoutData.url) {
        if (checkoutData.sessionId) {
          sessionStorage.setItem('stripe_last_checkout_session', checkoutData.sessionId);
        }
        window.location.href = checkoutData.url;
        return;
      }
      throw new Error('No payment page URL returned');
    } catch (err) {
      console.error('Payment checkout error:', err);
      alert(err.message || 'Could not start payment');
    } finally {
      setPayLoading(null);
    }
  };

  // View notes (placeholder)
  const handleViewNotes = (appointmentId) => {
    console.log('View notes', appointmentId);
    // TODO: Implement notes view
    alert('Notes feature coming soon!');
  };

  // Rate appointment
  const handleRate = async (appointmentId, rating, feedback) => {
    try {
      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/appointments/${appointmentId}/rate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ rating, feedback })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }

      const data = await response.json();
      
      if (data.success) {
        fetchAppointments();
        alert('Thank you for your feedback!');
      } else {
        throw new Error(data.message || 'Failed to submit rating');
      }
    } catch (err) {
      console.error('Error rating appointment:', err);
      alert(err.message);
    }
  };

  // Transform backend appointment to frontend format
  const transformAppointment = (app) => ({
    id: app._id,
    doctorName: app.doctorName || 'Unknown Doctor',
    specialty: app.specialty,
    date: formatDate(app.appointmentDate),
    time: formatTime(app.appointmentTime),
    endTime: app.endTime ? formatTime(app.endTime) : null,
    status: mapStatus(app.status),
    statusLabel: getStatusLabel(app.status),
    rawStatus: app.status,
    type: app.type === 'TELEMEDICINE' ? 'video' : 'in-person',
    doctorImage: app.doctorImage || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150',
    meetingLink: app.meetingLink,
    queueNumber: app.queueNumber,
    estimatedStartTime: app.estimatedStartTime,
    duration: app.duration,
    reason: app.reason,
    symptoms: app.symptoms,
    doctorNotes: app.doctorNotes,
    cancellationReason: app.cancellationReason,
    rescheduleCount: app.rescheduleCount,
    rating: app.rating,
    canRate: app.status === 'COMPLETED' && !app.rating?.score,
    fee: app.fee ?? 0,
    paymentStatus: app.paymentStatus || 'PENDING',
    feeFormatted:
      typeof app.fee === 'number' && app.fee > 0
        ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(app.fee)
        : null,
    originalData: app // Keep original data for reference
  });

  // Refresh a single appointment's status on demand.
  const refreshAppointmentStatus = async (appointmentId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/appointments/${appointmentId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to refresh appointment status');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setTrackingStatus(prev => ({
          ...prev,
          [appointmentId]: data.data
        }));
        fetchAppointments();
      }
    } catch (err) {
      console.error('Error refreshing appointment status:', err);
    }
  };

  const filteredAppointments = appointments
    .map(transformAppointment)
    .filter((app) => {
      if (activeTab === 'upcoming') return app.status === 'upcoming';
      return app.status === 'completed' || app.status === 'cancelled';
    });

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Loading appointments...</span>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-slate-500">
            Manage your upcoming and past consultations.
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-medium text-red-900">Error loading appointments</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
          <Button 
            onClick={fetchAppointments} 
            variant="outline" 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-slate-500">
            Manage your upcoming and past consultations.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAppointments}>
          Refresh
        </Button>
      </div>

      {checkoutBanner && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            checkoutBanner.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <span>{checkoutBanner.text}</span>
            <button
              type="button"
              onClick={() => setCheckoutBanner(null)}
              className="text-slate-500 hover:text-slate-800 shrink-0"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'upcoming'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Upcoming
            {activeTab === 'upcoming' && filteredAppointments.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                {filteredAppointments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('past')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'past'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Past Appointments
          </button>
        </nav>
      </div>

      <div className="space-y-4">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              trackingStatus={trackingStatus[appointment.id]}
              onJoin={(id) => handleJoin(id)}
              onCancel={(id) => handleCancel(id)}
              onPay={(id) => handlePay(id)}
              onViewNotes={(id) => handleViewNotes(id)}
              onRate={(id, rating, feedback) => handleRate(id, rating, feedback)}
              onTrack={() => refreshAppointmentStatus(appointment.id)}
              isJoinLoading={joinLoading === appointment.id}
              isCancelLoading={cancelLoading === appointment.id}
              isPaymentLoading={payLoading === appointment.id}
            />
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <CalendarIcon className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              No {activeTab} appointments
            </h3>
            <p className="text-slate-500">
              You don't have any {activeTab} appointments at the moment.
            </p>
          </div>
        )}
      </div>

      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={() => {
          fetchAppointments();
          setIsBookModalOpen(false);
        }}
        patientId={user?.id || user?._id}
        patientName={user?.name || user?.username}
        patientEmail={user?.email}
        patientPhone={user?.phone}
      />
    </div>
  );
}
