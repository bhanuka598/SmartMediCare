import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Calendar,
  FileText,
  Pill,
  Search,
  ArrowRight,
  Loader2,
  Plus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { AppointmentCard } from '../../components/appointments/AppointmentCard';
import { BookAppointmentModal } from '../../components/appointments/BookAppointmentModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function PatientDashboardPage() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const displayName =
    user?.name ||
    user?.username ||
    user?.email ||
    'Patient';

  const firstName = displayName.split(' ')[0];

  const normalizeAppointmentStatus = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'COMPLETED':
        return 'completed';
      case 'CANCELLED':
      case 'REJECTED':
      case 'NO_SHOW':
        return 'cancelled';
      default:
        return 'upcoming';
    }
  };

  const normalizeAppointmentType = (type) => {
    return type === 'TELEMEDICINE' ? 'video' : 'in-person';
  };

  // Fetch with timeout, retry logic, and error handling
  const fetchWithRetry = useCallback(async (url, options = {}, retries = 3, timeout = 10000) => {
    const fetchWithTimeout = async () => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        throw error;
      }
    };

    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetchWithTimeout();
        
        // Check for HTTP errors
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error;
        
        // Don't retry on 4xx errors (client errors)
        if (error.message?.includes('HTTP 4')) {
          throw error;
        }
        
        // Exponential backoff before retry
        if (i < retries - 1) {
          const delay = Math.min(1000 * Math.pow(2, i), 5000);
          console.log(`Retry ${i + 1}/${retries} for ${url} after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Failed after ${retries} attempts: ${lastError.message}`);
  }, []);

  // Fetch dashboard data with comprehensive error handling
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let hasLoadedData = false;

      // Fetch dashboard stats with retry
      try {
        const statsData = await fetchWithRetry(
          `${API_URL}/api/patient/dashboard/stats`,
          { headers: { 'Authorization': `Bearer ${token}` } },
          3,
          10000
        );
        if (statsData.success) {
          setStats(statsData.stats);
          hasLoadedData = true;
        }
      } catch (err) {
        console.error('Stats fetch failed:', err.message);
        setStats({ totalAppointments: 0, completedAppointments: 0, totalReports: 0, totalPrescriptions: 0 });
      }

      // Fetch upcoming appointments with retry
      try {
        const apptData = await fetchWithRetry(
          `${API_URL}/api/appointments/my-appointments?status=upcoming&limit=1`,
          { headers: { 'Authorization': `Bearer ${token}` } },
          3,
          15000
        );
        if (apptData.success && apptData.data?.length > 0) {
          const appt = apptData.data[0];
          setUpcomingAppointment({
            id: appt._id,
            doctorName: appt.doctorName || `Dr. ${appt.doctorId?.slice(-4) || 'Unknown'}`,
            specialty: appt.specialty || 'General',
            date: new Date(appt.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: appt.appointmentTime,
            status: normalizeAppointmentStatus(appt.status),
            type: normalizeAppointmentType(appt.type),
            doctorImage: appt.doctorImage || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150'
          });
          hasLoadedData = true;
        } else {
          setUpcomingAppointment(null);
        }
      } catch (err) {
        console.error('Appointments fetch failed:', err.message);
        setUpcomingAppointment(null);
      }

      // Fetch recent medical reports with retry
      try {
        const reportsData = await fetchWithRetry(
          `${API_URL}/api/patient/reports?limit=2`,
          { headers: { 'Authorization': `Bearer ${token}` } },
          3,
          10000
        );
        if (reportsData.success) {
          setRecentRecords(reportsData.reports?.slice(0, 2) || []);
          hasLoadedData = true;
        }
      } catch (err) {
        console.error('Reports fetch failed:', err.message);
        setRecentRecords([]);
      }

      // Fetch profile for health summary with retry
      try {
        const profileData = await fetchWithRetry(
          `${API_URL}/api/patient/profile`,
          { headers: { 'Authorization': `Bearer ${token}` } },
          3,
          10000
        );
        if (profileData.success) {
          setProfile(profileData.profile || null);
          hasLoadedData = true;
        }
      } catch (err) {
        console.error('Profile fetch failed:', err.message);
        setProfile(null);
      }

      try {
        const prescriptionsData = await fetchWithRetry(
          `${API_URL}/api/patient/prescriptions?limit=2`,
          { headers: { 'Authorization': `Bearer ${token}` } },
          3,
          10000
        );
        if (prescriptionsData.success) {
          setRecentPrescriptions(prescriptionsData.prescriptions?.slice(0, 2) || []);
          hasLoadedData = true;
        }
      } catch (err) {
        console.error('Prescriptions fetch failed:', err.message);
        setRecentPrescriptions([]);
      }

      // Show partial error if all requests failed
      if (!hasLoadedData) {
        setError('Unable to load dashboard data. Please check your connection and try again.');
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [token, fetchWithRetry]);

  useEffect(() => {
    if (token) fetchDashboardData();
  }, [token, fetchDashboardData]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCategoryColor = (category) => {
    const colors = {
      lab: 'bg-blue-100 text-blue-700',
      xray: 'bg-purple-100 text-purple-700',
      mri: 'bg-indigo-100 text-indigo-700',
      ct: 'bg-pink-100 text-pink-700',
      prescription: 'bg-green-100 text-green-700',
      discharge: 'bg-orange-100 text-orange-700',
      other: 'bg-slate-100 text-slate-700'
    };
    return colors[category] || colors.other;
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
            Welcome back, {firstName}
          </h1>
          <p className="text-slate-500">
            Here's a summary of your health journey.
          </p>
        </div>

        <Link to="/patient/doctors">
          <Button className="gap-2">
            <Search size={18} /> Find a Doctor
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/patient/doctors" className="group">
          <Card className="h-full transition-colors hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Search size={24} />
              </div>
              <span className="font-medium text-slate-900">
                Book Appointment
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link to="/patient/symptom-checker" className="group">
          <Card className="h-full transition-colors hover:border-amber-200 hover:bg-amber-50/50 cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity size={24} />
              </div>
              <span className="font-medium text-slate-900">
                Symptom Checker
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link to="/patient/records" className="group">
          <Card className="h-full transition-colors hover:border-green-200 hover:bg-green-50/50 cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <span className="font-medium text-slate-900">
                Medical Records
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link to="/patient/appointments" className="group">
          <Card className="h-full transition-colors hover:border-purple-200 hover:bg-purple-50/50 cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar size={24} />
              </div>
              <span className="font-medium text-slate-900">My Schedule</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDashboardData}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-4">
              <p className="text-sm text-blue-600">Total Appointments</p>
              <p className="text-2xl font-bold text-blue-700">{stats.totalAppointments || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-100">
            <CardContent className="p-4">
              <p className="text-sm text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-700">{stats.completedAppointments || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-100">
            <CardContent className="p-4">
              <p className="text-sm text-purple-600">Reports</p>
              <p className="text-2xl font-bold text-purple-700">{stats.totalReports || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-100">
            <CardContent className="p-4">
              <p className="text-sm text-amber-600">Prescriptions</p>
              <p className="text-2xl font-bold text-amber-700">{stats.totalPrescriptions || 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Next Appointment</CardTitle>
              <Link
                to="/patient/appointments"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all <ArrowRight size={16} />
              </Link>
            </CardHeader>

            <CardContent>
              {upcomingAppointment ? (
                <AppointmentCard
                  appointment={upcomingAppointment}
                  onJoin={() => console.log('Joining call')}
                />
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No upcoming appointments</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 gap-2"
                    onClick={() => setIsBookModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Book Appointment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Health Records</CardTitle>
            </CardHeader>

            <CardContent>
              {recentRecords.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No recent records</p>
                  <Link to="/patient/records">
                    <Button variant="outline" size="sm" className="mt-3">
                      Upload Report
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentRecords.map((record) => (
                    <div
                      key={record._id}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                          <FileText size={20} />
                        </div>

                        <div>
                          <p className="font-medium text-slate-900">
                            {record.title}
                          </p>
                          <p className="text-sm text-slate-500">
                            Added {formatDate(record.uploadedAt)} • {record.category}
                          </p>
                        </div>
                      </div>

                      <Link to="/patient/records">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Recent Prescriptions</CardTitle>
              <Link
                to="/patient/records"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all <ArrowRight size={16} />
              </Link>
            </CardHeader>

            <CardContent>
              {recentPrescriptions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Pill className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No prescriptions yet</p>
                  <p className="text-sm">Issued prescriptions will appear here after your consultations.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPrescriptions.map((prescription) => (
                    <div
                      key={prescription._id || prescription.prescriptionId}
                      className="flex items-start justify-between p-4 rounded-lg border border-slate-100 bg-slate-50"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded bg-white border border-slate-200 flex items-center justify-center text-green-600">
                          <Pill size={20} />
                        </div>

                        <div>
                          <p className="font-medium text-slate-900">{prescription.diagnosis}</p>
                          <p className="text-sm text-slate-500">
                            Dr. {prescription.doctorName} • {formatDate(prescription.createdAt)}
                          </p>
                          {prescription.medications?.[0]?.name && (
                            <p className="text-sm text-slate-600 mt-1">
                              {prescription.medications[0].name}
                            </p>
                          )}
                        </div>
                      </div>

                      <Link to="/patient/records">
                        <Button variant="ghost" size="sm">
                          Open
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          <Card className="bg-blue-600 text-white border-none">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Activity size={20} className="text-white" />
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2">Not feeling well?</h3>
              <p className="text-slate-600 text-sm mb-6">
                Use our AI symptom checker to get preliminary insights and find
                the right specialist.
              </p>

              <Link to="/patient/symptom-checker">
                <Button
                  variant="primary"
                  fullWidth
                  className="bg-blue-600 text-white hover:bg-blue-700 border-0"
                >
                  Check Symptoms
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Health Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Blood Type</span>
                <span className="font-medium text-slate-900">{profile?.profile?.bloodType || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Height</span>
                <span className="font-medium text-slate-900">{profile?.profile?.height ? `${profile.profile.height} cm` : 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Weight</span>
                <span className="font-medium text-slate-900">{profile?.profile?.weight ? `${profile.profile.weight} kg` : 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600">Allergies</span>
                <span className="font-medium text-slate-900">
                  {profile?.profile?.allergies?.length > 0 ? profile.profile.allergies.join(', ') : 'None'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={() => {
          fetchDashboardData();
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
