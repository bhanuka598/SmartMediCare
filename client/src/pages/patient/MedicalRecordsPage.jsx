import React, { useState } from 'react';
import { Upload, FileText, Download, Trash2, Search } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/shared/Card';

const MOCK_RECORDS = [
  {
    id: '1',
    name: 'Complete Blood Count.pdf',
    date: 'Oct 12, 2026',
    type: 'Lab Report',
    size: '2.4 MB',
    doctor: 'Dr. Jenkins'
  },
  {
    id: '2',
    name: 'Prescription_Dermatology.pdf',
    date: 'Sep 28, 2026',
    type: 'Prescription',
    size: '1.1 MB',
    doctor: 'Dr. Chen'
  },
  {
    id: '3',
    name: 'Chest_XRay_Results.jpg',
    date: 'Aug 15, 2026',
    type: 'Imaging',
    size: '5.2 MB',
    doctor: 'Dr. Wilson'
  }
];

export function MedicalRecordsPage() {
  const [isDragging, setIsDragging] = useState(false);

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
    // Handle file drop logic here
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medical Records</h1>
          <p className="text-slate-500">
            Manage your lab reports, prescriptions, and imaging.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Document</CardTitle>
            </CardHeader>

            <CardContent>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
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
                  Click to upload or drag and drop
                </h3>

                <p className="text-xs text-slate-500 mb-4">
                  PDF, JPG, PNG (max. 10MB)
                </p>

                <Button variant="outline" size="sm">
                  Select File
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
              <CardTitle className="text-lg">Your Documents</CardTitle>

              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input placeholder="Search..." className="pl-9 h-8 text-sm" />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {MOCK_RECORDS.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>

                      <div>
                        <p className="font-medium text-slate-900 text-sm">
                          {record.name}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{record.date}</span>
                          <span>•</span>
                          <span>{record.type}</span>
                          <span>•</span>
                          <span>{record.size}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"
                      >
                        <Download size={16} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}