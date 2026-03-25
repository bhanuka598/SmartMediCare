import React, { useState } from 'react';
import { Calendar, Clock, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '../../components/shared/Card';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export function DoctorAvailabilityPage() {
  const [activeTab, setActiveTab] = useState('recurring');

  // Mock state for availability
  const [schedule, setSchedule] = useState({
    Monday: [
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '17:00' }
    ],
    Tuesday: [
      { start: '09:00', end: '13:00' }
    ],
    Wednesday: [
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '17:00' }
    ],
    Thursday: [
      { start: '10:00', end: '15:00' }
    ],
    Friday: [
      { start: '09:00', end: '12:00' }
    ],
    Saturday: [],
    Sunday: []
  });

  const addTimeSlot = (day) => {
    setSchedule({
      ...schedule,
      [day]: [
        ...schedule[day],
        {
          start: '09:00',
          end: '17:00'
        }
      ]
    });
  };

  const removeTimeSlot = (day, index) => {
    const newSlots = [...schedule[day]];
    newSlots.splice(index, 1);

    setSchedule({
      ...schedule,
      [day]: newSlots
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Manage Availability
          </h1>
          <p className="text-slate-500">
            Set your working hours for patient appointments.
          </p>
        </div>

        <Button className="gap-2">
          <Save size={18} /> Save Changes
        </Button>
      </div>

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
              Recurring Schedule
            </button>

            <button
              onClick={() => setActiveTab('exceptions')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'exceptions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Date Exceptions (Time Off)
            </button>
          </nav>
        </div>

        <CardContent className="p-6">
          {activeTab === 'recurring' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 flex gap-3">
                <Clock className="shrink-0 mt-0.5" size={18} />
                <p>
                  Set your standard weekly working hours. These slots will be
                  available for patients to book appointments. Appointments are
                  automatically divided into 30-minute intervals.
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {DAYS.map((day) => {
                  const slots = schedule[day];
                  const isActive = slots.length > 0;

                  return (
                    <div
                      key={day}
                      className="py-4 flex flex-col md:flex-row md:items-start gap-4"
                    >
                      <div className="w-32 flex items-center gap-3 shrink-0 pt-2">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => {
                            if (isActive) {
                              setSchedule({
                                ...schedule,
                                [day]: []
                              });
                            } else {
                              addTimeSlot(day);
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />

                        <span
                          className={`font-medium ${
                            isActive ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          {day}
                        </span>
                      </div>

                      <div className="flex-1 space-y-3">
                        {!isActive ? (
                          <div className="text-slate-400 text-sm py-2">
                            Unavailable
                          </div>
                        ) : (
                          <>
                            {slots.map((slot, index) => (
                              <div key={index} className="flex items-center gap-3">
                                <input
                                  type="time"
                                  value={slot.start}
                                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-slate-400">-</span>
                                <input
                                  type="time"
                                  value={slot.end}
                                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                  onClick={() => removeTimeSlot(day, index)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}

                            <button
                              onClick={() => addTimeSlot(day)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 py-1"
                            >
                              <Plus size={16} /> Add another slot
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'exceptions' && (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-slate-400" />
              </div>

              <h3 className="text-lg font-medium text-slate-900 mb-1">
                No Exceptions Added
              </h3>

              <p className="text-slate-500 mb-4">
                Add specific dates when you will be unavailable (e.g., holidays,
                personal time off).
              </p>

              <Button variant="outline" className="gap-2">
                <Plus size={16} /> Add Time Off
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}