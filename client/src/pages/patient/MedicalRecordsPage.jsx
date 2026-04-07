import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Download, Trash2, Search, Pill, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/shared/Card';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Helper to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};


export function MedicalRecordsPage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('reports');
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [reports, setReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'other',
    description: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/patient/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch reports');
      
      const data = await response.json();
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch prescriptions
  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/patient/prescriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch prescriptions');
      
      const data = await response.json();
      if (data.success) {
        setPrescriptions(data.prescriptions || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load data on mount
  useEffect(() => {
    if (token) {
      if (activeTab === 'reports') {
        fetchReports();
      } else {
        fetchPrescriptions();
      }
    }
  }, [token, activeTab, fetchReports, fetchPrescriptions]);

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    
    try {
      // Create file URL (in production, upload to cloud storage first)
      const fileUrl = URL.createObjectURL(file);
      
      const reportData = {
        title: uploadForm.title || file.name,
        fileName: file.name,
        fileUrl: fileUrl,
        fileType: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'document',
        fileSize: file.size,
        category: uploadForm.category,
        description: uploadForm.description
      };

      const response = await fetch(`${API_URL}/api/patient/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reportData)
      });

      if (!response.ok) throw new Error('Failed to upload report');

      const data = await response.json();
      if (data.success) {
        setReports(prev => [data.report, ...prev]);
        setUploadForm({ title: '', category: 'other', description: '' });
        setSelectedFile(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle delete report
  const handleDeleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/patient/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete report');

      const data = await response.json();
      if (data.success) {
        setReports(prev => prev.filter(r => r._id !== reportId));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadForm(prev => ({ ...prev, title: file.name }));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadForm(prev => ({ ...prev, title: file.name }));
    }
  };

  // Filter reports
  const filteredReports = reports.filter(report =>
    report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter(prescription =>
    prescription.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prescription.doctorName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get category badge color
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

  // Get prescription status color
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medical Records</h1>
          <p className="text-slate-500">
            Manage your lab reports, prescriptions, and medical documents.
          </p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'reports'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="inline h-4 w-4 mr-1" />
            Reports
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'prescriptions'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="inline h-4 w-4 mr-1" />
            Prescriptions
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-sm underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Upload Section - Only shown for Reports tab */}
        {activeTab === 'reports' && (
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upload Document</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* File Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="mx-auto h-12 w-12 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>

                  <h3 className="text-sm font-medium text-slate-900 mb-1">
                    {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                  </h3>

                  <p className="text-xs text-slate-500 mb-4">
                    PDF, JPG, PNG (max. 10MB)
                  </p>

                  <label className="cursor-pointer inline-block">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleFileSelect}
                      id="file-input"
                    />
                    <span className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm">
                      Select File
                    </span>
                  </label>
                </div>

                {/* Upload Form */}
                {selectedFile && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Title</label>
                      <Input
                        value={uploadForm.title}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Document title"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-700">Category</label>
                      <select
                        value={uploadForm.category}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="lab">Lab Report</option>
                        <option value="xray">X-Ray</option>
                        <option value="mri">MRI</option>
                        <option value="ct">CT Scan</option>
                        <option value="prescription">Prescription</option>
                        <option value="discharge">Discharge Summary</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-700">Description</label>
                      <textarea
                        value={uploadForm.description}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description"
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                      />
                    </div>

                    <Button
                      onClick={() => handleFileUpload(selectedFile)}
                      disabled={uploading || !uploadForm.title}
                      className="w-full"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Document
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Documents/Prescriptions List */}
        <div className={activeTab === 'reports' ? 'md:col-span-2' : 'md:col-span-3'}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
              <CardTitle className="text-lg">
                {activeTab === 'reports' ? 'Your Documents' : 'Your Prescriptions'}
              </CardTitle>

              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input 
                  placeholder="Search..." 
                  className="pl-9 h-8 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : activeTab === 'reports' ? (
                // Reports List
                <div className="divide-y divide-slate-100">
                  {filteredReports.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                      <p>No reports found</p>
                      <p className="text-sm">Upload your first medical document above</p>
                    </div>
                  ) : (
                    filteredReports.map((report) => (
                      <div
                        key={report._id}
                        className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <FileText size={20} />
                          </div>

                          <div>
                            <p className="font-medium text-slate-900 text-sm">
                              {report.title}
                            </p>

                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span>{formatDate(report.uploadedAt)}</span>
                              <span>•</span>
                              <span className={`px-2 py-0.5 rounded-full ${getCategoryColor(report.category)}`}>
                                {report.category}
                              </span>
                              <span>•</span>
                              <span>{formatFileSize(report.fileSize)}</span>
                            </div>
                            {report.description && (
                              <p className="text-xs text-slate-400 mt-1">{report.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={report.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Download size={16} />
                          </a>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteReport(report._id)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                // Prescriptions List
                <div className="divide-y divide-slate-100">
                  {filteredPrescriptions.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Pill className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                      <p>No prescriptions found</p>
                      <p className="text-sm">Your prescriptions will appear here after appointments</p>
                    </div>
                  ) : (
                    filteredPrescriptions.map((prescription) => (
                      <div
                        key={prescription._id || prescription.prescriptionId}
                        className="p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-slate-900">
                              {prescription.diagnosis}
                            </p>
                            <p className="text-sm text-slate-500">
                              Dr. {prescription.doctorName}
                              {prescription.doctorSpecialization && (
                                <span className="text-slate-400"> • {prescription.doctorSpecialization}</span>
                              )}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                            {prescription.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mb-3">
                          {formatDate(prescription.createdAt)}
                        </p>

                        {/* Medications */}
                        {prescription.medications && prescription.medications.length > 0 && (
                          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                            <p className="text-xs font-medium text-slate-700 uppercase tracking-wide">
                              Medications
                            </p>
                            {prescription.medications.map((med, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium text-slate-900">{med.name}</span>
                                <span className="text-slate-500"> • {med.dosage}</span>
                                {med.frequency && (
                                  <span className="text-slate-400"> • {med.frequency}</span>
                                )}
                                {med.instructions && (
                                  <p className="text-xs text-slate-400 mt-0.5">{med.instructions}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {prescription.notes && (
                          <p className="text-sm text-slate-600 mt-2">
                            <span className="font-medium">Notes:</span> {prescription.notes}
                          </p>
                        )}

                        {prescription.followUpDate && (
                          <p className="text-sm text-slate-600 mt-2">
                            <span className="font-medium">Follow-up:</span> {formatDate(prescription.followUpDate)}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}