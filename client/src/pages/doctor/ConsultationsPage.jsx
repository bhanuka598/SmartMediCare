import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Calendar, ExternalLink, Loader2, Play, Square, Video } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/shared/Badge';
import { API_URL } from '../../lib/api';

export function ConsultationsPage() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchConsultations = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/doctors/appointments?limit=100&sortBy=dateAsc`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load consultations');
      }

      setAppointments((result.data || []).filter((apt) => apt.type === 'TELEMEDICINE'));
    } catch (err) {
      setError(err.message || 'Failed to load consultations');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  const startSession = async (appointmentId) => {
    try {
      setActionLoading(appointmentId);
      const response = await fetch(
        `${API_URL}/api/doctors/appointments/${appointmentId}/telemedicine/start`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to start session');
      }

      if (result.data?.meetingLink) {
        window.open(result.data.meetingLink, '_blank', 'noopener,noreferrer');
      }

      fetchConsultations();
    } catch (err) {
      alert(err.message || 'Failed to start session');
    } finally {
      setActionLoading(null);
    }
  };

  const joinSession = async (appointmentId) => {
    try {
      setActionLoading(appointmentId);
      const response = await fetch(
        `${API_URL}/api/doctors/appointments/${appointmentId}/telemedicine`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load session');
      }

      if (!result.data?.meetingLink) {
        throw new Error('Meeting link is not available yet');
      }

      window.open(result.data.meetingLink, '_blank', 'noopener,noreferrer');
    } catch (err) {
      alert(err.message || 'Failed to join session');
    } finally {
      setActionLoading(null);
    }
  };

  const endSession = async (appointmentId) => {
    try {
      setActionLoading(appointmentId);
      const response = await fetch(
        `${API_URL}/api/doctors/appointments/${appointmentId}/telemedicine/end`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to end session');
      }

      fetchConsultations();
    } catch (err) {
      alert(err.message || 'Failed to end session');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-slate-600">{error}</p>
        <Button variant="outline" onClick={fetchConsultations}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Consultations</h1>
          <p className="text-slate-500">Start and manage your telemedicine sessions.</p>
        </div>
        <Button variant="outline" onClick={fetchConsultations}>Refresh</Button>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <Video className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            No telemedicine appointments available.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <Card key={appointment._id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{appointment.patientName || 'Unknown Patient'}</CardTitle>
                <Badge variant={appointment.status === 'IN_PROGRESS' ? 'info' : 'default'}>
                  {appointment.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(appointment.appointmentDate)}</span>
                  <span>{appointment.appointmentTime}</span>
                  <span>{appointment.specialty}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="gap-2"
                    disabled={actionLoading === appointment._id || !['CONFIRMED', 'IN_PROGRESS'].includes(appointment.status)}
                    onClick={() => startSession(appointment._id)}
                  >
                    {actionLoading === appointment._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play size={16} />}
                    Start Session
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={actionLoading === appointment._id}
                    onClick={() => joinSession(appointment._id)}
                  >
                    <ExternalLink size={16} />
                    Join
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={actionLoading === appointment._id}
                    onClick={() => endSession(appointment._id)}
                  >
                    <Square size={16} />
                    End Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
