import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Calendar,
  FileText,
  Search,
  ArrowRight
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

export function PatientDashboardPage() {
  const { user } = useAuth();

  const upcomingAppointment = {
    id: '1',
    doctorName: 'Dr. Sarah Jenkins',
    specialty: 'Cardiologist',
    date: 'Today, Oct 24',
    time: '14:30 PM',
    status: 'upcoming',
    type: 'video',
    doctorImage:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.name?.split(' ')[0]}
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
              <AppointmentCard
                appointment={upcomingAppointment}
                onJoin={() => console.log('Joining call')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Health Records</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                        <FileText size={20} />
                      </div>

                      <div>
                        <p className="font-medium text-slate-900">
                          Blood Test Results
                        </p>
                        <p className="text-sm text-slate-500">
                          Added Oct 12, 2026 • Dr. Jenkins
                        </p>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
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
              <p className="text-blue-100 text-sm mb-6">
                Use our AI symptom checker to get preliminary insights and find
                the right specialist.
              </p>

              <Link to="/patient/symptom-checker">
                <Button
                  variant="secondary"
                  fullWidth
                  className="bg-white text-blue-600 hover:bg-blue-50"
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
                <span className="font-medium text-slate-900">O+</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Height</span>
                <span className="font-medium text-slate-900">175 cm</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Weight</span>
                <span className="font-medium text-slate-900">72 kg</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600">Allergies</span>
                <span className="font-medium text-slate-900">Penicillin</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}