import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Video,
  Activity,
  Clock,
  ClipboardList,
  CreditCard,
  ShieldCheck,
  User,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Sidebar() {
  const { role } = useAuth();

  const patientLinks = [
    { to: '/patient/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patient/doctors', icon: Users, label: 'Find Doctors' },
    { to: '/patient/appointments', icon: Calendar, label: 'Appointments' },
    { to: '/patient/records', icon: FileText, label: 'Medical Records' },
    { to: '/patient/symptom-checker', icon: Activity, label: 'Symptom Checker' },
    { to: '/patient/profile', icon: User, label: 'My Profile' }
  ];

  const doctorLinks = [
    { to: '/doctor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/doctor/availability', icon: Clock, label: 'Availability' },
    { to: '/doctor/consultations', icon: Video, label: 'Consultations' },
    { to: '/doctor/prescriptions', icon: ClipboardList, label: 'Prescriptions' },
    { to: '/doctor/patients', icon: Users, label: 'My Patients' },
    { to: '/doctor/profile', icon: User, label: 'My Profile' }
  ];

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'User Management' },
    { to: '/admin/verify-doctors', icon: ShieldCheck, label: 'Verify Doctors' },
    { to: '/admin/transactions', icon: CreditCard, label: 'Transactions' },
    { to: '/admin/refunds', icon: RotateCcw, label: 'Refunds' }
  ];

  const links =
    role === 'patient'
      ? patientLinks
      : role === 'doctor'
      ? doctorLinks
      : adminLinks;

  return (
    <aside className="w-64 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] hidden md:block">
      <nav className="flex flex-col gap-1 p-4">
        
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <link.icon size={18} />
            {link.label}
          </NavLink>
        ))}

      </nav>
    </aside>
  );
}