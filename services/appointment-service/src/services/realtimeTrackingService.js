const Appointment = require("../models/Appointment");

class RealTimeTrackingService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  initialize(io) {
    this.io = io;

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("join", (data) => {
        this.handleJoin(socket, data);
      });

      socket.on("leave", (data) => {
        this.handleLeave(socket, data);
      });

      socket.on("track-appointment", (appointmentId) => {
        this.handleTrackAppointment(socket, appointmentId);
      });

      socket.on("stop-tracking", (appointmentId) => {
        this.handleStopTracking(socket, appointmentId);
      });

      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });
    });

    console.log("Real-time tracking service initialized");
  }

  handleJoin(socket, data) {
    const { userId, role } = data;

    if (userId) {
      socket.userId = userId;
      socket.userRole = role;
      this.connectedUsers.set(userId, socket.id);

      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined as ${role}`);

      if (role === "doctor") {
        socket.join(`doctor:${userId}`);
      } else if (role === "patient") {
        socket.join(`patient:${userId}`);
      }

      socket.emit("joined", {
        success: true,
        message: `Connected as ${role}`,
        userId,
        timestamp: new Date().toISOString()
      });
    }
  }

  handleLeave(socket, data) {
    const { userId } = data;
    if (userId) {
      this.connectedUsers.delete(userId);
      socket.leave(`user:${userId}`);
      console.log(`User ${userId} left`);
    }
  }

  async handleTrackAppointment(socket, appointmentId) {
    try {
      const appointment = await Appointment.findById(appointmentId);

      if (!appointment) {
        socket.emit("error", { message: "Appointment not found" });
        return;
      }

      socket.appointmentId = appointmentId;
      socket.join(`appointment:${appointmentId}`);

      const statusData = {
        appointmentId,
        status: appointment.status,
        queueNumber: appointment.queueNumber,
        estimatedStartTime: appointment.estimatedStartTime,
        actualStartTime: appointment.actualStartTime,
        actualEndTime: appointment.actualEndTime,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        timestamp: new Date().toISOString()
      };

      socket.emit("tracking-started", statusData);

      this.broadcastToAppointment(appointmentId, "status-update", statusData);

      console.log(`Socket ${socket.id} tracking appointment ${appointmentId}`);
    } catch (error) {
      socket.emit("error", { message: error.message });
    }
  }

  handleStopTracking(socket, appointmentId) {
    socket.leave(`appointment:${appointmentId}`);
    socket.appointmentId = null;
    socket.emit("tracking-stopped", { appointmentId });
  }

  handleDisconnect(socket) {
    if (socket.userId) {
      this.connectedUsers.delete(socket.userId);
    }
    console.log("Client disconnected:", socket.id);
  }

  broadcastToAppointment(appointmentId, event, data) {
    if (this.io) {
      this.io.to(`appointment:${appointmentId}`).emit(event, data);
    }
  }

  broadcastToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  broadcastToDoctor(doctorId, event, data) {
    if (this.io) {
      this.io.to(`doctor:${doctorId}`).emit(event, data);
    }
  }

  broadcastToPatients(event, data) {
    if (this.io) {
      this.io.to("patients").emit(event, data);
    }
  }

  async notifyStatusChange(appointmentId, previousStatus, newStatus, changedBy) {
    try {
      const appointment = await Appointment.findById(appointmentId);

      if (!appointment) return;

      const notification = {
        appointmentId: appointment._id.toString(),
        previousStatus,
        newStatus,
        changedBy,
        timestamp: new Date().toISOString(),
        message: this.getStatusChangeMessage(newStatus, appointment)
      };

      this.broadcastToAppointment(appointmentId, "status-change", notification);

      this.broadcastToUser(appointment.patientId, "appointment-update", {
        type: "status-change",
        ...notification
      });

      this.broadcastToDoctor(appointment.doctorId, "appointment-update", {
        type: "status-change",
        ...notification
      });

      console.log(`Status change notification sent for appointment ${appointmentId}`);
    } catch (error) {
      console.error("Error notifying status change:", error.message);
    }
  }

  getStatusChangeMessage(status, appointment) {
    const messages = {
      PENDING: "Your appointment is pending confirmation",
      CONFIRMED: `Your appointment with Dr. ${appointment.doctorName} has been confirmed`,
      REJECTED: "Your appointment request has been rejected",
      CANCELLED: "Your appointment has been cancelled",
      COMPLETED: "Your appointment has been completed",
      IN_PROGRESS: "Your appointment has started",
      NO_SHOW: "You missed your appointment"
    };
    return messages[status] || "Appointment status updated";
  }

  async updateQueueStatus(doctorId, appointmentDate) {
    try {
      const appointments = await Appointment.find({
        doctorId,
        appointmentDate,
        status: { $in: ["CONFIRMED", "IN_PROGRESS"] }
      }).sort({ appointmentTime: 1 });

      let inProgressIndex = appointments.findIndex(a => a.status === "IN_PROGRESS");
      if (inProgressIndex === -1) inProgressIndex = 0;

      appointments.forEach((apt, index) => {
        const estimatedStart = this.calculateEstimatedStart(appointments, index, inProgressIndex);

        this.broadcastToAppointment(apt._id.toString(), "queue-update", {
          appointmentId: apt._id.toString(),
          queueNumber: apt.queueNumber,
          position: index - inProgressIndex + 1,
          totalInQueue: appointments.length - inProgressIndex,
          estimatedStartTime: estimatedStart,
          status: apt.status,
          timestamp: new Date().toISOString()
        });
      });
    } catch (error) {
      console.error("Error updating queue status:", error.message);
    }
  }

  calculateEstimatedStart(appointments, currentIndex, inProgressIndex) {
    if (currentIndex <= inProgressIndex) return null;

    let estimatedTime = new Date();
    const avgAppointmentDuration = 20;

    for (let i = inProgressIndex; i < currentIndex; i++) {
      estimatedTime.setMinutes(estimatedTime.getMinutes() + avgAppointmentDuration);
    }

    return estimatedTime.toISOString();
  }

  async sendReminder(appointmentId, reminderType) {
    try {
      const appointment = await Appointment.findById(appointmentId);

      if (!appointment || appointment.status !== "CONFIRMED") return;

      const reminderData = {
        appointmentId: appointment._id.toString(),
        type: reminderType,
        doctorName: appointment.doctorName,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        meetingLink: appointment.meetingLink,
        message: this.getReminderMessage(reminderType, appointment)
      };

      this.broadcastToUser(appointment.patientId, "reminder", reminderData);
      this.broadcastToAppointment(appointmentId, "reminder", reminderData);

      console.log(`Reminder sent for appointment ${appointmentId}`);
    } catch (error) {
      console.error("Error sending reminder:", error.message);
    }
  }

  getReminderMessage(type, appointment) {
    const messages = {
      "24h": `Reminder: You have an appointment with Dr. ${appointment.doctorName} tomorrow at ${appointment.appointmentTime}`,
      "1h": `Your appointment with Dr. ${appointment.doctorName} is in 1 hour at ${appointment.appointmentTime}`,
      "15min": `Your appointment with Dr. ${appointment.doctorName} starts in 15 minutes`
    };
    return messages[type] || `Reminder: You have an appointment at ${appointment.appointmentTime}`;
  }

  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }
}

module.exports = new RealTimeTrackingService();
