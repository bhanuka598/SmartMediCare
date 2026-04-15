import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '../../components/shared/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/shared/Card';

const API_URL = 'http://localhost:5000';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const DAY_TO_API = {
  'Monday': 'monday',
  'Tuesday': 'tuesday',
  'Wednesday': 'wednesday',
  'Thursday': 'thursday',
  'Friday': 'friday',
  'Saturday': 'saturday',
  'Sunday': 'sunday'
};

const INITIAL_DEFAULT_SCHEDULE = {
  monday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
  tuesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
  wednesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
  thursday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
  friday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
  saturday: { isAvailable: false, startTime: '09:00', endTime: '13:00' },
  sunday: { isAvailable: false, startTime: '09:00', endTime: '13:00' }
};

export function DoctorAvailabilityPage() {
  const [activeTab, setActiveTab] = useState('recurring');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [consultationDuration, setConsultationDuration] = useState(30);
  
  // Default weekly schedule
  const [defaultSchedule, setDefaultSchedule] = useState(INITIAL_DEFAULT_SCHEDULE);

  // Specific date schedules (exceptions)
  const [dateExceptions, setDateExceptions] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [exceptionForm, setExceptionForm] = useState({
    isAvailable: false,
    timeSlots: [],
    notes: ''
  });
  
  // Generate availability form
  const [generateForm, setGenerateForm] = useState({
    startDate: '',
    endDate: ''
  });

  const generateTimeSlotsFromRange = useCallback((startTime, endTime, duration) => {
    const slots = [];
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
    for (let current = new Date(start); current < end; current.setMinutes(current.getMinutes() + duration)) {
      const slotEnd = new Date(current);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);
      
      if (slotEnd <= end) {
        slots.push({
          startTime: formatTime(current),
          endTime: formatTime(slotEnd),
          isAvailable: true,
          isBooked: false
        });
      }
    }
    
    return slots;
  }, []);

  const isDefaultSchedule = useCallback((schedule, scheduleConfig) => {
    const dayName = DAYS[schedule.dayOfWeek].toLowerCase();
    const defaultDay = scheduleConfig[dayName];
    
    if (!defaultDay || defaultDay.isAvailable !== schedule.isAvailable) {
      return false;
    }
    
    if (schedule.timeSlots && schedule.timeSlots.length > 0) {
      const expectedSlots = generateTimeSlotsFromRange(
        defaultDay.startTime, 
        defaultDay.endTime, 
        consultationDuration
      );
      
      if (schedule.timeSlots.length !== expectedSlots.length) {
        return false;
      }
    }
    
    return true;
  }, [consultationDuration, generateTimeSlotsFromRange]);

  const fetchAvailabilityData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/doctors/availability`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch availability data');
      }

      const data = await response.json();
      
      const resolvedDefaultSchedule = data.defaultSchedule || INITIAL_DEFAULT_SCHEDULE;

      if (data.defaultSchedule) {
        setDefaultSchedule(resolvedDefaultSchedule);
      }
      
      if (data.schedules) {
        const exceptions = data.schedules.filter((s) => s.notes || !isDefaultSchedule(s, resolvedDefaultSchedule));
        setDateExceptions(exceptions);
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError(err.message || 'Failed to load availability data');
    } finally {
      setIsLoading(false);
    }
  }, [isDefaultSchedule]);

  // Fetch initial data
  useEffect(() => {
    fetchAvailabilityData();
  }, [fetchAvailabilityData]);

  const handleDefaultScheduleChange = (day, field, value) => {
    setDefaultSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleToggleDay = (day) => {
    setDefaultSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isAvailable: !prev[day].isAvailable
      }
    }));
  };

  const saveDefaultSchedule = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/doctors/availability/default`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ defaultSchedule })
      });

      if (!response.ok) {
        throw new Error('Failed to save default schedule');
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Default schedule saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error saving schedule:', err);
      setError(err.message || 'Failed to save schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const generateAvailability = async () => {
    if (!generateForm.startDate || !generateForm.endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/doctors/availability/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          startDate: generateForm.startDate,
          endDate: generateForm.endDate,
          slotDuration: consultationDuration
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate availability');
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccess(`${data.schedules.length} days of availability generated successfully!`);
        setGenerateForm({ startDate: '', endDate: '' });
        fetchAvailabilityData();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error generating availability:', err);
      setError(err.message || 'Failed to generate availability');
    } finally {
      setIsGenerating(false);
    }
  };

  const addDateException = async () => {
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      let timeSlots = [];
      if (exceptionForm.isAvailable) {
        const dayOfWeek = new Date(selectedDate).getDay();
        const dayName = DAYS[dayOfWeek === 0 ? 6 : dayOfWeek - 1].toLowerCase();
        const defaultDay = defaultSchedule[dayName];
        
        if (defaultDay && defaultDay.isAvailable) {
          timeSlots = generateTimeSlotsFromRange(
            defaultDay.startTime,
            defaultDay.endTime,
            consultationDuration
          );
        }
      }

      const response = await fetch(`${API_URL}/api/doctors/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: selectedDate,
          isAvailable: exceptionForm.isAvailable,
          timeSlots,
          notes: exceptionForm.notes || 'Date exception'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add date exception');
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Date exception added successfully!');
        setSelectedDate('');
        setExceptionForm({ isAvailable: false, timeSlots: [], notes: '' });
        fetchAvailabilityData();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error adding exception:', err);
      setError(err.message || 'Failed to add date exception');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDateException = async (date) => {
    if (!confirm('Are you sure you want to remove this date exception?')) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/doctors/availability/${date}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete date exception');
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Date exception removed successfully!');
        fetchAvailabilityData();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error deleting exception:', err);
      setError(err.message || 'Failed to delete date exception');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Manage Availability
          </h1>
          <p className="text-slate-500">
            Set your working hours and manage your schedule for patient appointments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={fetchAvailabilityData} 
            variant="outline" 
            className="gap-2"
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button 
            onClick={saveDefaultSchedule} 
            className="gap-2"
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
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

      <Card>
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('recurring')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'recurring'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Weekly Schedule
            </button>

            <button
              onClick={() => setActiveTab('exceptions')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'exceptions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Date Exceptions ({dateExceptions.length})
            </button>

            <button
              onClick={() => setActiveTab('generate')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'generate'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Generate Schedule
            </button>
          </nav>
        </div>

        <CardContent className="p-6">
          {/* Weekly Schedule Tab */}
          {activeTab === 'recurring' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 flex gap-3">
                <Clock className="shrink-0 mt-0.5" size={18} />
                <p>
                  Set your standard weekly working hours. These times will be used as the default 
                  for each week. Appointments are automatically divided into {consultationDuration}-minute intervals.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DAYS.map((day) => {
                  const dayKey = DAY_TO_API[day];
                  const daySchedule = defaultSchedule[dayKey];
                  
                  return (
                    <div
                      key={day}
                      className={`p-4 rounded-lg border transition-all ${
                        daySchedule?.isAvailable 
                          ? 'border-blue-200 bg-white' 
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`font-semibold ${
                          daySchedule?.isAvailable ? 'text-slate-900' : 'text-slate-400'
                        }`}>
                          {day}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={daySchedule?.isAvailable || false}
                            onChange={() => handleToggleDay(dayKey)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {daySchedule?.isAvailable ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400" />
                            <input
                              type="time"
                              value={daySchedule.startTime}
                              onChange={(e) => handleDefaultScheduleChange(dayKey, 'startTime', e.target.value)}
                              className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                              type="time"
                              value={daySchedule.endTime}
                              onChange={(e) => handleDefaultScheduleChange(dayKey, 'endTime', e.target.value)}
                              className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">Not available</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                <label className="text-sm font-medium text-slate-700">
                  Consultation Duration:
                </label>
                <select
                  value={consultationDuration}
                  onChange={(e) => setConsultationDuration(parseInt(e.target.value))}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>
          )}

          {/* Date Exceptions Tab */}
          {activeTab === 'exceptions' && (
            <div className="space-y-6">
              {/* Add Exception Form */}
              <Card className="bg-slate-50">
                <CardContent className="p-4">
                  <h3 className="font-medium text-slate-900 mb-4">Add Date Exception</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Status
                      </label>
                      <select
                        value={exceptionForm.isAvailable ? 'available' : 'unavailable'}
                        onChange={(e) => setExceptionForm(prev => ({
                          ...prev,
                          isAvailable: e.target.value === 'available'
                        }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="unavailable">Unavailable (Time Off)</option>
                        <option value="available">Available (Override)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Note (Optional)
                      </label>
                      <input
                        type="text"
                        value={exceptionForm.notes}
                        onChange={(e) => setExceptionForm(prev => ({
                          ...prev,
                          notes: e.target.value
                        }))}
                        placeholder="e.g., Public Holiday"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button 
                      onClick={addDateException}
                      disabled={isSaving || !selectedDate}
                      className="gap-2"
                    >
                      <Plus size={18} />
                      Add Exception
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Exceptions List */}
              <div className="space-y-3">
                {dateExceptions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">
                      No Exceptions Added
                    </h3>
                    <p className="text-sm">
                      Add specific dates when your availability differs from your weekly schedule.
                    </p>
                  </div>
                ) : (
                  dateExceptions.map((exception, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        exception.isAvailable 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className={
                            exception.isAvailable ? 'text-green-600' : 'text-red-600'
                          } />
                          <span className="font-medium text-slate-900">
                            {formatDate(exception.date)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            exception.isAvailable 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {exception.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        {exception.notes && (
                          <p className="text-sm text-slate-500 mt-1 ml-6">{exception.notes}</p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => deleteDateException(exception.date.split('T')[0])}
                        disabled={isSaving}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Generate Schedule Tab */}
          {activeTab === 'generate' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-800 flex gap-3">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p>
                  This will automatically generate availability slots for the selected date range 
                  based on your weekly schedule. Existing schedules with booked appointments will not be overwritten.
                </p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={generateForm.startDate}
                        onChange={(e) => setGenerateForm(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={generateForm.endDate}
                        onChange={(e) => setGenerateForm(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <Button 
                      onClick={generateAvailability}
                      disabled={isGenerating || !generateForm.startDate || !generateForm.endDate}
                      className="gap-2"
                    >
                      {isGenerating ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <RefreshCw size={18} />
                      )}
                      {isGenerating ? 'Generating...' : 'Generate Availability'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
