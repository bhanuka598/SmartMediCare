import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Droplet,
  Edit2,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  UserCircle,
  Briefcase,
  HeartPulse,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';

const API_URL = 'http://localhost:5000';

export function PatientProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    height: '',
    weight: '',
    allergies: [],
    medications: []
  });

  // Fetch profile data
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/patient/profile`, {
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
        // Populate form data
        const p = data.profile;
        setFormData({
          firstName: p.profile?.firstName || '',
          lastName: p.profile?.lastName || '',
          dateOfBirth: p.profile?.dateOfBirth ? new Date(p.profile.dateOfBirth).toISOString().split('T')[0] : '',
          gender: p.profile?.gender || '',
          bloodType: p.profile?.bloodType || '',
          phone: p.profile?.phone || '',
          email: p.email || '',
          address: {
            street: p.profile?.address?.street || '',
            city: p.profile?.address?.city || '',
            state: p.profile?.address?.state || '',
            zipCode: p.profile?.address?.zipCode || '',
            country: p.profile?.address?.country || ''
          },
          emergencyContact: {
            name: p.profile?.emergencyContact?.name || '',
            phone: p.profile?.emergencyContact?.phone || '',
            relationship: p.profile?.emergencyContact?.relationship || ''
          },
          height: p.profile?.height || '',
          weight: p.profile?.weight || '',
          allergies: p.profile?.allergies || [],
          medications: p.profile?.medications || []
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
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
        [name]: value
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
      const response = await fetch(`${API_URL}/api/patient/profile`, {
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
            bloodType: formData.bloodType,
            phone: formData.phone,
            address: formData.address,
            emergencyContact: formData.emergencyContact,
            height: formData.height ? parseFloat(formData.height) : null,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            allergies: formData.allergies,
            medications: formData.medications
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
    // Reset form data to current profile
    if (profile) {
      const p = profile;
      setFormData({
        firstName: p.profile?.firstName || '',
        lastName: p.profile?.lastName || '',
        dateOfBirth: p.profile?.dateOfBirth ? new Date(p.profile.dateOfBirth).toISOString().split('T')[0] : '',
        gender: p.profile?.gender || '',
        bloodType: p.profile?.bloodType || '',
        phone: p.profile?.phone || '',
        email: p.email || '',
        address: {
          street: p.profile?.address?.street || '',
          city: p.profile?.address?.city || '',
          state: p.profile?.address?.state || '',
          zipCode: p.profile?.address?.zipCode || '',
          country: p.profile?.address?.country || ''
        },
        emergencyContact: {
          name: p.profile?.emergencyContact?.name || '',
          phone: p.profile?.emergencyContact?.phone || '',
          relationship: p.profile?.emergencyContact?.relationship || ''
        },
        height: p.profile?.height || '',
        weight: p.profile?.weight || '',
        allergies: p.profile?.allergies || [],
        medications: p.profile?.medications || []
      });
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

  const fullName = `${formData.firstName} ${formData.lastName}`.trim() || user?.username || 'Patient';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500">
            Manage your personal information and health details
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
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              {profile?.profile?.avatar ? (
                <img 
                  src={profile.profile.avatar} 
                  alt={fullName}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <UserCircle size={48} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
              <p className="text-slate-500">{profile?.email || user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                  {formData.bloodType || 'Blood Type Unknown'}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full capitalize">
                  {formData.gender || 'Gender Not Set'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                <Droplet size={16} className="inline mr-1 text-red-500" />
                Blood Type
              </label>
              {isEditing ? (
                <select
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                >
                  <option value="">Select blood type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              ) : (
                <p className="text-slate-900">{formData.bloodType || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Height (cm)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="Enter height in cm"
                />
              ) : (
                <p className="text-slate-900">{formData.height ? `${formData.height} cm` : 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Weight (kg)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="Enter weight in kg"
                />
              ) : (
                <p className="text-slate-900">{formData.weight ? `${formData.weight} kg` : 'Not set'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail size={20} className="text-blue-600" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-600" />
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contact Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="emergencyContact.name"
                  value={formData.emergencyContact.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="Enter contact name"
                />
              ) : (
                <p className="text-slate-900">{formData.emergencyContact.name || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="emergencyContact.phone"
                  value={formData.emergencyContact.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="Enter phone number"
                />
              ) : (
                <p className="text-slate-900">{formData.emergencyContact.phone || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Relationship
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="emergencyContact.relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="e.g., Spouse, Parent"
                />
              ) : (
                <p className="text-slate-900">{formData.emergencyContact.relationship || 'Not set'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartPulse size={20} className="text-red-600" />
            Health Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Allergies (comma-separated)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.allergies.join(', ')}
                  onChange={(e) => handleArrayChange('allergies', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="e.g., Penicillin, Peanuts, Shellfish"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.allergies.length > 0 ? (
                    formData.allergies.map((allergy, index) => (
                      <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                        {allergy}
                      </span>
                    ))
                  ) : (
                    <p className="text-slate-500">No allergies recorded</p>
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Current Medications (comma-separated)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.medications.join(', ')}
                  onChange={(e) => handleArrayChange('medications', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="e.g., Metformin, Lisinopril"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.medications.length > 0 ? (
                    formData.medications.map((med, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                        {med}
                      </span>
                    ))
                  ) : (
                    <p className="text-slate-500">No medications recorded</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
