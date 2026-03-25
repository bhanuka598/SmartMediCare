import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Search,
  Calendar,
  Video,
  FileText,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  Clock,
  Users,
  Stethoscope,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/shared/Button';

export function HowItWorksPage() {
  const [activeRole, setActiveRole] = useState('patient');

  const patientSteps = [
    {
      number: 1,
      icon: UserPlus,
      title: 'Create Your Account',
      description:
        'Sign up in under 2 minutes with your email. Add your basic health information and preferences.',
      details: [
        'Free registration',
        'Secure profile setup',
        'Add medical history',
      ],
    },
    {
      number: 2,
      icon: Search,
      title: 'Find the Right Doctor',
      description:
        'Browse specialists by category, location, and availability. Read reviews and compare profiles.',
      details: [
        'Filter by specialty',
        'Check real-time availability',
        'Read verified reviews',
      ],
    },
    {
      number: 3,
      icon: Calendar,
      title: 'Book Your Appointment',
      description:
        'Select a convenient time slot and book instantly. Choose between video consultation or in-person visit.',
      details: [
        'Instant confirmation',
        'Flexible scheduling',
        'Easy rescheduling',
      ],
    },
    {
      number: 4,
      icon: Video,
      title: 'Attend Consultation',
      description:
        'Join your video call at the scheduled time. Discuss your health concerns and receive professional advice.',
      details: ['HD video quality', 'Secure & private', 'Chat & file sharing'],
    },
    {
      number: 5,
      icon: FileText,
      title: 'Get Your Prescription',
      description:
        'Receive digital prescriptions and medical notes instantly. Access them anytime from your records.',
      details: ['Digital prescriptions', 'Medical notes', 'Lab report uploads'],
    },
  ];

  const doctorSteps = [
    {
      number: 1,
      icon: UserPlus,
      title: 'Register & Get Verified',
      description:
        'Create your professional profile with credentials. Our team verifies your license within 24-48 hours.',
      details: [
        'Submit credentials',
        'Quick verification',
        'Profile optimization',
      ],
    },
    {
      number: 2,
      icon: Clock,
      title: 'Set Your Availability',
      description:
        'Configure your working hours and consultation slots. Set recurring schedules or one-time availability.',
      details: [
        'Flexible scheduling',
        'Recurring patterns',
        'Time-off management',
      ],
    },
    {
      number: 3,
      icon: Users,
      title: 'Receive Appointment Requests',
      description:
        'Get notified when patients book appointments. Accept or decline based on your schedule.',
      details: [
        'Real-time notifications',
        'Patient information preview',
        'Easy acceptance workflow',
      ],
    },
    {
      number: 4,
      icon: Stethoscope,
      title: 'Conduct Consultations',
      description:
        'Meet patients via secure video calls. Access their medical history and previous consultation notes.',
      details: [
        'Integrated video platform',
        'Patient records access',
        'Note-taking tools',
      ],
    },
    {
      number: 5,
      icon: CreditCard,
      title: 'Get Paid Automatically',
      description:
        'Receive payments directly to your account after each consultation. Track earnings with detailed reports.',
      details: [
        'Automated payments',
        'Revenue analytics',
        'Transaction history',
      ],
    },
  ];

  const steps = activeRole === 'patient' ? patientSteps : doctorSteps;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-white px-4 py-1.5 text-sm font-medium text-blue-600 mb-6 shadow-sm">
            <CheckCircle2 size={16} className="mr-2" />
            Simple & Straightforward
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            How <span className="text-blue-600">SmartMediCare</span> Works
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 leading-relaxed">
            Get started in minutes. Whether you're a patient seeking care or a
            doctor expanding your practice, we've made it incredibly simple.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setActiveRole('patient')}
                className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeRole === 'patient'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                I'm a Patient
              </button>

              <button
                onClick={() => setActiveRole('doctor')}
                className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeRole === 'doctor'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                I'm a Doctor
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-16">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  {index < steps.length - 1 && (
                    <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-transparent hidden md:block"></div>
                  )}

                  <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div
                          className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg ${
                            activeRole === 'patient'
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                              : 'bg-gradient-to-br from-green-500 to-green-600'
                          } text-white`}
                        >
                          <step.icon size={28} />
                        </div>

                        <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-sm font-bold text-slate-700">
                          {step.number}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">
                        {step.title}
                      </h3>

                      <p className="text-lg text-slate-600 mb-4 leading-relaxed">
                        {step.description}
                      </p>

                      <ul className="space-y-2">
                        {step.details.map((detail, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-slate-700"
                          >
                            <ChevronRight
                              size={16}
                              className={
                                activeRole === 'patient'
                                  ? 'text-blue-500'
                                  : 'text-green-500'
                              }
                            />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Quick answers to common questions about using HealthSync.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'Is SmartMediCare free to use?',
                a: 'Registration is completely free for both patients and doctors. Patients pay consultation fees directly to doctors, and we charge a small platform fee.',
              },
              {
                q: 'How secure is my medical data?',
                a: 'We use bank-level encryption and are fully HIPAA compliant. Your data is stored securely and never shared without your explicit consent.',
              },
              {
                q: 'Can I get a prescription through video consultation?',
                a: 'Yes! Doctors can issue digital prescriptions during video consultations, which you can download or share with pharmacies.',
              },
              {
                q: 'What if I need to cancel or reschedule?',
                a: 'You can cancel or reschedule appointments up to 2 hours before the scheduled time through your dashboard.',
              },
              {
                q: 'Do I need special equipment for video calls?',
                a: 'No special equipment needed. Just a smartphone, tablet, or computer with a camera and internet connection.',
              },
            ].map((faq, index) => (
              <details
                key={index}
                className="group bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <h3 className="text-lg font-semibold text-slate-900 pr-4">
                    {faq.q}
                  </h3>
                  <ChevronRight
                    className="text-slate-400 group-open:rotate-90 transition-transform"
                    size={20}
                  />
                </summary>
                <p className="mt-4 text-slate-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-10">
            Join SmartMediCare today and experience healthcare the way it should
            be—simple, accessible, and patient-centered.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-blue-50 gap-2"
              >
                Create Free Account <ArrowRight size={18} />
              </Button>
            </Link>

            <Link to="/features">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 py-12 text-slate-400">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6 text-white">
            <Activity size={24} />
            <span className="text-2xl font-bold tracking-tight">
              SmartMediCare
            </span>
          </div>

          <p className="mb-6">
            © 2026 SmartMediCare Platform. All rights reserved.
          </p>

          <div className="flex justify-center gap-6">
            <Link to="/features" className="hover:text-white transition-colors">
              Features
            </Link>
            <Link
              to="/how-it-works"
              className="hover:text-white transition-colors"
            >
              How It Works
            </Link>
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}