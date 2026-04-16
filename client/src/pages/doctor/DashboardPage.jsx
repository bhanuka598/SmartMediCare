import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Video,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/shared/Badge';
import { API_URL } from '../../lib/api';

const getStatusVariant = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'COMPLETED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'CANCELLED':
    case 'REJECTED':
    case 'NO_SHOW':
      return 'error';
    default:
      return 'info';
  }
};

const formatDisplayName = (user, profile) => {
  const fullName =
    `${profile?.profile?.firstName || ''} ${profile?.profile?.lastName || ''}`.trim() ||
    user?.name ||
    user?.username ||
    'Doctor';

  const parts = fullName.split(' ').filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : fullName;
};

const formatTime = (time) => {
  if (!time) return 'N/A';
  const [hours, minutes] = String(time).split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;

  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

const formatShortDate = (dateString) => {
  if (!dateString) return 'Upcoming';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const normalized = date.toISOString().split('T')[0];
  if (normalized === today.toISOString().split('T')[0]) return 'Today';
  if (normalized === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function DoctorDashboardPage() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [error, setError] = useState(null);

  const fetchWithAuth = useCallback(async (url) => {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }, [token]);

  const loadDashboard = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    const results = await Promise.allSettled([
      fetchWithAuth(`${API_URL}/api/doctors/profile`),
      fetchWithAuth(`${API_URL}/api/doctors/statistics`),
      fetchWithAuth(`${API_URL}/api/doctors/appointments/today`),
      fetchWithAuth(`${API_URL}/api/doctors/appointments/pending`)
    ]);

    const [profileResult, statsResult, todayResult, pendingResult] = results;
    let hasLoadedAnyData = false;

    if (profileResult.status === 'fulfilled' && profileResult.value.success) {
      setProfile(profileResult.value.profile);
      hasLoadedAnyData = true;
    } else {
      setProfile(null);
    }

    if (statsResult.status === 'fulfilled' && statsResult.value.success) {
      const doctorStats = statsResult.value.statistics || {};
      const ratings = statsResult.value.ratings || {};
      setStats({
        totalAppointments: doctorStats.totalAppointments || 0,
        completedAppointments: doctorStats.completedAppointments || 0,
        totalPatients: doctorStats.totalPatients || 0,
        averageRating: ratings.averageRating || 0
      });
      hasLoadedAnyData = true;
    } else {
      setStats({
        totalAppointments: 0,
        completedAppointments: 0,
        totalPatients: 0,
        averageRating: 0
      });
    }

    if (todayResult.status === 'fulfilled' && todayResult.value.success) {
      setTodayAppointments(todayResult.value.appointments || []);
      hasLoadedAnyData = true;
    } else {
      setTodayAppointments([]);
    }

    if (pendingResult.status === 'fulfilled' && pendingResult.value.success) {
      setPendingRequests(pendingResult.value.requests || []);
      hasLoadedAnyData = true;
    } else {
      setPendingRequests([]);
    }

    if (!hasLoadedAnyData) {
      setError('Unable to load dashboard data right now. Please try again.');
    }

    setLoading(false);
  }, [fetchWithAuth, token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const doctorName = formatDisplayName(user, profile);
  const telemedicineCount = todayAppointments.filter((appt) => appt.type === 'TELEMEDICINE').length;

  const handleAccept = async (appointmentId) => {
    try {
      const response = await fetch(`${API_URL}/api/doctors/appointments/${appointmentId}/accept`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to accept appointment');
      }

      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (appointmentId) => {
    try {
      const response = await fetch(`${API_URL}/api/doctors/appointments/${appointmentId}/reject`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Declined from dashboard' })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to reject appointment');
      }

      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good morning, Dr. {doctorName}
          </h1>
          <p className="text-slate-500">
            Here's your schedule and overview for today.
          </p>
        </div>

        <div className="flex gap-2">
          <Link to="/doctor/availability">
            <Button variant="outline" className="gap-2">
              <Clock size={18} /> Manage Schedule
            </Button>
          </Link>

          <Link to="/doctor/consultations">
            <Button className="gap-2">
              <Video size={18} /> Start Consultations
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboard}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Today's Appts</p>
              <h3 className="text-2xl font-bold text-slate-900">{todayAppointments.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Req.</p>
              <h3 className="text-2xl font-bold text-slate-900">{pendingRequests.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Patients</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats?.totalPatients || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Video size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Telemedicine</p>
              <h3 className="text-2xl font-bold text-slate-900">{telemedicineCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Today's Schedule</CardTitle>
              <Link
                to="/doctor/consultations"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View full schedule <ArrowRight size={16} />
              </Link>
            </CardHeader>

            <CardContent>
              {todayAppointments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No appointments scheduled for today.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayAppointments.map((appt) => (
                    <div
                      key={appt._id}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center h-12 w-16 bg-white rounded border border-slate-200 shrink-0">
                          <span className="text-xs text-slate-500 font-medium">TIME</span>
                          <span className="text-sm font-bold text-slate-900">
                            {formatTime(appt.appointmentTime).split(' ')[0]}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {appt.patientName || 'Patient'}
                          </h4>

                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={getStatusVariant(appt.status)}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {(appt.status || '').replace('_', ' ')}
                            </Badge>

                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              {appt.type === 'TELEMEDICINE' ? (
                                <Video size={12} />
                              ) : (
                                <Users size={12} />
                              )}
                              {appt.type === 'TELEMEDICINE' ? 'Video Call' : 'In-person'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {['CONFIRMED', 'IN_PROGRESS'].includes(appt.status) ? (
                          <Link to="/doctor/consultations">
                            <Button size="sm" className="gap-2">
                              {appt.type === 'TELEMEDICINE' ? 'Join Call' : 'Start Visit'}
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            View Notes
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Pending Requests
                <Badge variant="warning" className="ml-auto">
                  {pendingRequests.length} New
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p>No pending requests right now.</p>
                </div>
              ) : (
                pendingRequests.map((req) => (
                  <div
                    key={req._id}
                    className="p-4 rounded-lg border border-slate-100 bg-white shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-slate-900">
                        {req.patientName || 'Patient'}
                      </h4>
                      <span className="text-xs text-slate-500">
                        {formatShortDate(req.appointmentDate)} - {formatTime(req.appointmentTime)}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 mb-3 line-clamp-1">
                      {req.reason || 'No reason provided'}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => handleReject(req._id)}
                      >
                        <XCircle size={16} className="mr-1" /> Decline
                      </Button>

                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleAccept(req._id)}
                      >
                        <CheckCircle2 size={16} className="mr-1" /> Accept
                      </Button>
                    </div>
                  </div>
                ))
              )}

              <Link to="/doctor/patients">
                <Button variant="ghost" fullWidth className="text-blue-600 mt-2">
                  View all requests
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
