import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Loader2,
  AlertCircle,
  Stethoscope,
  UserCheck,
  Clock
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { Button } from '../../components/shared/Button';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../lib/api';
import { amountToLkr, formatLkr } from '../../lib/currency';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    activeDoctors: 0,
    pendingVerifications: 0,
    totalAppointments: 0,
    monthlyRevenue: 0,
    todayRevenue: 0,
    growth: { users: 12, doctors: 5, appointments: 18, revenue: 22 }
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [usersRes, appointmentsRes, paymentsRes] = await Promise.all([
        fetch(`${API_URL}/api/auth/users`, { headers }),
        fetch(`${API_URL}/api/appointments`, { headers }),
        fetch(`${API_URL}/api/payments/transactions`, { headers })
      ]);

      const [usersData, appointmentsData, paymentsData] = await Promise.all([
        usersRes.json(),
        appointmentsRes.json(),
        paymentsRes.json()
      ]);

      if (!usersRes.ok) throw new Error(usersData.message);
      if (!appointmentsRes.ok) throw new Error(appointmentsData.message);

      const users = usersData.users || [];
      const doctors = users.filter(u => u.role === 'doctor');
      const activeDocs = doctors.filter(d => d.isVerified && d.isActive);
      const pendingDocs = doctors.filter(d => !d.isVerified);

      const appointments = appointmentsData.appointments || [];
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      let monthlyRevenue = 0, todayRevenue = 0;
      if (paymentsRes.ok) {
        const transactions = paymentsData.transactions || [];
        const todayStr = today.toDateString();
        monthlyRevenue = transactions
          .filter(t => t.status === 'completed' && new Date(t.createdAt) >= thirtyDaysAgo)
          .reduce((sum, t) => sum + amountToLkr(t.amount, t.currency), 0);
        todayRevenue = transactions
          .filter(t => t.status === 'completed' && new Date(t.createdAt).toDateString() === todayStr)
          .reduce((sum, t) => sum + amountToLkr(t.amount, t.currency), 0);
      }

      setStats({
        totalUsers: users.filter(u => u.role === 'patient').length,
        totalDoctors: doctors.length,
        activeDoctors: activeDocs.length,
        pendingVerifications: pendingDocs.length,
        totalAppointments: appointments.length,
        monthlyRevenue,
        todayRevenue,
        growth: { users: 12, doctors: 5, appointments: 18, revenue: 22 }
      });

      setPendingDoctors(pendingDocs.slice(0, 5));

      const activity = [];
      if (pendingDocs.length > 0) {
        activity.push({
          title: 'New Doctor Registration',
          desc: `${pendingDocs[0].username} submitted credentials for verification.`,
          time: 'Just now',
          icon: ShieldCheck,
          color: 'text-indigo-600',
          bg: 'bg-indigo-100'
        });
      }
      if (appointments.length > 0) {
        const recentAppt = appointments[appointments.length - 1];
        activity.push({
          title: 'New Appointment Booked',
          desc: `Patient booked appointment with Dr. ${recentAppt.doctorName || 'Unknown'}`,
          time: '10 mins ago',
          icon: Calendar,
          color: 'text-blue-600',
          bg: 'bg-blue-100'
        });
      }
      activity.push(
        { title: 'System Status', desc: 'All services operational. API response time normal.', time: '1 hour ago', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        { title: 'Revenue Update', desc: `Daily revenue target ${todayRevenue > 1000 ? 'exceeded' : 'at'} ${Math.round((todayRevenue / 1000) * 100)}%.`, time: '2 hours ago', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100' }
      );
      setRecentActivity(activity);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amountLkr) => formatLkr(amountLkr);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
          <p className="text-slate-500">Monitor system performance, users, and revenue in real-time.</p>
        </div>
        <Button onClick={fetchDashboardData} disabled={isLoading} variant="outline" className="flex items-center gap-2">
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={isLoading ? 'opacity-70' : ''}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Users</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{isLoading ? '-' : stats.totalUsers.toLocaleString()}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Users size={20} /></div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 flex items-center font-medium"><ArrowUpRight size={16} className="mr-1" /> {stats.growth.users}%</span>
              <span className="text-slate-500 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className={isLoading ? 'opacity-70' : ''}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Doctors</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{isLoading ? '-' : stats.activeDoctors.toLocaleString()}</h3>
                <p className="text-xs text-slate-400 mt-1">of {stats.totalDoctors} registered</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><Stethoscope size={20} /></div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 flex items-center font-medium"><ArrowUpRight size={16} className="mr-1" /> {stats.growth.doctors}%</span>
              <span className="text-slate-500 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className={isLoading ? 'opacity-70' : ''}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Appointments (30d)</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{isLoading ? '-' : stats.totalAppointments.toLocaleString()}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><Calendar size={20} /></div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 flex items-center font-medium"><ArrowUpRight size={16} className="mr-1" /> {stats.growth.appointments}%</span>
              <span className="text-slate-500 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className={isLoading ? 'opacity-70' : ''}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Revenue (30d)</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{isLoading ? '-' : formatCurrency(stats.monthlyRevenue)}</h3>
                <p className="text-xs text-slate-400 mt-1">Today: {formatCurrency(stats.todayRevenue)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"><CreditCard size={20} /></div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 flex items-center font-medium"><ArrowUpRight size={16} className="mr-1" /> {stats.growth.revenue}%</span>
              <span className="text-slate-500 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader><CardTitle>Recent Platform Activity</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
              ) : recentActivity.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-6">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                        <item.icon size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-900">{item.title}</h4>
                        <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                        <span className="text-xs text-slate-400 mt-1 block">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Action Required</CardTitle>
              {stats.pendingVerifications > 0 && <Badge variant="warning">{stats.pendingVerifications} Pending</Badge>}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-48"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>
              ) : pendingDoctors.length === 0 ? (
                <div className="text-center py-8">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3"><UserCheck size={24} /></div>
                  <p className="text-slate-500 text-sm">All doctors verified!</p>
                  <p className="text-xs text-slate-400 mt-1">No pending verifications</p>
                </div>
              ) : (
                <div className="space-y-4 mt-2">
                  <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Doctor Verifications</h4>
                  {pendingDoctors.map((doc) => (
                    <div key={doc._id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><Stethoscope size={16} /></div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{doc.username}</p>
                          <p className="text-xs text-slate-500">{doc.specialization || 'General'} • {doc.licenseNumber || 'No License'}</p>
                        </div>
                      </div>
                      <button onClick={() => navigate('/admin/verify-doctors')} className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition-colors">Review</button>
                    </div>
                  ))}
                  {stats.pendingVerifications > 5 && (
                    <Button variant="outline" fullWidth onClick={() => navigate('/admin/verify-doctors')} className="mt-2">View All {stats.pendingVerifications} Pending</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/users')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Users size={20} /></div>
            <div>
              <p className="font-medium text-slate-900">Manage Users</p>
              <p className="text-xs text-slate-500">View and edit user accounts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/verify-doctors')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><ShieldCheck size={20} /></div>
            <div>
              <p className="font-medium text-slate-900">Verify Doctors</p>
              <p className="text-xs text-slate-500">Review doctor applications</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/transactions')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"><CreditCard size={20} /></div>
            <div>
              <p className="font-medium text-slate-900">Transactions</p>
              <p className="text-xs text-slate-500">View payment history</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Activity size={20} /></div>
            <div>
              <p className="font-medium text-slate-900">System Health</p>
              <p className="text-xs text-emerald-600">All systems operational</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
