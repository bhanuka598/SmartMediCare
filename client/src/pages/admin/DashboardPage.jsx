import React from 'react';
import {
  Users,
  Calendar,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';

export function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-slate-500">
          Monitor system performance, users, and revenue.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Users
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  12,450
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Users size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 flex items-center font-medium">
                <ArrowUpRight size={16} className="mr-1" /> 12%
              </span>
              <span className="text-slate-500 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active Doctors
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">842</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 flex items-center font-medium">
                <ArrowUpRight size={16} className="mr-1" /> 5%
              </span>
              <span className="text-slate-500 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Appointments (30d)
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  4,210
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <Calendar size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 flex items-center font-medium">
                <ArrowUpRight size={16} className="mr-1" /> 18%
              </span>
              <span className="text-slate-500 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Revenue (30d)
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  Rs. 8.5M
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <CreditCard size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 flex items-center font-medium">
                <ArrowUpRight size={16} className="mr-1" /> 22%
              </span>
              <span className="text-slate-500 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Platform Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  {
                    title: 'New Doctor Registration',
                    desc: 'Dr. Emily Chen submitted credentials for verification.',
                    time: '10 mins ago',
                    icon: ShieldCheck,
                    color: 'text-indigo-600',
                    bg: 'bg-indigo-100'
                  },
                  {
                    title: 'High Traffic Alert',
                    desc: 'Concurrent video consultations exceeded 150.',
                    time: '1 hour ago',
                    icon: Activity,
                    color: 'text-amber-600',
                    bg: 'bg-amber-100'
                  },
                  {
                    title: 'System Update',
                    desc: 'Payment gateway integration successfully updated.',
                    time: '3 hours ago',
                    icon: TrendingUp,
                    color: 'text-green-600',
                    bg: 'bg-green-100'
                  },
                  {
                    title: 'New User Milestone',
                    desc: 'Platform reached 12,000 registered patients.',
                    time: '1 day ago',
                    icon: Users,
                    color: 'text-blue-600',
                    bg: 'bg-blue-100'
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div
                      className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}
                    >
                      <item.icon size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-900">
                        {item.title}
                      </h4>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {item.desc}
                      </p>
                      <span className="text-xs text-slate-400 mt-1 block">
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Verifications */}
        <div>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Action Required</CardTitle>
              <Badge variant="warning">3 Pending</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-2">
                <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Doctor Verifications
                </h4>

                {[
                  {
                    name: 'Dr. Alan Walker',
                    spec: 'Orthopedics',
                    id: 'MD-8472'
                  },
                  {
                    name: 'Dr. Sarah Connor',
                    spec: 'Neurology',
                    id: 'MD-9123'
                  },
                  {
                    name: 'Dr. James Smith',
                    spec: 'Cardiology',
                    id: 'MD-4451'
                  }
                ].map((doc, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-sm text-slate-900">
                        {doc.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {doc.spec} • {doc.id}
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Review
                    </button>
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