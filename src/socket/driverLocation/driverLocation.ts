import { Socket } from "socket.io";
import { io } from "../socket";
import { carpoolService } from "../../app/modules/carpool/carpool.service";
import { Types } from "mongoose";

// Map to track active drivers and their locations
export const activeDrivers = new Map<
  string,
  {
    carpoolId: string;
    driverId: string;
    location: [number, number];
    lastUpdate: Date;
  }
>();

export const handleDriverLocationStart = async (
  socket: Socket,
  data: {
    carpoolId: string;
    driverId: string;
    location: [number, number];
  }
) => {
  try {
    const { carpoolId, driverId, location } = data;

    // Validate required fields
    if (!carpoolId || !driverId || !location || location.length !== 2) {
      socket.emit("driverLocationError", {
        message:
          "Invalid data: carpoolId, driverId, and location [longitude, latitude] are required",
      });
      return;
    }

    // Validate coordinates
    const [longitude, latitude] = location;
    if (
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      socket.emit("driverLocationError", {
        message:
          "Invalid coordinates: longitude must be between -180 and 180, latitude between -90 and 90",
      });
      return;
    }

    // Check if carpool exists and user is authorized to be driver
    const carpool = await carpoolService.getCarpoolById(carpoolId);
    if (!carpool) {
      socket.emit("driverLocationError", {
        message: "Carpool not found",
      });
      return;
    }


    // Check if user is the driver or a member of the carpool
    const isDriver = carpool.driver?._id.toString() === driverId;
    const isMember = carpool.members?.some(
      (member: Types.ObjectId) => member._id.toString() === driverId
    );
    console.log(isMember);

    if (!isDriver && !isMember) {
      socket.emit("driverLocationError", {
        message:
          "Unauthorized: You must be the driver or a member of this carpool",
      });
      return;
    }

    // Store driver location info
    activeDrivers.set(socket.id, {
      carpoolId,
      driverId,
      location,
      lastUpdate: new Date(),
    });

    // Join the carpool room for location updates
    socket.join(`carpool-${carpoolId}`);

    console.log(
      `Driver ${driverId} started sharing location for carpool ${carpoolId}`
    );

    // Emit to all members in the carpool room (except the driver)
    socket.to(`carpool-${carpoolId}`).emit("driverLocationUpdate", {
      carpoolId,
      driverId,
      location,
      timestamp: new Date(),
    });

    // Confirm to driver that location sharing started
    socket.emit("driverLocationStarted", {
      carpoolId,
      message: "Location sharing started successfully",
    });
  } catch (error) {
    console.error("Error in handleDriverLocationStart:", error);
    socket.emit("driverLocationError", {
      message: "Failed to start location sharing",
    });
  }
};

export const handleDriverLocationUpdate = async (
  socket: Socket,
  data: {
    location: [number, number];
  }
) => {
  try {
    const { location } = data;

    // Get driver info from active drivers map
    const driverInfo = activeDrivers.get(socket.id);
    if (!driverInfo) {
      socket.emit("driverLocationError", {
        message:
          "Location sharing not started. Please start location sharing first.",
      });
      return;
    }

    // Validate coordinates
    if (!location || location.length !== 2) {
      socket.emit("driverLocationError", {
        message: "Invalid location format. Expected [longitude, latitude]",
      });
      return;
    }

    const [longitude, latitude] = location;
    if (
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      socket.emit("driverLocationError", {
        message:
          "Invalid coordinates: longitude must be between -180 and 180, latitude between -90 and 90",
      });
      return;
    }

    // Update the stored location
    driverInfo.location = location;
    driverInfo.lastUpdate = new Date();
    activeDrivers.set(socket.id, driverInfo);

    console.log(
      `Driver ${driverInfo.driverId} updated location for carpool ${driverInfo.carpoolId}:`,
      location
    );

    // Emit to all members in the carpool room (except the driver)
    socket.to(`carpool-${driverInfo.carpoolId}`).emit("driverLocationUpdate", {
      carpoolId: driverInfo.carpoolId,
      driverId: driverInfo.driverId,
      location,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error in handleDriverLocationUpdate:", error);
    socket.emit("driverLocationError", {
      message: "Failed to update location",
    });
  }
};

export const handleDriverLocationStop = async (socket: Socket) => {
  try {
    const driverInfo = activeDrivers.get(socket.id);
    if (!driverInfo) {
      socket.emit("driverLocationError", {
        message: "No active location sharing found",
      });
      return;
    }

    const { carpoolId, driverId, location } = driverInfo;

    // Save the last location to database
    await carpoolService.updateDriverLocation(carpoolId, location);

    // Remove from active drivers
    activeDrivers.delete(socket.id);

    // Leave the carpool room
    socket.leave(`carpool-${carpoolId}`);

    console.log(
      `Driver ${driverId} stopped sharing location for carpool ${carpoolId}. Last location saved:`,
      location
    );

    // Notify carpool members that driver stopped sharing location
    socket.to(`carpool-${carpoolId}`).emit("driverLocationStopped", {
      carpoolId,
      driverId,
      lastKnownLocation: location,
      timestamp: new Date(),
    });

    // Confirm to driver that location sharing stopped
    socket.emit("driverLocationStopped", {
      carpoolId,
      message: "Location sharing stopped successfully",
      lastKnownLocation: location,
    });
  } catch (error) {
    console.error("Error in handleDriverLocationStop:", error);
    socket.emit("driverLocationError", {
      message: "Failed to stop location sharing",
    });
  }
};

export const handleDriverDisconnect = async (socketId: string) => {
  try {
    const driverInfo = activeDrivers.get(socketId);
    if (!driverInfo) {
      return; // No active location sharing for this socket
    }

    const { carpoolId, driverId, location } = driverInfo;

    console.log(
      `Driver ${driverId} disconnected. Saving last location for carpool ${carpoolId}:`,
      location
    );

    // Save the last location to database
    await carpoolService.updateDriverLocation(carpoolId, location);

    // Remove from active drivers
    activeDrivers.delete(socketId);

    // Notify carpool members that driver disconnected
    io.to(`carpool-${carpoolId}`).emit("driverLocationStopped", {
      carpoolId,
      driverId,
      lastKnownLocation: location,
      timestamp: new Date(),
      reason: "Driver disconnected",
    });
  } catch (error) {
    console.error("Error in handleDriverDisconnect:", error);
  }
};

export const joinCarpoolLocationRoom = (
  socket: Socket,
  data: { carpoolId: string; userId: string }
) => {
  try {
    const { carpoolId, userId } = data;

    if (!carpoolId || !userId) {
      socket.emit("locationRoomError", {
        message: "carpoolId and userId are required",
      });
      return;
    }

    // Join the carpool location room to receive location updates
    socket.join(`carpool-${carpoolId}`);

    console.log(
      `User ${userId} joined location updates for carpool ${carpoolId}`
    );

    socket.emit("locationRoomJoined", {
      carpoolId,
      message: "Successfully joined carpool location updates",
    });
  } catch (error) {
    console.error("Error in joinCarpoolLocationRoom:", error);
    socket.emit("locationRoomError", {
      message: "Failed to join carpool location updates",
    });
  }
};

export const leaveCarpoolLocationRoom = (
  socket: Socket,
  data: { carpoolId: string; userId: string }
) => {
  try {
    const { carpoolId, userId } = data;

    if (!carpoolId || !userId) {
      socket.emit("locationRoomError", {
        message: "carpoolId and userId are required",
      });
      return;
    }

    // Leave the carpool location room
    socket.leave(`carpool-${carpoolId}`);

    console.log(
      `User ${userId} left location updates for carpool ${carpoolId}`
    );

    socket.emit("locationRoomLeft", {
      carpoolId,
      message: "Successfully left carpool location updates",
    });
  } catch (error) {
    console.error("Error in leaveCarpoolLocationRoom:", error);
    socket.emit("locationRoomError", {
      message: "Failed to leave carpool location updates",
    });
  }
};
