import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { DoctorCard } from '../../components/doctors/DoctorCard';
import { BookAppointmentModal } from '../../components/appointments/BookAppointmentModal';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../lib/api';

const getToken = () => localStorage.getItem('token');

const SPECIALTIES = [
  'All',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'General Medicine',
  'ENT',
  'Ophthalmology',
  'Gynecology'
];

export function DoctorsPage() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Fetch all doctors on mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/appointments/doctors/search?specialty=`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        // Map backend doctor data to frontend format
        const mappedDoctors = (data.data || []).map(d => ({
          id: d._id || d.id || d.userId,
          name: d.name || `${d.profile?.firstName || ''} ${d.profile?.lastName || ''}`.trim() || 'Dr. Unknown',
          specialty: d.specialty || d.professional?.specialization || 'General Medicine',
          rating: d.rating || d.ratings?.averageRating || 0,
          reviews: d.reviews || d.ratings?.totalReviews || 0,
          experience: d.experience || d.professional?.yearsOfExperience || 0,
          image: d.image || d.profile?.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150',
          nextAvailable: 'Contact for availability',
          fee: d.consultationFee || d.practice?.consultationFee || 0,
          isOnline: false,
          // Keep original data for booking modal
          _original: d
        }));
        setDoctors(mappedDoctors);
      } else {
        setError(data.message || 'Failed to fetch doctors');
      }
    } catch (err) {
      console.error('Fetch doctors error:', err);
      setError('Failed to load doctors. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctors when specialty filter changes
  useEffect(() => {
    if (selectedSpecialty !== 'All') {
      fetchDoctorsBySpecialty(selectedSpecialty);
    } else {
      fetchDoctors();
    }
  }, [selectedSpecialty]);

  const fetchDoctorsBySpecialty = async (specialty) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}/api/appointments/doctors/search?specialty=${encodeURIComponent(specialty)}`,
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        const mappedDoctors = (data.data || []).map(d => ({
          id: d._id || d.id || d.userId,
          name: d.name || `${d.profile?.firstName || ''} ${d.profile?.lastName || ''}`.trim() || 'Dr. Unknown',
          specialty: d.specialty || d.professional?.specialization || specialty,
          rating: d.rating || d.ratings?.averageRating || 0,
          reviews: d.reviews || d.ratings?.totalReviews || 0,
          experience: d.experience || d.professional?.yearsOfExperience || 0,
          image: d.image || d.profile?.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150',
          nextAvailable: 'Contact for availability',
          fee: d.consultationFee || d.practice?.consultationFee || 0,
          isOnline: false,
          _original: d
        }));
        setDoctors(mappedDoctors);
      } else {
        setError(data.message || 'Failed to fetch doctors');
      }
    } catch (err) {
      console.error('Fetch doctors error:', err);
      setError('Failed to load doctors. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (doctor) => {
    setSelectedDoctor(doctor._original || doctor);
    setIsBookModalOpen(true);
  };

  const filteredDoctors = doctors.filter((doc) => {
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
            {loading ? 'Loading doctors...' : (
              <>
                {filteredDoctors.length}{' '}
                {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'} Available
              </>
            )}
          </h2>

          <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
            <Filter size={16} /> Sort by: Recommended
          </Button>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-500">Loading doctors...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              Error loading doctors
            </h3>
            <p className="text-slate-500">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchDoctors()}
            >
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDoctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} onBook={() => handleBook(doctor)} />
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
          </>
        )}
      </div>

      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={() => setIsBookModalOpen(false)}
        patientId={user?.id || user?._id}
        patientName={user?.name || user?.username}
        patientEmail={user?.email}
        patientPhone={user?.phone}
        preSelectedDoctor={selectedDoctor}
      />
    </div>
  );
}
