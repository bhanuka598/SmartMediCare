import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Calendar,
  FileText,
  ClipboardList,
  Phone,
  Mail,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Clock,
  Stethoscope,
  Loader2,
  AlertCircle,
  X,
  MapPin,
  Video,
  CheckCircle,
  XCircle,
  Clock3,
  Check,
  Ban,
  Play,
  UserX,
  ExternalLink,
  Pill
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function PatientsPage() {
  const { user, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    todayAppointments: 0,
    newPatientsThisMonth: 0
  });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [actionLoading, setActionLoading] = useState(null); // appointmentId being processed

  // Fetch pending appointment requests
  const fetchPendingRequests = useCallback(async () => {
    if (!user?.id || !token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/doctors/appointments/pending`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch pending requests:', errorData);
        return;
      }

      const result = await response.json();
      if (result.success) {
        setPendingRequests(result.requests || []);
      }
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  }, [user?.id, token]);

  // Handle accept appointment
  const handleAcceptAppointment = async (appointmentId) => {
    if (!token) return;

    try {
      setActionLoading(appointmentId);
      const response = await fetch(
        `${API_URL}/api/doctors/appointments/${appointmentId}/accept`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to accept appointment');
      }

      const result = await response.json();
      if (result.success) {
        // Refresh data
        fetchPendingRequests();
        fetchPatients();
      }
    } catch (err) {
      console.error('Error accepting appointment:', err);
      alert(err.message || 'Failed to accept appointment');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject appointment
  const handleRejectAppointment = async (appointmentId) => {
    if (!token) return;

    const reason = prompt('Enter reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    try {
      setActionLoading(appointmentId);
      const response = await fetch(
        `${API_URL}/api/doctors/appointments/${appointmentId}/reject`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reject appointment');
      }

      const result = await response.json();
      if (result.success) {
        // Refresh data
        fetchPendingRequests();
        fetchPatients();
      }
    } catch (err) {
      console.error('Error rejecting appointment:', err);
      alert(err.message || 'Failed to reject appointment');
    } finally {
      setActionLoading(null);
    }
  };

  // Fetch doctor's appointments and derive patients
  const fetchPatients = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all appointments for this doctor using doctor-service
      const response = await fetch(
        `${API_URL}/api/doctors/appointments?limit=1000`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch appointments`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch appointments');
      }

      // Extract unique patients from appointments
      const appointments = result.data || [];
      const patientMap = new Map();

      appointments.forEach(apt => {
        const patientId = apt.patientId;
        if (!patientId) return;

        const existing = patientMap.get(patientId);
        const appointmentDate = new Date(apt.appointmentDate);

        if (!existing) {
          // First time seeing this patient
          patientMap.set(patientId, {
            id: patientId,
            name: apt.patientName || 'Unknown Patient',
            email: apt.patientEmail || '-',
            phone: apt.patientPhone || '-',
            age: null, // Not available in appointment data
            gender: null, // Not available in appointment data
            lastVisit: apt.status === 'COMPLETED' ? apt.appointmentDate : null,
            nextAppointment: ['CONFIRMED', 'PENDING', 'IN_PROGRESS'].includes(apt.status)
              ? apt.appointmentDate
              : null,
            status: 'active',
            totalVisits: apt.status === 'COMPLETED' ? 1 : 0,
            condition: apt.reason || 'General Consultation',
            firstVisit: apt.appointmentDate,
            appointments: [apt]
          });
        } else {
          // Update existing patient data
          existing.appointments.push(apt);

          // Update last visit if this appointment is completed and more recent
          if (apt.status === 'COMPLETED') {
            if (!existing.lastVisit || appointmentDate > new Date(existing.lastVisit)) {
              existing.lastVisit = apt.appointmentDate;
            }
            existing.totalVisits++;
          }

          // Update next appointment if this is a future confirmed appointment
          if (['CONFIRMED', 'PENDING', 'IN_PROGRESS'].includes(apt.status)) {
            const aptDate = new Date(apt.appointmentDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (aptDate >= today) {
              if (!existing.nextAppointment || aptDate < new Date(existing.nextAppointment)) {
                existing.nextAppointment = apt.appointmentDate;
              }
            }
          }

          // Track first visit
          if (new Date(apt.appointmentDate) < new Date(existing.firstVisit)) {
            existing.firstVisit = apt.appointmentDate;
          }
        }
      });

      // Convert map to array and determine patient status
      const patientList = Array.from(patientMap.values()).map(patient => {
        // Determine status: active if has next appointment or recent visit (within 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const hasRecentVisit = patient.lastVisit && new Date(patient.lastVisit) > sixMonthsAgo;
        const hasUpcomingAppointment = patient.nextAppointment && new Date(patient.nextAppointment) >= new Date();

        return {
          ...patient,
          status: (hasRecentVisit || hasUpcomingAppointment) ? 'active' : 'inactive'
        };
      });

      // Sort by next appointment date (those with upcoming appointments first)
      patientList.sort((a, b) => {
        if (a.nextAppointment && b.nextAppointment) {
          return new Date(a.nextAppointment) - new Date(b.nextAppointment);
        }
        if (a.nextAppointment) return -1;
        if (b.nextAppointment) return 1;
        return new Date(b.lastVisit || 0) - new Date(a.lastVisit || 0);
      });

      setPatients(patientList);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      setStats({
        totalPatients: patientList.length,
        activePatients: patientList.filter(p => p.status === 'active').length,
        todayAppointments: appointments.filter(apt =>
          apt.appointmentDate === todayStr &&
          ['CONFIRMED', 'PENDING', 'IN_PROGRESS'].includes(apt.status)
        ).length,
        newPatientsThisMonth: patientList.filter(p =>
          new Date(p.firstVisit) >= thisMonth
        ).length
      });

    } catch (err) {
      console.error('Error fetching patients:', err);
      setError(err.message || 'Failed to load patients. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, token]);

  useEffect(() => {
    fetchPatients();
    fetchPendingRequests();
  }, [fetchPatients, fetchPendingRequests]);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.condition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || patient.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'No upcoming';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name || name === 'Unknown Patient') return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500">Loading patients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-slate-700 mb-2">Failed to load patients</h3>
        <p className="text-slate-500 mb-4">{error}</p>
        <Button onClick={fetchPatients} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Patients</h1>
          <p className="text-slate-500">
            Manage and view all your patient records
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FileText size={18} /> Export Records
          </Button>
          <Button className="gap-2">
            <Users size={18} /> Add Patient
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Patients</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.totalPatients}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Patients</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.activePatients}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Today's Appts</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.todayAppointments}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Stethoscope size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">New This Month</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.newPatientsThisMonth}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Appointment Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock3 size={20} className="text-amber-600" />
              Pending Appointment Requests
              <Badge variant="warning" className="ml-2">
                {pendingRequests.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map((request) => (
                <div
                  key={request._id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center gap-4 mb-3 md:mb-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                      {request.patientName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{request.patientName || 'Unknown Patient'}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar size={14} />
                        {formatDate(request.appointmentDate)} at {request.appointmentTime}
                        <span className="text-slate-300">|</span>
                        {request.type === 'TELEMEDICINE' ? (
                          <><Video size={14} /> Video</>
                        ) : (
                          <><MapPin size={14} /> In-Person</>
                        )}
                      </div>
                      {request.reason && (
                        <p className="text-sm text-slate-600 mt-1">
                          <span className="font-medium">Reason:</span> {request.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 border-red-200"
                      onClick={() => handleRejectAppointment(request._id)}
                      disabled={actionLoading === request._id}
                    >
                      {actionLoading === request._id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <><Ban size={16} className="mr-1" /> Reject</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleAcceptAppointment(request._id)}
                      disabled={actionLoading === request._id}
                    >
                      {actionLoading === request._id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <><Check size={16} className="mr-1" /> Accept</>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
              {pendingRequests.length > 3 && (
                <p className="text-center text-sm text-slate-500 py-2">
                  + {pendingRequests.length - 3} more pending requests
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search patients by name, email, or condition..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button variant="outline" className="gap-2">
                <Filter size={18} /> More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Patient List ({filteredPatients.length})</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Patient</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Contact</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Condition</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Last Visit</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Next Appt</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                          {getInitials(patient.name)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{patient.name}</p>
                          <p className="text-sm text-slate-500">
                            {patient.age ? `${patient.age} yrs` : 'Age unknown'}
                            {patient.gender ? ` • ${patient.gender}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-600 flex items-center gap-1">
                          <Mail size={14} /> {patient.email}
                        </p>
                        <p className="text-sm text-slate-600 flex items-center gap-1">
                          <Phone size={14} /> {patient.phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-slate-700">{patient.condition}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Clock size={14} />
                        {formatDate(patient.lastVisit)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {patient.nextAppointment ? (
                        <div className="flex items-center gap-1 text-sm text-blue-600">
                          <Calendar size={14} />
                          {formatDate(patient.nextAppointment)}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Not scheduled</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={patient.status === 'active' ? 'success' : 'default'}>
                        {patient.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setIsModalOpen(true);
                          }}
                        >
                          View
                        </Button>
                        <button className="p-1 hover:bg-slate-100 rounded">
                          <MoreVertical size={18} className="text-slate-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPatients.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-700">
                {searchQuery || filterStatus !== 'all' ? 'No patients found' : 'No patients yet'}
              </h3>
              <p className="text-slate-500">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Patients will appear here once they book appointments with you'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredPatients.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Showing {filteredPatients.length} of {patients.length} patients
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600 border-blue-200">
                  1
                </Button>
                <Button variant="outline" size="sm">
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Details Modal */}
      {isModalOpen && selectedPatient && (
          <PatientDetailsModal
            patient={selectedPatient}
            token={token}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedPatient(null);
            }}
          formatDate={formatDate}
          onAcceptAppointment={handleAcceptAppointment}
          onRejectAppointment={handleRejectAppointment}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}

// Patient Details Modal Component
function PatientDetailsModal({ patient, token, onClose, formatDate, onAcceptAppointment, onRejectAppointment, actionLoading }) {
  const [reports, setReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [detailsError, setDetailsError] = useState(null);
  const [issuingPrescription, setIssuingPrescription] = useState(false);
  const [prescriptionError, setPrescriptionError] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    appointmentId: '',
    diagnosis: '',
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    notes: '',
    followUpDate: ''
  });

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  useEffect(() => {
    const fetchPatientResources = async () => {
      try {
        setDetailsLoading(true);
        setDetailsError(null);

        const [reportsResponse, prescriptionsResponse] = await Promise.all([
          fetch(`${API_URL}/api/doctors/patients/${patient.id}/reports`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${API_URL}/api/doctors/patients/${patient.id}/prescriptions`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        const reportsResult = await reportsResponse.json().catch(() => ({}));
        const prescriptionsResult = await prescriptionsResponse.json().catch(() => ({}));

        if (!reportsResponse.ok) {
          throw new Error(reportsResult.message || 'Failed to fetch patient reports');
        }

        if (!prescriptionsResponse.ok) {
          throw new Error(prescriptionsResult.message || 'Failed to fetch patient prescriptions');
        }

        setReports(reportsResult.data || []);
        setPrescriptions(prescriptionsResult.data || []);
      } catch (error) {
        console.error('Error fetching patient resources:', error);
        setDetailsError(error.message || 'Failed to load patient records');
      } finally {
        setDetailsLoading(false);
      }
    };

    if (patient?.id && token) {
      fetchPatientResources();
    }
  }, [patient?.id, token]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'CONFIRMED':
        return <CheckCircle size={16} className="text-blue-600" />;
      case 'PENDING':
        return <Clock3 size={16} className="text-amber-600" />;
      case 'CANCELLED':
        return <XCircle size={16} className="text-red-600" />;
      case 'REJECTED':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-slate-500" />;
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'CONFIRMED':
        return 'info';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  // Sort appointments by date (newest first)
  const sortedAppointments = [...(patient.appointments || [])].sort((a, b) => 
    new Date(b.appointmentDate) - new Date(a.appointmentDate)
  );

  const availableAppointments = sortedAppointments.filter((appointment) =>
    ['CONFIRMED', 'COMPLETED', 'IN_PROGRESS'].includes(appointment.status)
  );

  const handlePrescriptionFieldChange = (field, value) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleIssuePrescription = async (event) => {
    event.preventDefault();

    const medication = {
      name: prescriptionForm.medicationName.trim(),
      dosage: prescriptionForm.dosage.trim(),
      frequency: prescriptionForm.frequency.trim(),
      duration: prescriptionForm.duration.trim(),
      instructions: prescriptionForm.instructions.trim()
    };

    if (!prescriptionForm.diagnosis.trim() || !medication.name) {
      setPrescriptionError('Diagnosis and medication name are required');
      return;
    }

    try {
      setIssuingPrescription(true);
      setPrescriptionError(null);

      const response = await fetch(`${API_URL}/api/doctors/patients/${patient.id}/prescriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: prescriptionForm.appointmentId || null,
          diagnosis: prescriptionForm.diagnosis.trim(),
          medications: [medication],
          notes: prescriptionForm.notes.trim(),
          followUpDate: prescriptionForm.followUpDate || null
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to issue prescription');
      }

      setPrescriptions((prev) => [result.data, ...prev]);
      setPrescriptionForm({
        appointmentId: '',
        diagnosis: '',
        medicationName: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        notes: '',
        followUpDate: ''
      });
    } catch (error) {
      console.error('Error issuing prescription:', error);
      setPrescriptionError(error.message || 'Failed to issue prescription');
    } finally {
      setIssuingPrescription(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden m-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
              {patient.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>{patient.totalVisits} total visits</span>
                <span>•</span>
                <Badge variant={patient.status === 'active' ? 'success' : 'default'}>
                  {patient.status === 'active' ? 'Active Patient' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <Mail size={20} className="text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-medium text-slate-900">{patient.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <Phone size={20} className="text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Phone</p>
                <p className="font-medium text-slate-900">{patient.phone}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{patient.totalVisits}</p>
              <p className="text-sm text-slate-600">Total Visits</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {sortedAppointments.filter(a => a.status === 'COMPLETED').length}
              </p>
              <p className="text-sm text-slate-600">Completed</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">
                {sortedAppointments.filter(a => ['CONFIRMED', 'PENDING'].includes(a.status)).length}
              </p>
              <p className="text-sm text-slate-600">Upcoming</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText size={20} />
                Patient Uploaded Reports
              </h3>

              {detailsLoading ? (
                <div className="flex items-center gap-2 text-slate-500 p-4 bg-slate-50 rounded-lg">
                  <Loader2 size={16} className="animate-spin" />
                  Loading reports...
                </div>
              ) : detailsError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {detailsError}
                </div>
              ) : reports.length > 0 ? (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report._id}
                      className="p-4 border border-slate-200 rounded-lg bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{report.title}</p>
                          <p className="text-sm text-slate-500">
                            {report.category || 'other'} • {report.fileType || 'file'}
                          </p>
                          {report.description && (
                            <p className="text-sm text-slate-600 mt-2">{report.description}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-2">
                            Uploaded {formatDate(report.uploadedAt)}
                          </p>
                        </div>
                        <a
                          href={report.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                        >
                          Open <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-500">
                  No patient-uploaded reports available yet.
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <ClipboardList size={20} />
                  Digital Prescriptions
                </h3>

                {detailsLoading ? (
                  <div className="flex items-center gap-2 text-slate-500 p-4 bg-slate-50 rounded-lg">
                    <Loader2 size={16} className="animate-spin" />
                    Loading prescriptions...
                  </div>
                ) : prescriptions.length > 0 ? (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {prescriptions.map((prescription) => (
                      <div
                        key={prescription.prescriptionId || prescription._id}
                        className="p-4 border border-slate-200 rounded-lg bg-white"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">{prescription.diagnosis}</p>
                            <p className="text-sm text-slate-500">
                              {prescription.doctorName} • {formatDate(prescription.createdAt)}
                            </p>
                          </div>
                          <Badge variant="success">{prescription.status || 'active'}</Badge>
                        </div>
                        {prescription.medications?.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {prescription.medications.map((medication, index) => (
                              <div key={`${prescription.prescriptionId}-${index}`} className="text-sm text-slate-600">
                                <span className="font-medium text-slate-800">{medication.name}</span>
                                {medication.dosage ? ` • ${medication.dosage}` : ''}
                                {medication.frequency ? ` • ${medication.frequency}` : ''}
                                {medication.duration ? ` • ${medication.duration}` : ''}
                              </div>
                            ))}
                          </div>
                        )}
                        {prescription.notes && (
                          <p className="text-sm text-slate-600 mt-3">
                            <span className="font-medium">Notes:</span> {prescription.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-500">
                    No prescriptions issued for this patient yet.
                  </div>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                <h4 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
                  <Pill size={18} />
                  Issue New Prescription
                </h4>

                <form className="space-y-4" onSubmit={handleIssuePrescription}>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Related Appointment</label>
                    <select
                      value={prescriptionForm.appointmentId}
                      onChange={(e) => handlePrescriptionFieldChange('appointmentId', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">General prescription</option>
                      {availableAppointments.map((appointment) => (
                        <option key={appointment._id} value={appointment._id}>
                          {formatDate(appointment.appointmentDate)} at {appointment.appointmentTime}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis</label>
                    <input
                      type="text"
                      value={prescriptionForm.diagnosis}
                      onChange={(e) => handlePrescriptionFieldChange('diagnosis', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter diagnosis"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Medication</label>
                      <input
                        type="text"
                        value={prescriptionForm.medicationName}
                        onChange={(e) => handlePrescriptionFieldChange('medicationName', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Medication name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Dosage</label>
                      <input
                        type="text"
                        value={prescriptionForm.dosage}
                        onChange={(e) => handlePrescriptionFieldChange('dosage', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. 500mg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                      <input
                        type="text"
                        value={prescriptionForm.frequency}
                        onChange={(e) => handlePrescriptionFieldChange('frequency', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Twice daily"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                      <input
                        type="text"
                        value={prescriptionForm.duration}
                        onChange={(e) => handlePrescriptionFieldChange('duration', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. 5 days"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Instructions</label>
                    <input
                      type="text"
                      value={prescriptionForm.instructions}
                      onChange={(e) => handlePrescriptionFieldChange('instructions', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. After meals"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                    <textarea
                      rows={3}
                      value={prescriptionForm.notes}
                      onChange={(e) => handlePrescriptionFieldChange('notes', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Additional advice for the patient"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Follow-up Date</label>
                    <input
                      type="date"
                      value={prescriptionForm.followUpDate}
                      onChange={(e) => handlePrescriptionFieldChange('followUpDate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {prescriptionError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {prescriptionError}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={issuingPrescription}>
                    {issuingPrescription ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Issuing prescription...
                      </span>
                    ) : (
                      'Issue Digital Prescription'
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Appointment History */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Appointment History
            </h3>
            
            {sortedAppointments.length > 0 ? (
              <div className="space-y-3">
                {sortedAppointments.map((apt, index) => (
                  <div 
                    key={apt._id || index}
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(apt.status)}
                          <span className="font-medium text-slate-900">
                            {formatDate(apt.appointmentDate)}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600">{apt.appointmentTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          {apt.type === 'TELEMEDICINE' ? (
                            <><Video size={14} /> Video Call</>
                          ) : (
                            <><MapPin size={14} /> In-Person</>
                          )}
                          <span>•</span>
                          <span>{apt.specialty}</span>
                        </div>
                        {apt.reason && (
                          <p className="text-sm text-slate-600 mt-2">
                            <span className="font-medium">Reason:</span> {apt.reason}
                          </p>
                        )}
                        {apt.notes && (
                          <p className="text-sm text-slate-600 mt-1">
                            <span className="font-medium">Notes:</span> {apt.notes}
                          </p>
                        )}
                        {/* Action buttons for pending appointments */}
                        {apt.status === 'PENDING' && onAcceptAppointment && onRejectAppointment && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50 border-red-200"
                              onClick={() => onRejectAppointment(apt._id)}
                              disabled={actionLoading === apt._id}
                            >
                              {actionLoading === apt._id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <><Ban size={14} className="mr-1" /> Reject</>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => onAcceptAppointment(apt._id)}
                              disabled={actionLoading === apt._id}
                            >
                              {actionLoading === apt._id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <><Check size={14} className="mr-1" /> Accept</>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                      <Badge variant={getStatusBadgeVariant(apt.status)}>
                        {apt.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8 bg-slate-50 rounded-lg">
                No appointment history available
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button className="gap-2">
            <Calendar size={18} />
            Book Appointment
          </Button>
        </div>
      </div>
    </div>
  );
}
