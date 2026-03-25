import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Calendar,
  Video,
  ArrowRight,
  Star
} from 'lucide-react';
import { Button } from '../components/shared/Button';
import { Navbar } from '../components/layout/Navbar';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-50 pt-16 md:pt-24 pb-32">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-600 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2"></span>
            AI-Powered Healthcare Platform
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
            Your Health, <span className="text-blue-600">Connected</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 leading-relaxed">
            Book appointments, consult with top doctors via video, manage your
            medical records, and get AI-powered health insights—all in one
            secure platform.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Get Started as Patient <ArrowRight size={18} />
              </Button>
            </Link>

            <Link to="/register?role=doctor">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Join as a Doctor
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4 border-t border-slate-200 pt-10 max-w-4xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-slate-900">500+</div>
              <div className="mt-1 text-sm text-slate-500">
                Verified Doctors
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold text-slate-900">50k+</div>
              <div className="mt-1 text-sm text-slate-500">Happy Patients</div>
            </div>

            <div>
              <div className="text-3xl font-bold text-slate-900">100k+</div>
              <div className="mt-1 text-sm text-slate-500">Consultations</div>
            </div>

            <div>
              <div className="text-3xl font-bold text-slate-900">4.9/5</div>
              <div className="mt-1 flex items-center justify-center text-sm text-slate-500">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400 mr-1" /> Rating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need for better health
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Comprehensive tools designed for both patients and healthcare
              providers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Calendar size={24} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">
                Easy Scheduling
              </h3>
              <p className="text-slate-600">
                Find the right specialist and book appointments instantly. No
                more waiting on hold.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <Video size={24} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">
                Telemedicine
              </h3>
              <p className="text-slate-600">
                Consult with your doctor from the comfort of your home via
                secure, high-quality video calls.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Activity size={24} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">
                AI Symptom Checker
              </h3>
              <p className="text-slate-600">
                Get preliminary health insights and specialist recommendations
                based on your symptoms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-slate-400">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6 text-white">
            <Activity size={24} />
            <span className="text-2xl font-bold tracking-tight">
              HealthSync
            </span>
          </div>

          <p className="mb-6">
            © 2026 HealthSync Platform. All rights reserved.
          </p>

          <div className="flex justify-center gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contact Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}