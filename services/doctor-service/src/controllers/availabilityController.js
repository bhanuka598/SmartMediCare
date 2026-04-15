const Doctor = require('../models/Doctor');

// Get availability schedule for a date range
exports.getAvailabilitySchedule = async (req, res) => {
  try {
    const { userId } = req;
    const { startDate, endDate } = req.query;

    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    let schedules = doctor.availability.schedules;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      schedules = schedules.filter(schedule => 
        schedule.date >= start && schedule.date <= end
      );
    }

    // Sort by date
    schedules.sort((a, b) => a.date - b.date);

    res.json({
      success: true,
      defaultSchedule: doctor.availability.defaultSchedule,
      timeZone: doctor.availability.timeZone,
      schedules
    });
  } catch (error) {
    console.error('Get availability schedule error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get public availability for a doctor (for patients to view)
exports.getPublicAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate, includeBooked } = req.query;

    const doctor = await Doctor.findOne({ userId: doctorId, isActive: true });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const includeBookedSlots =
      includeBooked === 'true' || includeBooked === '1' || includeBooked === 'yes';

    let schedules = doctor.availability.schedules.filter(s => s.isAvailable);

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      schedules = schedules.filter(schedule => 
        schedule.date >= start && schedule.date <= end
      );
    }

    // Default: hide already-booked slots. includeBooked=true keeps them so booking UIs can show them as blocked.
    const availability = schedules.map(schedule => ({
      date: schedule.date,
      dayOfWeek: schedule.dayOfWeek,
      timeSlots: schedule.timeSlots.filter((slot) =>
        slot.isAvailable && (includeBookedSlots || !slot.isBooked)
      )
    })).filter(s => s.timeSlots.length > 0);

    // Dates explicitly marked unavailable (e.g. exceptions) — do not fall back to weekly default.
    const blockedDates = doctor.availability.schedules
      .filter((s) => !s.isAvailable)
      .map((s) => new Date(s.date).toISOString().split('T')[0]);

    res.json({
      success: true,
      doctorId,
      timeZone: doctor.availability.timeZone,
      consultationDuration: doctor.practice.consultationDuration,
      defaultSchedule: doctor.availability.defaultSchedule,
      blockedDates,
      availability
    });
  } catch (error) {
    console.error('Get public availability error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add or update availability for a specific date
exports.setAvailability = async (req, res) => {
  try {
    const { userId } = req;
    const { date, isAvailable, timeSlots, notes } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Find existing schedule for this date
    const existingScheduleIndex = doctor.availability.schedules.findIndex(
      s => s.date.toDateString() === targetDate.toDateString()
    );

    const scheduleData = {
      date: targetDate,
      dayOfWeek,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      timeSlots: timeSlots || [],
      notes: notes || ''
    };

    if (existingScheduleIndex >= 0) {
      // Update existing schedule
      doctor.availability.schedules[existingScheduleIndex] = scheduleData;
    } else {
      // Add new schedule
      doctor.availability.schedules.push(scheduleData);
    }

    await doctor.save();

    res.json({
      success: true,
      message: 'Availability updated successfully',
      schedule: scheduleData
    });
  } catch (error) {
    console.error('Set availability error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Set availability for multiple dates (bulk operation)
exports.setBulkAvailability = async (req, res) => {
  try {
    const { userId } = req;
    const { schedules } = req.body;

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ message: 'Schedules array is required' });
    }

    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const results = [];

    for (const scheduleData of schedules) {
      const { date, isAvailable, timeSlots, notes } = scheduleData;
      
      if (!date) continue;

      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();

      const existingScheduleIndex = doctor.availability.schedules.findIndex(
        s => s.date.toDateString() === targetDate.toDateString()
      );

      const newSchedule = {
        date: targetDate,
        dayOfWeek,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        timeSlots: timeSlots || [],
        notes: notes || ''
      };

      if (existingScheduleIndex >= 0) {
        doctor.availability.schedules[existingScheduleIndex] = newSchedule;
      } else {
        doctor.availability.schedules.push(newSchedule);
      }

      results.push(newSchedule);
    }

    await doctor.save();

    res.json({
      success: true,
      message: `${results.length} availability schedules updated`,
      schedules: results
    });
  } catch (error) {
    console.error('Set bulk availability error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update default weekly schedule
exports.updateDefaultSchedule = async (req, res) => {
  try {
    const { userId } = req;
    const { defaultSchedule } = req.body;

    if (!defaultSchedule) {
      return res.status(400).json({ message: 'Default schedule is required' });
    }

    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of validDays) {
      if (defaultSchedule[day]) {
        doctor.availability.defaultSchedule[day] = {
          isAvailable: defaultSchedule[day].isAvailable !== undefined ? defaultSchedule[day].isAvailable : doctor.availability.defaultSchedule[day]?.isAvailable,
          startTime: defaultSchedule[day].startTime || doctor.availability.defaultSchedule[day]?.startTime || '09:00',
          endTime: defaultSchedule[day].endTime || doctor.availability.defaultSchedule[day]?.endTime || '17:00'
        };
      }
    }

    if (defaultSchedule.timeZone) {
      doctor.availability.timeZone = defaultSchedule.timeZone;
    }

    await doctor.save();

    res.json({
      success: true,
      message: 'Default schedule updated successfully',
      defaultSchedule: doctor.availability.defaultSchedule,
      timeZone: doctor.availability.timeZone
    });
  } catch (error) {
    console.error('Update default schedule error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Generate recurring availability based on default schedule
exports.generateRecurringAvailability = async (req, res) => {
  try {
    const { userId } = req;
    const { startDate, endDate, slotDuration } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = slotDuration || doctor.practice.consultationDuration || 30;

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const generatedSchedules = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayName = dayNames[d.getDay()];
      const defaultDay = doctor.availability.defaultSchedule[dayName];

      if (defaultDay && defaultDay.isAvailable) {
        const timeSlots = generateTimeSlots(defaultDay.startTime, defaultDay.endTime, duration);

        const existingScheduleIndex = doctor.availability.schedules.findIndex(
          s => s.date.toDateString() === d.toDateString()
        );

        const scheduleData = {
          date: new Date(d),
          dayOfWeek: d.getDay(),
          isAvailable: true,
          timeSlots,
          notes: ''
        };

        if (existingScheduleIndex >= 0) {
          // Only update if not manually modified (no notes and no booked slots)
          const existing = doctor.availability.schedules[existingScheduleIndex];
          const hasBookedSlots = existing.timeSlots.some(s => s.isBooked);
          
          if (!existing.notes && !hasBookedSlots) {
            doctor.availability.schedules[existingScheduleIndex] = scheduleData;
            generatedSchedules.push(scheduleData);
          }
        } else {
          doctor.availability.schedules.push(scheduleData);
          generatedSchedules.push(scheduleData);
        }
      }
    }

    await doctor.save();

    res.json({
      success: true,
      message: `${generatedSchedules.length} schedules generated`,
      schedules: generatedSchedules
    });
  } catch (error) {
    console.error('Generate recurring availability error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete availability for a specific date
exports.deleteAvailability = async (req, res) => {
  try {
    const { userId } = req;
    const { date } = req.params;

    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const targetDate = new Date(date);
    
    const scheduleIndex = doctor.availability.schedules.findIndex(
      s => s.date.toDateString() === targetDate.toDateString()
    );

    if (scheduleIndex === -1) {
      return res.status(404).json({ message: 'Schedule not found for this date' });
    }

    // Check if any slots are booked
    const hasBookedSlots = doctor.availability.schedules[scheduleIndex].timeSlots.some(s => s.isBooked);
    
    if (hasBookedSlots) {
      return res.status(400).json({ message: 'Cannot delete schedule with booked appointments' });
    }

    doctor.availability.schedules.splice(scheduleIndex, 1);
    await doctor.save();

    res.json({
      success: true,
      message: 'Availability deleted successfully'
    });
  } catch (error) {
    console.error('Delete availability error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Clear old availability schedules
exports.clearOldSchedules = async (req, res) => {
  try {
    const { userId } = req;
    const { beforeDate } = req.query;

    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const cutoffDate = beforeDate ? new Date(beforeDate) : new Date();
    
    const initialCount = doctor.availability.schedules.length;
    
    // Remove schedules before cutoff date that don't have booked slots
    doctor.availability.schedules = doctor.availability.schedules.filter(schedule => {
      if (schedule.date < cutoffDate) {
        return schedule.timeSlots.some(s => s.isBooked);
      }
      return true;
    });

    const removedCount = initialCount - doctor.availability.schedules.length;
    await doctor.save();

    res.json({
      success: true,
      message: `${removedCount} old schedules removed`,
      remainingSchedules: doctor.availability.schedules.length
    });
  } catch (error) {
    console.error('Clear old schedules error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Book a time slot (called by appointment service)
exports.bookTimeSlot = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, startTime, endTime, appointmentId } = req.body;

    if (!date || !startTime || !endTime || !appointmentId) {
      return res.status(400).json({ message: 'Date, startTime, endTime, and appointmentId are required' });
    }

    const doctor = await Doctor.findOne({ userId: doctorId });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const targetDate = new Date(date);
    
    const schedule = doctor.availability.schedules.find(
      s => s.date.toDateString() === targetDate.toDateString()
    );

    if (!schedule) {
      return res.status(404).json({ message: 'No schedule found for this date' });
    }

    const timeSlot = schedule.timeSlots.find(
      slot => slot.startTime === startTime && slot.endTime === endTime
    );

    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    if (!timeSlot.isAvailable || timeSlot.isBooked) {
      return res.status(400).json({ message: 'Time slot is not available' });
    }

    timeSlot.isBooked = true;
    timeSlot.appointmentId = appointmentId;
    await doctor.save();

    res.json({
      success: true,
      message: 'Time slot booked successfully'
    });
  } catch (error) {
    console.error('Book time slot error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Release a booked time slot (called when appointment is cancelled)
exports.releaseTimeSlot = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, startTime, endTime, appointmentId } = req.body;

    const doctor = await Doctor.findOne({ userId: doctorId });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const targetDate = new Date(date);
    
    const schedule = doctor.availability.schedules.find(
      s => s.date.toDateString() === targetDate.toDateString()
    );

    if (!schedule) {
      return res.status(404).json({ message: 'No schedule found for this date' });
    }

    const timeSlot = schedule.timeSlots.find(
      slot => slot.startTime === startTime && slot.endTime === endTime && slot.appointmentId === appointmentId
    );

    if (!timeSlot) {
      return res.status(404).json({ message: 'Booked time slot not found' });
    }

    timeSlot.isBooked = false;
    timeSlot.appointmentId = null;
    await doctor.save();

    res.json({
      success: true,
      message: 'Time slot released successfully'
    });
  } catch (error) {
    console.error('Release time slot error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to generate time slots
function generateTimeSlots(startTime, endTime, durationMinutes) {
  const slots = [];
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  for (let current = new Date(start); current < end; current.setMinutes(current.getMinutes() + durationMinutes)) {
    const slotEnd = new Date(current);
    slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

    if (slotEnd <= end) {
      slots.push({
        startTime: formatTime(current),
        endTime: formatTime(slotEnd),
        isAvailable: true,
        isBooked: false,
        appointmentId: null
      });
    }
  }

  return slots;
}

function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
