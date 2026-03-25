import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Calendar,
  Video,
  FileText,
  Shield,
  CreditCard,
  Clock,
  Users,
  Bell,
  Search,
  Stethoscope,
  TrendingUp,
  Lock,
  Zap,
  Heart,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/shared/Button';
import { Card, CardContent } from '../components/shared/Card';

export function FeaturesPage() {
  const patientFeatures = [
    {
      icon: Search,
      title: 'Find Specialists',
      description:
        'Browse verified doctors by specialty, location, and availability.',
      color: 'blue',
    },
    {
      icon: Calendar,
      title: 'Instant Booking',
      description:
        'Book appointments 24/7 with real-time availability.',
      color: 'green',
    },
    {
      icon: Video,
      title: 'Video Consultations',
      description:
        'Consult with doctors from anywhere via secure video calls.',
      color: 'purple',
    },
    {
      icon: Activity,
      title: 'AI Symptom Checker',
      description:
        'Get health insights and specialist recommendations.',
      color: 'amber',
    },
    {
      icon: FileText,
      title: 'Medical Records',
      description:
        'Store and access all your medical documents securely.',
      color: 'indigo',
    },
    {
      icon: Bell,
      title: 'Smart Reminders',
      description:
        'Get alerts for appointments and medications.',
      color: 'red',
    },
  ];

  const doctorFeatures = [
    {
      icon: Users,
      title: 'Patient Management',
      description:
        'Manage patient records and consultation notes easily.',
      color: 'blue',
    },
    {
      icon: Clock,
      title: 'Flexible Scheduling',
      description:
        'Set availability and manage appointments efficiently.',
      color: 'green',
    },
    {
      icon: Video,
      title: 'Telemedicine Platform',
      description:
        'Conduct secure video consultations with ease.',
      color: 'purple',
    },
    {
      icon: Stethoscope,
      title: 'Digital Prescriptions',
      description:
        'Create and manage prescriptions digitally.',
      color: 'amber',
    },
    {
      icon: TrendingUp,
      title: 'Analytics Dashboard',
      description:
        'Track patient and revenue insights.',
      color: 'indigo',
    },
    {
      icon: CreditCard,
      title: 'Automated Payments',
      description:
        'Receive payments with integrated billing.',
      color: 'green',
    },
  ];

  const platformFeatures = [
    {
      icon: Shield,
      title: 'HIPAA Compliant',
      description: 'Secure and encrypted healthcare data.',
    },
    {
      icon: Lock,
      title: 'Secure Payments',
      description: 'Safe and reliable payment systems.',
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Instant notifications and updates.',
    },
    {
      icon: Heart,
      title: '24/7 Support',
      description: 'Always available customer support.',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-blue-50 text-center py-20">
        <h1 className="text-4xl font-bold text-slate-900">
          Modern Healthcare Features
        </h1>
        <p className="text-slate-600 mt-4 max-w-xl mx-auto">
          Everything you need to manage healthcare efficiently.
        </p>

        <div className="mt-6">
          <Link to="/register">
            <Button className="gap-2">
              Get Started <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Patient Features */}
      <section className="py-16">
        <h2 className="text-2xl font-bold text-center mb-10">
          For Patients
        </h2>

        <div className="grid md:grid-cols-3 gap-6 px-4 max-w-6xl mx-auto">
          {patientFeatures.map((f, i) => (
            <Card key={i}>
              <CardContent className="p-6 text-center">
                <div
                  className={`mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-full ${colorClasses[f.color]}`}
                >
                  <f.icon size={24} />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-sm text-slate-600 mt-2">
                  {f.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Doctor Features */}
      <section className="py-16 bg-slate-50">
        <h2 className="text-2xl font-bold text-center mb-10">
          For Doctors
        </h2>

        <div className="grid md:grid-cols-3 gap-6 px-4 max-w-6xl mx-auto">
          {doctorFeatures.map((f, i) => (
            <Card key={i}>
              <CardContent className="p-6 text-center">
                <div
                  className={`mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-full ${colorClasses[f.color]}`}
                >
                  <f.icon size={24} />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-sm text-slate-600 mt-2">
                  {f.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Platform */}
      <section className="py-16">
        <h2 className="text-2xl font-bold text-center mb-10">
          Platform Benefits
        </h2>

        <div className="grid md:grid-cols-4 gap-6 px-4 max-w-6xl mx-auto">
          {platformFeatures.map((f, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto mb-4 h-14 w-14 flex items-center justify-center rounded-full bg-blue-600 text-white">
                <f.icon size={24} />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-slate-600 mt-2">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}