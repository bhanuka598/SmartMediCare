import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { DoctorCard } from '../../components/doctors/DoctorCard';

const MOCK_DOCTORS = [
  {
    id: '1',
    name: 'Dr. Sarah Jenkins',
    specialty: 'Cardiologist',
    rating: 4.9,
    reviews: 128,
    experience: 15,
    image:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150',
    nextAvailable: 'Today, 14:30',
    fee: 2500,
    isOnline: true
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    specialty: 'Dermatologist',
    rating: 4.8,
    reviews: 95,
    experience: 8,
    image:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150&h=150',
    nextAvailable: 'Tomorrow, 09:00',
    fee: 2000,
    isOnline: false
  },
  {
    id: '3',
    name: 'Dr. Emily Rodriguez',
    specialty: 'Pediatrician',
    rating: 5.0,
    reviews: 210,
    experience: 12,
    image:
      'https://images.unsplash.com/photo-1594824432258-f9a12b1cc169?auto=format&fit=crop&q=80&w=150&h=150',
    nextAvailable: 'Today, 16:00',
    fee: 1800,
    isOnline: true
  },
  {
    id: '4',
    name: 'Dr. James Wilson',
    specialty: 'Neurologist',
    rating: 4.7,
    reviews: 84,
    experience: 20,
    image:
      'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150&h=150',
    nextAvailable: 'Oct 26, 10:30',
    fee: 3000,
    isOnline: false
  }
];

const SPECIALTIES = [
  'All',
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'Neurologist',
  'General Physician'
];

export function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  const handleBook = (id) => {
    console.log('Booking doctor:', id);
    // In a real app, this would open a booking modal
    alert('Booking modal would open here for doctor ID: ' + id);
  };

  const filteredDoctors = MOCK_DOCTORS.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecialty =
      selectedSpecialty === 'All' || doc.specialty === selectedSpecialty;

    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Find a Doctor</h1>
        <p className="text-slate-500">
          Search and book appointments with top specialists.
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <Input
            placeholder="Search doctors, specialties, or symptoms..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {SPECIALTIES.map((specialty) => (
            <button
              key={specialty}
              onClick={() => setSelectedSpecialty(specialty)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSpecialty === specialty
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {specialty}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {filteredDoctors.length}{' '}
            {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'} Available
          </h2>

          <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
            <Filter size={16} /> Sort by: Recommended
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} onBook={handleBook} />
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-slate-400" />
            </div>

            <h3 className="text-lg font-medium text-slate-900 mb-1">
              No doctors found
            </h3>

            <p className="text-slate-500">
              Try adjusting your search or filters to find what you're looking
              for.
            </p>

            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecialty('All');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}