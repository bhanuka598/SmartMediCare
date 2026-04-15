const Appointment = require("../models/Appointment");
const { searchDoctorsBySpecialtyFromDoctorService, getAllDoctorsFromDoctorService, getDoctorAvailability, getDoctorById } = require("./doctorService");
const { getPatientById } = require("./patientService");
const { createTelemedicineSession } = require("./telemedicineService");
const {
  sendAppointmentBookedNotification,
  sendConsultationCompletedNotification
} = require("./notificationService");

const isPastDateTime = (dateStr, timeStr) => {
  const appointmentDateTime = new Date(`${dateStr}T${timeStr}`);
  return appointmentDateTime < new Date();
};

const calculateEndTime = (startTime, duration = 30) => {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
};

const generateQueueNumber = async (doctorId, appointmentDate) => {
  const count = await Appointment.countDocuments({
    doctorId,
    appointmentDate,
    status: { $in: ["CONFIRMED", "PENDING", "IN_PROGRESS"] }
  });
  return count + 1;
};

const hydrateAppointmentFee = async (appointmentDoc) => {
  if (!appointmentDoc) return appointmentDoc;

  const currentFee = Number(appointmentDoc.fee || 0);
  const currentCurrency = appointmentDoc.currency || "USD";

  if (currentFee > 0 && currentCurrency) {
    return appointmentDoc;
  }

  try {
    const doctorProfile = await getDoctorById(appointmentDoc.doctorId);
    const doctorFee = Number(doctorProfile?.data?.consultationFee || 0);
    const doctorCurrency = doctorProfile?.data?.currency || currentCurrency || "USD";

    if (doctorFee > 0) {
      appointmentDoc.fee = doctorFee;
      appointmentDoc.currency = doctorCurrency;

      if (typeof appointmentDoc.save === "function") {
        appointmentDoc.markModified?.("fee");
        appointmentDoc.markModified?.("currency");
        await appointmentDoc.save();
      }
    }
  } catch (error) {
    console.warn("[appointment-service] Failed to hydrate appointment fee:", error.message);
  }

  return appointmentDoc;
};

const createAppointment = async (appointmentData, userId) => {
  try {
    const {
      patientId,
      doctorId,
      specialty,
      appointmentDate,
      appointmentTime,
      reason,
      symptoms,
      type,
      duration,
      patientName,
      patientEmail,
      patientPhone
    } = appointmentData;

    if (!patientId || !doctorId || !specialty || !appointmentDate || !appointmentTime) {
      return {
        success: false,
        message: "patientId, doctorId, specialty, appointmentDate and appointmentTime are required"
      };
    }

    if (isPastDateTime(appointmentDate, appointmentTime)) {
      return {
        success: false,
        message: "Cannot book an appointment in the past"
      };
    }

    const existingSlot = await Appointment.findOne({
      doctorId,
      appointmentDate,
      appointmentTime,
      status: { $nin: ["CANCELLED", "REJECTED"] }
    });

    if (existingSlot) {
      return {
        success: false,
        message: "This doctor already has an appointment at this time slot"
      };
    }

    const queueNumber = await generateQueueNumber(doctorId, appointmentDate);
    const appDuration = duration || 30;
    const endTime = calculateEndTime(appointmentTime, appDuration);

    const patientProfile = await getPatientById(patientId);
    const doctorProfile = await getDoctorById(doctorId);

    const resolvedPatientName = patientName || patientProfile?.data?.name || "";
    const resolvedPatientEmail = patientEmail || patientProfile?.data?.email || "";
    const resolvedPatientPhone = patientPhone || patientProfile?.data?.phone || "";
    const resolvedDoctorName = appointmentData.doctorName || doctorProfile?.data?.name || "";
    const resolvedFee = Number(doctorProfile?.data?.consultationFee || appointmentData.fee || 0);
    const resolvedCurrency = doctorProfile?.data?.currency || appointmentData.currency || "USD";

    const appointment = await Appointment.create({
      patientId,
      patientName: resolvedPatientName,
      patientEmail: resolvedPatientEmail,
      patientPhone: resolvedPatientPhone,
      doctorId,
      doctorName: resolvedDoctorName,
      specialty,
      appointmentDate,
      appointmentTime,
      endTime,
      duration: appDuration,
      reason: reason || "",
      symptoms: symptoms || [],
      type: type || "IN_PERSON",
      fee: resolvedFee,
      currency: resolvedCurrency,
      queueNumber,
      status: "PENDING",
      _changedBy: userId,
      _changeReason: "Appointment created"
    });

    try {
      await sendAppointmentBookedNotification({
        appointmentId: appointment._id.toString(),
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        type: appointment.type,
        patient: {
          name: resolvedPatientName,
          email: resolvedPatientEmail,
          phone: resolvedPatientPhone
        },
        doctor: {
          name: resolvedDoctorName,
          email: doctorProfile?.data?.email || "",
          phone: doctorProfile?.data?.phone || ""
        }
      });
    } catch (notificationError) {
      console.warn("[appointment-service] Booking notification failed:", notificationError.message);
    }

    return {
      success: true,
      message: "Appointment booked successfully",
      data: appointment
    };
  } catch (error) {
    if (error?.code === 11000) {
      return {
        success: false,
        message: "This doctor already has an appointment at this time slot",
        error: error.message
      };
    }

    return {
      success: false,
      message: "Error creating appointment",
      error: error.message
    };
  }
};

const searchDoctors = async (specialty, filters = {}) => {
  try {
    // If no specialty provided, fetch all doctors
    const doctors = specialty 
      ? await searchDoctorsBySpecialtyFromDoctorService(specialty)
      : await getAllDoctorsFromDoctorService();

    if (!doctors.success) {
      return {
        success: false,
        message: doctors.message || "Error searching doctors",
        data: []
      };
    }

    let doctorList = doctors.doctors || [];

    if (filters.available === "true") {
      const availableDoctors = [];
      for (const doctor of doctorList) {
        const doctorIdentifier = doctor.userId || doctor.id || doctor._id;
        const availability = await getDoctorAvailability(doctorIdentifier);
        if (availability.success && Array.isArray(availability.availability) && availability.availability.length > 0) {
          availableDoctors.push(doctor);
        }
      }
      doctorList = availableDoctors;
    }

    if (filters.date) {
      const availableDoctors = [];
      for (const doctor of doctorList) {
        const doctorIdentifier = doctor.userId || doctor.id || doctor._id;
        const availability = await getDoctorAvailability(doctorIdentifier);
        const hasAvailabilityOnDate = Array.isArray(availability.availability) &&
          availability.availability.some((schedule) => {
            const scheduleDate = new Date(schedule.date).toISOString().split("T")[0];
            return scheduleDate === filters.date && Array.isArray(schedule.timeSlots) && schedule.timeSlots.length > 0;
          });

        if (availability.success && hasAvailabilityOnDate) {
          availableDoctors.push(doctor);
        }
      }
      doctorList = availableDoctors;
    }

    if (filters.minRating) {
      doctorList = doctorList.filter(d => (d.rating || 0) >= parseFloat(filters.minRating));
    }

    if (filters.maxFee) {
      doctorList = doctorList.filter(d => (d.consultationFee || 0) <= parseFloat(filters.maxFee));
    }

    return {
      success: true,
      message: "Doctors fetched successfully",
      data: doctorList,
      count: doctorList.length
    };
  } catch (error) {
    return {
      success: false,
      message: "Error searching doctors",
      error: error.message,
      data: []
    };
  }
};

const getAppointments = async (query = {}, options = {}) => {
  try {
    let dbQuery = {};

    if (query.patientId) dbQuery.patientId = query.patientId;
    if (query.doctorId) dbQuery.doctorId = query.doctorId;
    if (query.status) dbQuery.status = query.status.toUpperCase();
    if (query.specialty) dbQuery.specialty = new RegExp(query.specialty, "i");
    if (query.appointmentDate) dbQuery.appointmentDate = query.appointmentDate;
    if (query.dateFrom || query.dateTo) {
      dbQuery.appointmentDate = {};
      if (query.dateFrom) dbQuery.appointmentDate.$gte = query.dateFrom;
      if (query.dateTo) dbQuery.appointmentDate.$lte = query.dateTo;
    }

    if (query.type) dbQuery.type = query.type;
    if (query.paymentStatus) dbQuery.paymentStatus = query.paymentStatus;

    let sortOption = {};
    switch (query.sortBy) {
      case "dateAsc":
        sortOption = { appointmentDate: 1, appointmentTime: 1 };
        break;
      case "dateDesc":
        sortOption = { appointmentDate: -1, appointmentTime: -1 };
        break;
      case "createdAt":
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { appointmentDate: 1, appointmentTime: 1 };
    }

    let appointmentsQuery = Appointment.find(dbQuery).sort(sortOption);

    if (options.limit) {
      appointmentsQuery = appointmentsQuery.limit(parseInt(options.limit));
    }

    if (options.skip) {
      appointmentsQuery = appointmentsQuery.skip(parseInt(options.skip));
    }

    const appointments = await appointmentsQuery;
    await Promise.all(appointments.map((appointment) => hydrateAppointmentFee(appointment)));
    const total = await Appointment.countDocuments(dbQuery);

    return {
      success: true,
      data: appointments,
      total,
      count: appointments.length
    };
  } catch (error) {
    return {
      success: false,
      message: "Error fetching appointments",
      error: error.message
    };
  }
};

const getAppointmentById = async (id) => {
  try {
    let appointment = await Appointment.findById(id);

    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found"
      };
    }

    appointment = await hydrateAppointmentFee(appointment);

    return {
      success: true,
      data: appointment
    };
  } catch (error) {
    return {
      success: false,
      message: "Error fetching appointment",
      error: error.message
    };
  }
};

const updateAppointment = async (id, updateData, userId) => {
  try {
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found"
      };
    }

    if (!appointment.canBeModified()) {
      return {
        success: false,
        message: `Cannot modify appointment with status: ${appointment.status}`
      };
    }

    const {
      appointmentDate,
      appointmentTime,
      reason,
      symptoms,
      type,
      duration,
      notes
    } = updateData;

    const newDate = appointmentDate || appointment.appointmentDate;
    const newTime = appointmentTime || appointment.appointmentTime;
    const newDuration = duration || appointment.duration;

    if (isPastDateTime(newDate, newTime)) {
      return {
        success: false,
        message: "Cannot set an appointment in the past"
      };
    }

    if (appointmentDate || appointmentTime) {
      const conflictingSlot = await Appointment.findOne({
        _id: { $ne: id },
        doctorId: appointment.doctorId,
        appointmentDate: newDate,
        appointmentTime: newTime,
        status: { $nin: ["CANCELLED", "REJECTED"] }
      });

      if (conflictingSlot) {
        return {
          success: false,
          message: "Selected time slot is already booked"
        };
      }

      appointment.previousDates.push({
        date: appointment.appointmentDate,
        time: appointment.appointmentTime,
        changedAt: new Date()
      });

      appointment.rescheduleCount += 1;
      appointment.appointmentDate = newDate;
      appointment.appointmentTime = newTime;
      appointment.endTime = calculateEndTime(newTime, newDuration);
    }

    if (duration) {
      appointment.duration = newDuration;
      appointment.endTime = calculateEndTime(appointment.appointmentTime, newDuration);
    }

    if (reason !== undefined) appointment.reason = reason;
    if (symptoms !== undefined) appointment.symptoms = symptoms;
    if (type !== undefined) appointment.type = type;
    if (notes !== undefined) appointment.notes = notes;

    appointment._changedBy = userId;
    appointment._changeReason = "Appointment updated";

    await appointment.save();

    return {
      success: true,
      message: "Appointment updated successfully",
      data: appointment
    };
  } catch (error) {
    return {
      success: false,
      message: "Error updating appointment",
      error: error.message
    };
  }
};

const cancelAppointment = async (id, reason, cancelledBy, userId) => {
  try {
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found"
      };
    }

    if (!appointment.canBeCancelled()) {
      return {
        success: false,
        message: `Cannot cancel appointment with status: ${appointment.status}`
      };
    }

    appointment.status = "CANCELLED";
    appointment.cancelledBy = cancelledBy || "PATIENT";
    appointment.cancellationReason = reason || "";
    appointment._changedBy = userId;
    appointment._changeReason = `Cancelled by ${cancelledBy}: ${reason || "No reason provided"}`;

    await appointment.save();

    return {
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment
    };
  } catch (error) {
    return {
      success: false,
      message: "Error cancelling appointment",
      error: error.message
    };
  }
};

const confirmAppointment = async (id, userId) => {
  try {
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found"
      };
    }

    if (appointment.status !== "PENDING") {
      return {
        success: false,
        message: "Only pending appointments can be confirmed"
      };
    }

    appointment.status = "CONFIRMED";
    appointment._changedBy = userId;
    appointment._changeReason = "Appointment confirmed by doctor";

    if (appointment.type === "TELEMEDICINE") {
      const sessionResponse = await createTelemedicineSession(appointment);
      if (sessionResponse.success && sessionResponse.data?.meetingLink) {
        appointment.meetingLink = sessionResponse.data.meetingLink;
      }
    }

    await appointment.save();

    return {
      success: true,
      message: "Appointment confirmed successfully",
      data: appointment
    };
  } catch (error) {
    return {
      success: false,
      message: "Error confirming appointment",
      error: error.message
    };
  }
};

const rejectAppointment = async (id, reason, userId) => {
  try {
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found"
      };
    }

    if (appointment.status !== "PENDING") {
      return {
        success: false,
        message: "Only pending appointments can be rejected"
      };
    }

    appointment.status = "REJECTED";
    appointment.doctorNotes = reason || "";
    appointment._changedBy = userId;
    appointment._changeReason = `Appointment rejected: ${reason || "No reason provided"}`;

    await appointment.save();

    return {
      success: true,
      message: "Appointment rejected successfully",
      data: appointment
    };
  } catch (error) {
    return {
      success: false,
      message: "Error rejecting appointment",
      error: error.message
    };
  }
};

const completeAppointment = async (id, notes, prescription, userId) => {
  try {
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found"
      };
    }

    if (!["CONFIRMED", "IN_PROGRESS"].includes(appointment.status)) {
      return {
        success: false,
        message: "Only confirmed or in-progress appointments can be completed"
      };
    }

    appointment.status = "COMPLETED";
    appointment.actualEndTime = new Date();
    if (notes) appointment.doctorNotes = notes;
    if (prescription) appointment.prescription = prescription;
    appointment._changedBy = userId;
    appointment._changeReason = "Appointment completed";

    await appointment.save();

    try {
      const doctorProfile = await getDoctorById(appointment.doctorId);
      await sendConsultationCompletedNotification({
        appointmentId: appointment._id.toString(),
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        type: appointment.type,
        patient: {
          name: appointment.patientName || "Patient",
          email: appointment.patientEmail || "",
          phone: appointment.patientPhone || ""
        },
        doctor: {
          name: appointment.doctorName || doctorProfile?.data?.name || "Doctor",
          email: doctorProfile?.data?.email || "",
          phone: doctorProfile?.data?.phone || ""
        }
      });
    } catch (notificationError) {
      console.warn("[appointment-service] Completion notification failed:", notificationError.message);
    }

    return {
      success: true,
      message: "Appointment marked as completed",
      data: appointment
    };
  } catch (error) {
    return {
      success: false,
      message: "Error completing appointment",
      error: error.message
    };
  }
};

const markInProgress = async (id, userId) => {
  try {
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found"
      };
    }

    if (appointment.status !== "CONFIRMED") {
      return {
        success: false,
        message: "Only confirmed appointments can be marked as in progress"
      };
    }

    appointment.status = "IN_PROGRESS";
    appointment.actualStartTime = new Date();
    appointment._changedBy = userId;
    appointment._changeReason = "Appointment started";

    await appointment.save();

    return {
      success: true,
      message: "Appointment marked as in progress",
      data: appointment
    };
  } catch (error) {
    return {
      success: false,
      message: "Error updating appointment status",
      error: error.message
    };
  }
};

const markNoShow = async (id, userId) => {
  try {
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found"
      };
    }

    if (!["CONFIRMED", "IN_PROGRESS"].includes(appointment.status)) {
      return {
        success: false,
        message: "Only confirmed or in-progress appointments can be marked as no-show"
      };
    }

    appointment.status = "NO_SHOW";
    appointment._changedBy = userId;
    appointment._changeReason = "Patient did not show up";

    await appointment.save();

    return {
      success: true,
      message: "Appointment marked as no-show",
      data: appointment
    };
  } catch (error) {
    return {
      success: false,
      message: "Error updating appointment status",
      error: error.message
    };
  }
};

const getAppointmentStatus = async (id) => {
  try {
    const appointment = await Appointment.findById(id).select("status statusHistory queueNumber estimatedStartTime actualStartTime actualEndTime");

    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found"
      };
    }

    return {
      success: true,
      data: {
        status: appointment.status,
        statusHistory: appointment.statusHistory,
        queueNumber: appointment.queueNumber,
        estimatedStartTime: appointment.estimatedStartTime,
        actualStartTime: appointment.actualStartTime,
        actualEndTime: appointment.actualEndTime,
        isUpcoming: appointment.isUpcoming(),
        canModify: appointment.canBeModified(),
        canCancel: appointment.canBeCancelled()
      }
    };
  } catch (error) {
    return {
      success: false,
      message: "Error fetching appointment status",
      error: error.message
    };
  }
};

const rateAppointment = async (id, rating, feedback, userId) => {
  try {
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found"
      };
    }

    if (appointment.status !== "COMPLETED") {
      return {
        success: false,
        message: "Can only rate completed appointments"
      };
    }

    if (appointment.rating?.score) {
      return {
        success: false,
        message: "Appointment has already been rated"
      };
    }

    appointment.rating = {
      score: rating,
      feedback: feedback || "",
      createdAt: new Date()
    };

    await appointment.save();

    return {
      success: true,
      message: "Rating submitted successfully",
      data: appointment.rating
    };
  } catch (error) {
    return {
      success: false,
      message: "Error submitting rating",
      error: error.message
    };
  }
};

const getDoctorSchedule = async (doctorId, date) => {
  try {
    const query = { doctorId };
    if (date) query.appointmentDate = date;

    const appointments = await Appointment.find(query)
      .select("appointmentDate appointmentTime endTime status patientName type")
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    return {
      success: true,
      data: appointments,
      count: appointments.length
    };
  } catch (error) {
    return {
      success: false,
      message: "Error fetching doctor schedule",
      error: error.message
    };
  }
};

const getAvailableSlots = async (doctorId, date) => {
  try {
    const availability = await getDoctorAvailability(doctorId);

    if (!availability.success) {
      return {
        success: false,
        message: availability.message || "Could not fetch doctor availability"
      };
    }

    const existingAppointments = await Appointment.find({
      doctorId,
      appointmentDate: date,
      status: { $nin: ["CANCELLED", "REJECTED"] }
    }).select("appointmentTime endTime");

    const bookedSlots = existingAppointments.map(a => ({
      start: a.appointmentTime,
      end: a.endTime
    }));

    const dailyAvailability = Array.isArray(availability.availability)
      ? availability.availability.find((schedule) => {
          const scheduleDate = new Date(schedule.date).toISOString().split("T")[0];
          return scheduleDate === date;
        })
      : null;

    const allSlots = Array.isArray(dailyAvailability?.timeSlots)
      ? dailyAvailability.timeSlots.map((slot) => ({
          start: slot.startTime,
          end: slot.endTime
        }))
      : [];
    const availableSlots = allSlots.filter(slot => {
      return !bookedSlots.some(booked =>
        (slot.start >= booked.start && slot.start < booked.end) ||
        (slot.end > booked.start && slot.end <= booked.end)
      );
    });

    return {
      success: true,
      data: {
        date,
        availableSlots,
        bookedSlots,
        totalSlots: allSlots.length,
        availableCount: availableSlots.length,
        bookedCount: bookedSlots.length
      }
    };
  } catch (error) {
    return {
      success: false,
      message: "Error fetching available slots",
      error: error.message
    };
  }
};

const getAppointmentStatistics = async (query = {}) => {
  try {
    const matchStage = {};
    if (query.doctorId) matchStage.doctorId = query.doctorId;
    if (query.patientId) matchStage.patientId = query.patientId;
    if (query.dateFrom || query.dateTo) {
      matchStage.appointmentDate = {};
      if (query.dateFrom) matchStage.appointmentDate.$gte = query.dateFrom;
      if (query.dateTo) matchStage.appointmentDate.$lte = query.dateTo;
    }

    const stats = await Appointment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
          confirmed: { $sum: { $cond: [{ $eq: ["$status", "CONFIRMED"] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0] } },
          noShow: { $sum: { $cond: [{ $eq: ["$status", "NO_SHOW"] }, 1, 0] } },
          totalRevenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$fee", 0] } }
        }
      }
    ]);

    const statusByDate = await Appointment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$appointmentDate",
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      success: true,
      data: {
        overall: stats[0] || {
          total: 0,
          pending: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
          rejected: 0,
          noShow: 0,
          totalRevenue: 0
        },
        byDate: statusByDate
      }
    };
  } catch (error) {
    return {
      success: false,
      message: "Error fetching appointment statistics",
      error: error.message
    };
  }
};

const getAppointmentPaymentContext = async (id) => {
  try {
    let appointment = await Appointment.findById(id);

    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found"
      };
    }

    appointment = await hydrateAppointmentFee(appointment);

    return {
      success: true,
      data: {
        appointmentId: appointment._id.toString(),
        patientId: appointment.patientId,
        patientName: appointment.patientName || "",
        patientEmail: appointment.patientEmail || "",
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName || "",
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        specialty: appointment.specialty || "",
        fee: Number(appointment.fee || 0),
        currency: appointment.currency || "USD",
        paymentStatus: appointment.paymentStatus || "PENDING",
        status: appointment.status
      }
    };
  } catch (error) {
    return {
      success: false,
      message: "Error fetching appointment payment context",
      error: error.message
    };
  }
};

const updateAppointmentPaymentStatus = async (id, paymentData = {}) => {
  try {
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found"
      };
    }

    if (paymentData.paymentStatus) {
      appointment.paymentStatus = paymentData.paymentStatus;
    }

    if (paymentData.paymentReference !== undefined) {
      appointment.paymentReference = paymentData.paymentReference || "";
    }

    if (paymentData.paidAt) {
      appointment.paidAt = new Date(paymentData.paidAt);
    } else if (paymentData.paymentStatus === "PAID" && !appointment.paidAt) {
      appointment.paidAt = new Date();
    }

    appointment._changedBy = "payment-service";
    appointment._changeReason = `Payment status updated to ${appointment.paymentStatus}`;

    await appointment.save();

    return {
      success: true,
      message: "Appointment payment status updated successfully",
      data: appointment
    };
  } catch (error) {
    return {
      success: false,
      message: "Error updating appointment payment status",
      error: error.message
    };
  }
};

module.exports = {
  createAppointment,
  searchDoctors,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  confirmAppointment,
  rejectAppointment,
  completeAppointment,
  markInProgress,
  markNoShow,
  getAppointmentStatus,
  rateAppointment,
  getDoctorSchedule,
  getAvailableSlots,
  getAppointmentStatistics,
  getAppointmentPaymentContext,
  updateAppointmentPaymentStatus
};
