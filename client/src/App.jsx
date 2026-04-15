import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Patient Pages
import { PatientDashboardPage } from './pages/patient/DashboardPage';
import { DoctorsPage } from './pages/patient/DoctorsPage';
import { AppointmentsPage } from './pages/patient/AppointmentsPage';
import { MedicalRecordsPage } from './pages/patient/MedicalRecordsPage';
import { SymptomCheckerPage } from './pages/patient/SymptomCheckerPage';
import { PatientProfilePage } from './pages/patient/PatientProfilePage';

// Doctor Pages
import { DoctorDashboardPage } from './pages/doctor/DashboardPage';
import { DoctorAvailabilityPage } from './pages/doctor/AvailabilityPage';
import { DoctorProfilePage } from './pages/doctor/ProfilePage';
import { PatientsPage } from './pages/doctor/PatientsPage';
import { ConsultationsPage } from './pages/doctor/ConsultationsPage';
import { DoctorPrescriptionsPage } from './pages/doctor/PrescriptionsPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/DashboardPage';
import { UsersPage } from './pages/admin/UsersPage';
import { VerifyDoctorsPage } from './pages/admin/VerifyDoctorsPage';
import { TransactionsPage } from './pages/admin/TransactionsPage';

// Placeholder Component
const PlaceholderPage = ({ title }) => (
  <div className="flex h-[60vh] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
    <div className="text-center">
      <h2 className="text-xl font-semibold text-slate-700">{title}</h2>
      <p className="text-slate-500 mt-2">
        This page is under construction.
      </p>
    </div>
  </div>
);

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Patient Routes */}
          <Route element={<DashboardLayout allowedRoles={['patient']} />}>
            <Route
              path="/patient/dashboard"
              element={<PatientDashboardPage />}
            />
            <Route path="/patient/doctors" element={<DoctorsPage />} />
            <Route
              path="/patient/appointments"
              element={<AppointmentsPage />}
            />
            <Route
              path="/patient/records"
              element={<MedicalRecordsPage />}
            />
            <Route
              path="/patient/symptom-checker"
              element={<SymptomCheckerPage />}
            />
            <Route
              path="/patient/profile"
              element={<PatientProfilePage />}
            />
          </Route>

          {/* Doctor Routes */}
          <Route element={<DashboardLayout allowedRoles={['doctor']} />}>
            <Route
              path="/doctor/dashboard"
              element={<DoctorDashboardPage />}
            />
            <Route
              path="/doctor/availability"
              element={<DoctorAvailabilityPage />}
            />
            <Route
              path="/doctor/profile"
              element={<DoctorProfilePage />}
            />
            <Route
              path="/doctor/consultations"
              element={<ConsultationsPage />}
            />
            <Route
              path="/doctor/prescriptions"
              element={<DoctorPrescriptionsPage />}
            />
            <Route
              path="/doctor/patients"
              element={<PatientsPage />}
            />
          </Route>

          {/* Admin Routes */}
          <Route element={<DashboardLayout allowedRoles={['admin']} />}>
            <Route
              path="/admin/dashboard"
              element={<AdminDashboardPage />}
            />
            <Route
              path="/admin/users"
              element={<UsersPage />}
            />
            <Route
              path="/admin/verify-doctors"
              element={<VerifyDoctorsPage />}
            />
            <Route
              path="/admin/transactions"
              element={<TransactionsPage />}
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
