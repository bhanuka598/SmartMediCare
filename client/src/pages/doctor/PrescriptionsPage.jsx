import React, { useEffect, useState } from 'react';
import { ClipboardList, Loader2, AlertCircle, Pill, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/shared/Card';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export function DoctorPrescriptionsPage() {
  const { token } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/api/doctors/prescriptions`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to fetch prescriptions');
        }

        setPrescriptions(result.data || []);
      } catch (err) {
        console.error('Error fetching doctor prescriptions:', err);
        setError(err.message || 'Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchPrescriptions();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3 text-red-700">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Issued Prescriptions</h1>
        <p className="text-slate-500">Review every digital prescription you have created for your patients.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList size={20} />
            Prescription History
          </CardTitle>
          <span className="text-sm text-slate-500">{prescriptions.length} total</span>
        </CardHeader>

        <CardContent className="space-y-4">
          {prescriptions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Pill className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No prescriptions issued yet.</p>
              <p className="text-sm">Issue a prescription from the patient details screen.</p>
            </div>
          ) : (
            prescriptions.map((prescription) => (
              <div key={prescription.prescriptionId || prescription._id} className="rounded-xl border border-slate-200 p-5 bg-slate-50">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold text-slate-900">{prescription.diagnosis}</p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <User size={14} />
                          {prescription.patientName || 'Unknown Patient'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(prescription.createdAt)}
                        </span>
                      </div>
                    </div>

                    {prescription.medications?.length > 0 && (
                      <div className="space-y-2">
                        {prescription.medications.map((medication, index) => (
                          <div key={`${prescription.prescriptionId}-${index}`} className="text-sm text-slate-600">
                            <span className="font-medium text-slate-900">{medication.name}</span>
                            {medication.dosage ? ` • ${medication.dosage}` : ''}
                            {medication.frequency ? ` • ${medication.frequency}` : ''}
                            {medication.duration ? ` • ${medication.duration}` : ''}
                            {medication.instructions ? (
                              <div className="text-xs text-slate-400 mt-1">{medication.instructions}</div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}

                    {prescription.notes && (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Notes:</span> {prescription.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {prescription.status || 'active'}
                    </span>
                    <span className="text-xs text-slate-400">{prescription.prescriptionId}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
