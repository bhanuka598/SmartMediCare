import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { AppointmentCard } from '../../components/appointments/AppointmentCard';

const MOCK_APPOINTMENTS = [
  {
    id: '1',
    doctorName: 'Dr. Sarah Jenkins',
    specialty: 'Cardiologist',
    date: 'Oct 24, 2026',
    time: '14:30 PM',
    status: 'upcoming',
    type: 'video',
    doctorImage:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150'
  },
  {
    id: '2',
    doctorName: 'Dr. Michael Chen',
    specialty: 'Dermatologist',
    date: 'Oct 28, 2026',
    time: '09:00 AM',
    status: 'upcoming',
    type: 'in-person',
    doctorImage:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150&h=150'
  },
  {
    id: '3',
    doctorName: 'Dr. Emily Rodriguez',
    specialty: 'Pediatrician',
    date: 'Sep 15, 2026',
    time: '11:00 AM',
    status: 'completed',
    type: 'video',
    doctorImage:
      'https://images.unsplash.com/photo-1594824432258-f9a12b1cc169?auto=format&fit=crop&q=80&w=150&h=150'
  },
  {
    id: '4',
    doctorName: 'Dr. James Wilson',
    specialty: 'Neurologist',
    date: 'Aug 02, 2026',
    time: '15:45 PM',
    status: 'cancelled',
    type: 'in-person',
    doctorImage:
      'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150&h=150'
  }
];

export function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');

  const filteredAppointments = MOCK_APPOINTMENTS.filter((app) => {
    if (activeTab === 'upcoming') return app.status === 'upcoming';
    return app.status === 'completed' || app.status === 'cancelled';
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
        <p className="text-slate-500">
          Manage your upcoming and past consultations.
        </p>
      </div>

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
              onJoin={(id) => console.log('Join', id)}
              onCancel={(id) => console.log('Cancel', id)}
              onViewNotes={(id) => console.log('View notes', id)}
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
    </div>
  );
}