import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Edit2,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  UserCircle,
  GraduationCap,
  Stethoscope,
  Award,
  Building2,
  DollarSign,
  Clock,
  Languages,
  FileText,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';

const SPECIALTIES = [
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

const API_URL = 'http://localhost:5000';

export function DoctorProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  
  const [formData, setFormData] = useState({
    // Personal
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    bio: '',
    languages: [],
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    // Professional
    specialization: '',
    subSpecializations: [],
    licenseNumber: '',
    licenseExpiry: '',
    yearsOfExperience: '',
    education: [],
    experience: [],
    certifications: [],
    // Practice
    hospital: '',
    department: '',
    consultationFee: '',
    followUpFee: '',
    currency: 'USD',
    consultationDuration: '30',
    isAcceptingNewPatients: true
  });

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/doctors/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      
      if (data.success) {
        setProfile(data.profile);
        populateFormData(data.profile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const populateFormData = (p) => {
    setFormData({
      firstName: p.profile?.firstName || '',
      lastName: p.profile?.lastName || '',
      dateOfBirth: p.profile?.dateOfBirth ? new Date(p.profile.dateOfBirth).toISOString().split('T')[0] : '',
      gender: p.profile?.gender || '',
      phone: p.profile?.phone || '',
      email: p.email || '',
      bio: p.profile?.bio || '',
      languages: p.profile?.languages || [],
      address: {
        street: p.profile?.address?.street || '',
        city: p.profile?.address?.city || '',
        state: p.profile?.address?.state || '',
        zipCode: p.profile?.address?.zipCode || '',
        country: p.profile?.address?.country || ''
      },
      specialization: p.professional?.specialization || '',
      subSpecializations: p.professional?.subSpecializations || [],
      licenseNumber: p.professional?.licenseNumber || '',
      licenseExpiry: p.professional?.licenseExpiry ? new Date(p.professional.licenseExpiry).toISOString().split('T')[0] : '',
      yearsOfExperience: p.professional?.yearsOfExperience || '',
      education: p.professional?.education || [],
      experience: p.professional?.experience || [],
      certifications: p.professional?.certifications || [],
      hospital: p.practice?.hospital || '',
      department: p.practice?.department || '',
      consultationFee: p.practice?.consultationFee || '',
      followUpFee: p.practice?.followUpFee || '',
      currency: p.practice?.currency || 'USD',
      consultationDuration: p.practice?.consultationDuration || '30',
      isAcceptingNewPatients: p.practice?.isAcceptingNewPatients !== false
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleArrayChange = (field, value) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      [field]: items
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/doctors/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          profile: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            dateOfBirth: formData.dateOfBirth || null,
            gender: formData.gender,
            phone: formData.phone,
            bio: formData.bio,
            languages: formData.languages,
            address: formData.address
          },
          professional: {
            specialization: formData.specialization,
            subSpecializations: formData.subSpecializations,
            licenseNumber: formData.licenseNumber,
            licenseExpiry: formData.licenseExpiry || null,
            yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : 0
          },
          practice: {
            hospital: formData.hospital,
            department: formData.department,
            consultationFee: formData.consultationFee ? parseFloat(formData.consultationFee) : 0,
            followUpFee: formData.followUpFee ? parseFloat(formData.followUpFee) : 0,
            currency: formData.currency,
            consultationDuration: parseInt(formData.consultationDuration),
            isAcceptingNewPatients: formData.isAcceptingNewPatients
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      
      if (data.success) {
        setProfile(data.profile);
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      populateFormData(profile);
    }
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const fullName = `Dr. ${formData.firstName} ${formData.lastName}`.trim() || user?.username || 'Doctor';
  const profileCompletion = calculateProfileCompletion(formData);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500">
            Manage your professional information and practice details
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="gap-2">
              <Edit2 size={18} />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button onClick={handleCancel} variant="outline" className="gap-2">
                <X size={18} />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Profile Completion Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Profile Completion</span>
            <span className="text-sm font-bold text-blue-600">{profileCompletion}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-24 w-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              {profile?.profile?.avatar ? (
                <img 
                  src={profile.profile.avatar} 
                  alt={fullName}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <UserCircle size={56} />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
              <p className="text-slate-500">{formData.specialization || 'Specialization not set'}</p>
              <p className="text-slate-400 text-sm">{formData.hospital || 'Hospital not set'}</p>
              
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                  {formData.yearsOfExperience ? `${formData.yearsOfExperience} years exp.` : 'Experience not set'}
                </span>
                {formData.isAcceptingNewPatients ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                    Accepting Patients
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
                    Not Accepting Patients
                  </span>
                )}
                {profile?.isVerified && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full flex items-center gap-1">
                    <Award size={14} />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {formData.bio && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-slate-600 text-sm leading-relaxed">{formData.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'personal', label: 'Personal', icon: User },
          { id: 'professional', label: 'Professional', icon: Stethoscope },
          { id: 'practice', label: 'Practice', icon: Building2 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'personal' && (
        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} className="text-blue-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="Enter first name"
                    />
                  ) : (
                    <p className="text-slate-900">{formData.firstName || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="Enter last name"
                    />
                  ) : (
                    <p className="text-slate-900">{formData.lastName || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Calendar size={16} className="inline mr-1" />
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                  ) : (
                    <p className="text-slate-900">
                      {formData.dateOfBirth 
                        ? new Date(formData.dateOfBirth).toLocaleDateString() 
                        : 'Not set'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Gender
                  </label>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="text-slate-900 capitalize">{formData.gender || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Mail size={16} className="inline mr-1" />
                    Email
                  </label>
                  <p className="text-slate-900">{formData.email || user?.email || 'Not set'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Phone size={16} className="inline mr-1" />
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <p className="text-slate-900">{formData.phone || 'Not set'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Languages size={16} className="inline mr-1" />
                    Languages Spoken (comma-separated)
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.languages.join(', ')}
                      onChange={(e) => handleArrayChange('languages', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="e.g., English, Spanish, French"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.languages.length > 0 ? (
                        formData.languages.map((lang, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                            {lang}
                          </span>
                        ))
                      ) : (
                        <p className="text-slate-500">No languages specified</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin size={20} className="text-blue-600" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Street Address
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="Enter street address"
                    />
                  ) : (
                    <p className="text-slate-900">{formData.address.street || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    City
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="Enter city"
                    />
                  ) : (
                    <p className="text-slate-900">{formData.address.city || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    State/Province
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="Enter state"
                    />
                  ) : (
                    <p className="text-slate-900">{formData.address.state || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ZIP/Postal Code
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="Enter ZIP code"
                    />
                  ) : (
                    <p className="text-slate-900">{formData.address.zipCode || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Country
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="Enter country"
                    />
                  ) : (
                    <p className="text-slate-900">{formData.address.country || 'Not set'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About/Bio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                About / Bio
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                  placeholder="Write a brief bio about yourself, your expertise, and your approach to patient care..."
                />
              ) : (
                <p className="text-slate-900 whitespace-pre-wrap">
                  {formData.bio || 'No bio added yet.'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'professional' && (
        <div className="space-y-6">
          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope size={20} className="text-blue-600" />
                Professional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Primary Specialization
                  </label>
                  {isEditing ? (
                    <select
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    >
                      <option value="">Select specialization</option>
                      {SPECIALTIES.map((specialty) => (
                        <option key={specialty} value={specialty}>{specialty}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-slate-900">{formData.specialization || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Years of Experience
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="yearsOfExperience"
                      value={formData.yearsOfExperience}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="e.g., 10"
                    />
                  ) : (
                    <p className="text-slate-900">
                      {formData.yearsOfExperience ? `${formData.yearsOfExperience} years` : 'Not set'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Medical License Number
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="Enter license number"
                    />
                  ) : (
                    <p className="text-slate-900">{formData.licenseNumber || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    License Expiry Date
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="licenseExpiry"
                      value={formData.licenseExpiry}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                  ) : (
                    <p className="text-slate-900">
                      {formData.licenseExpiry 
                        ? new Date(formData.licenseExpiry).toLocaleDateString() 
                        : 'Not set'}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sub-specializations (comma-separated)
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.subSpecializations.join(', ')}
                      onChange={(e) => handleArrayChange('subSpecializations', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="e.g., Interventional Cardiology, Heart Failure"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.subSpecializations.length > 0 ? (
                        formData.subSpecializations.map((sub, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                            {sub}
                          </span>
                        ))
                      ) : (
                        <p className="text-slate-500">No sub-specializations</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap size={20} className="text-blue-600" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {formData.education.length > 0 ? (
                <div className="space-y-4">
                  {formData.education.map((edu, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-slate-900">{edu.degree}</h4>
                          <p className="text-slate-600">{edu.institution}</p>
                          {edu.fieldOfStudy && (
                            <p className="text-slate-500 text-sm">{edu.fieldOfStudy}</p>
                          )}
                        </div>
                        <span className="text-sm text-slate-400">
                          {edu.startYear} - {edu.endYear || 'Present'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No education records added.</p>
              )}
              {isEditing && (
                <p className="text-sm text-slate-400 mt-4">
                  * Education records can be managed through the admin portal
                </p>
              )}
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award size={20} className="text-blue-600" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {formData.certifications.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.certifications.map((cert, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-2 bg-green-100 text-green-700 text-sm rounded-lg"
                    >
                      {cert.name}
                      {cert.issuedBy && <span className="text-green-600"> - {cert.issuedBy}</span>}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No certifications added.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'practice' && (
        <div className="space-y-6">
          {/* Practice Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 size={20} className="text-blue-600" />
                Practice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Hospital/Clinic Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="hospital"
                      value={formData.hospital}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="Enter hospital or clinic name"
                    />
                  ) : (
                    <p className="text-slate-900">{formData.hospital || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Department
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="e.g., Cardiology Department"
                    />
                  ) : (
                    <p className="text-slate-900">{formData.department || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <DollarSign size={16} className="inline mr-1" />
                    Consultation Fee
                  </label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="LKR">LKR</option>
                      </select>
                      <input
                        type="number"
                        name="consultationFee"
                        value={formData.consultationFee}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        placeholder="e.g., 100"
                      />
                    </div>
                  ) : (
                    <p className="text-slate-900">
                      {formData.consultationFee 
                        ? `${formData.currency} ${formData.consultationFee}` 
                        : 'Not set'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <DollarSign size={16} className="inline mr-1" />
                    Follow-up Fee
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="followUpFee"
                      value={formData.followUpFee}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="e.g., 50"
                    />
                  ) : (
                    <p className="text-slate-900">
                      {formData.followUpFee 
                        ? `${formData.currency} ${formData.followUpFee}` 
                        : 'Not set'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Clock size={16} className="inline mr-1" />
                    Consultation Duration (minutes)
                  </label>
                  {isEditing ? (
                    <select
                      name="consultationDuration"
                      value={formData.consultationDuration}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                    </select>
                  ) : (
                    <p className="text-slate-900">{formData.consultationDuration} minutes</p>
                  )}
                </div>

                <div className="flex items-center">
                  {isEditing ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isAcceptingNewPatients"
                        checked={formData.isAcceptingNewPatients}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Currently accepting new patients
                      </span>
                    </label>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">Accepting new patients:</span>
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        formData.isAcceptingNewPatients 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {formData.isAcceptingNewPatients ? 'Yes' : 'No'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Helper function to calculate profile completion percentage
function calculateProfileCompletion(formData) {
  const fields = [
    'firstName',
    'lastName',
    'phone',
    'specialization',
    'licenseNumber',
    'hospital',
    'consultationFee',
    'bio'
  ];
  
  const addressFields = ['street', 'city', 'country'];
  
  let filledFields = 0;
  let totalFields = fields.length + addressFields.length;
  
  fields.forEach(field => {
    if (formData[field] && formData[field] !== '') {
      filledFields++;
    }
  });
  
  addressFields.forEach(field => {
    if (formData.address[field] && formData.address[field] !== '') {
      filledFields++;
    }
  });
  
  return Math.round((filledFields / totalFields) * 100);
}
