import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  UserCheck,
  UserX,
  FileText,
  X,
  Stethoscope,
  Award
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { Button } from '../../components/shared/Button';

const API_URL = 'http://localhost:5000';

export function VerifyDoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingDoctor, setViewingDoctor] = useState(null);

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  const fetchPendingDoctors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      // Fetch doctors with pending verification status
      const response = await fetch(`${API_URL}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch doctors');
      }

      // Filter only doctors that are not verified
      const pendingDoctors = (data.users || []).filter(
        user => user.role === 'doctor' && !user.isVerified
      );
      setDoctors(pendingDoctors);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (doctorId) => {
    setActionLoading(doctorId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/users/${doctorId}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isVerified: true })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify doctor');
      }

      // Remove verified doctor from list
      setDoctors(prev => prev.filter(d => d._id !== doctorId));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (doctorId) => {
    if (!window.confirm('Are you sure you want to reject this doctor?')) return;
    
    setActionLoading(doctorId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/users/${doctorId}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isVerified: false, isActive: false })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reject doctor');
      }

      // Remove rejected doctor from list
      setDoctors(prev => prev.filter(d => d._id !== doctorId));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewClick = (doctor) => {
    setViewingDoctor(doctor);
    setIsViewModalOpen(true);
  };

  const filteredDoctors = doctors.filter((d) => {
    const search = searchTerm.toLowerCase();
    return (
      (d.username && d.username.toLowerCase().includes(search)) ||
      (d.email && d.email.toLowerCase().includes(search)) ||
      (d.specialization && d.specialization.toLowerCase().includes(search))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Verify Doctors</h1>
          <p className="text-slate-500">
            Review and verify doctor registration requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={fetchPendingDoctors} disabled={isLoading} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Pending Verification</p>
              <h3 className="text-2xl font-bold text-slate-900">{doctors.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Verified Today</p>
              <h3 className="text-2xl font-bold text-slate-900">-</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Average Response Time</p>
              <h3 className="text-2xl font-bold text-slate-900">-</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Award size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-2">
          <CardTitle>Pending Doctor Verifications</CardTitle>
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search doctors..."
              className="pl-10 w-full block rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <div className="p-6 text-red-600 bg-red-50 text-sm">
              <p>Error: {error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="p-12 flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900">Doctor</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900">Specialization</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900">License Number</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900">Registration Date</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredDoctors.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                        {searchTerm ? "No doctors matching your search." : "No pending doctor verifications."}
                      </td>
                    </tr>
                  ) : (
                    filteredDoctors.map((doctor) => (
                      <tr key={doctor._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase overflow-hidden">
                              <Stethoscope size={20} />
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-slate-900">{doctor.username}</div>
                              <div className="text-sm text-slate-500">{doctor.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="default" className="bg-indigo-100 text-indigo-700">
                            {doctor.specialization || 'General'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {doctor.licenseNumber || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleViewClick(doctor)}
                              className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-blue-50"
                              title="View Details"
                            >
                              <FileText size={18} />
                            </button>
                            <button
                              onClick={() => handleVerify(doctor._id)}
                              disabled={actionLoading === doctor._id}
                              className="text-slate-400 hover:text-emerald-600 transition-colors p-2 rounded-md hover:bg-emerald-50"
                              title="Verify Doctor"
                            >
                              {actionLoading === doctor._id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <UserCheck size={18} />
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(doctor._id)}
                              disabled={actionLoading === doctor._id}
                              className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-md hover:bg-red-50"
                              title="Reject Doctor"
                            >
                              <UserX size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Doctor Modal */}
      {isViewModalOpen && viewingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-xl border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
              <CardTitle>Doctor Details</CardTitle>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500">Full Name</label>
                    <p className="text-slate-900 font-medium">{viewingDoctor.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500">Email</label>
                    <p className="text-slate-900">{viewingDoctor.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500">Specialization</label>
                    <p className="text-slate-900">{viewingDoctor.specialization || 'General'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500">License Number</label>
                    <p className="text-slate-900">{viewingDoctor.licenseNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500">Experience</label>
                    <p className="text-slate-900">{viewingDoctor.experience ? `${viewingDoctor.experience} years` : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500">Registration Date</label>
                    <p className="text-slate-900">
                      {viewingDoctor.createdAt ? new Date(viewingDoctor.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {viewingDoctor.bio && (
                  <div>
                    <label className="block text-sm font-medium text-slate-500">Bio</label>
                    <p className="text-slate-900 text-sm mt-1">{viewingDoctor.bio}</p>
                  </div>
                )}

                {viewingDoctor.documents && viewingDoctor.documents.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-500">Documents</label>
                    <div className="mt-2 space-y-2">
                      {viewingDoctor.documents.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <FileText size={16} />
                          Document {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 mt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => setIsViewModalOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    fullWidth
                    onClick={() => {
                      handleVerify(viewingDoctor._id);
                      setIsViewModalOpen(false);
                    }}
                    disabled={actionLoading === viewingDoctor._id}
                  >
                    {actionLoading === viewingDoctor._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Verify
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
