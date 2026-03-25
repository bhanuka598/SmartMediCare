import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Video,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle
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

export function DoctorDashboardPage() {
  const { user } = useAuth();

  const todayAppointments = [
    {
      id: '1',
      patientName: 'John Doe',
      time: '09:00 AM',
      type: 'video',
      status: 'upcoming'
    },
    {
      id: '2',
      patientName: 'Alice Smith',
      time: '10:30 AM',
      type: 'in-person',
      status: 'completed'
    },
    {
      id: '3',
      patientName: 'Robert Johnson',
      time: '14:00 PM',
      type: 'video',
      status: 'upcoming'
    }
  ];

  const pendingRequests = [
    {
      id: '101',
      patientName: 'Emma Davis',
      date: 'Tomorrow',
      time: '11:00 AM',
      reason: 'Routine Checkup'
    },
    {
      id: '102',
      patientName: 'Michael Brown',
      date: 'Oct 26',
      time: '09:30 AM',
      reason: 'Follow-up'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good morning, Dr. {user?.name?.split(' ')[1] || 'Doctor'}
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

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Today's Appts
              </p>
              <h3 className="text-2xl font-bold text-slate-900">8</h3>
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
              <h3 className="text-2xl font-bold text-slate-900">5</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Patients
              </p>
              <h3 className="text-2xl font-bold text-slate-900">1.2k</h3>
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
              <h3 className="text-2xl font-bold text-slate-900">45%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Today's Schedule */}
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
              <div className="space-y-4">
                {todayAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center h-12 w-16 bg-white rounded border border-slate-200 shrink-0">
                        <span className="text-xs text-slate-500 font-medium">
                          TIME
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {appt.time.split(' ')[0]}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900">
                          {appt.patientName}
                        </h4>

                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              appt.status === 'completed' ? 'success' : 'info'
                            }
                            className="text-[10px] px-1.5 py-0"
                          >
                            {appt.status}
                          </Badge>

                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            {appt.type === 'video' ? (
                              <Video size={12} />
                            ) : (
                              <Users size={12} />
                            )}
                            {appt.type === 'video' ? 'Video Call' : 'In-person'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {appt.status === 'upcoming' ? (
                        <Button size="sm" className="gap-2">
                          {appt.type === 'video' ? 'Join Call' : 'Start Visit'}
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          View Notes
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Pending Requests
                <Badge variant="warning" className="ml-auto">
                  5 New
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-lg border border-slate-100 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-slate-900">
                      {req.patientName}
                    </h4>
                    <span className="text-xs text-slate-500">
                      {req.date} • {req.time}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 mb-3 line-clamp-1">
                    {req.reason}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <XCircle size={16} className="mr-1" /> Decline
                    </Button>

                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 size={16} className="mr-1" /> Accept
                    </Button>
                  </div>
                </div>
              ))}

              <Button variant="ghost" fullWidth className="text-blue-600 mt-2">
                View all requests
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}