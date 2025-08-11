# Driver Location Update Functionality

This document describes the driver location update functionality implemented using Socket.IO for real-time location sharing in carpools.

## Overview

The driver location feature allows carpool drivers to share their real-time location with carpool members. When a driver starts sharing location, all carpool members receive live updates. When the driver stops sharing or disconnects, the last known location is automatically saved to the database.

## Socket Events

### Driver Events (Emitted by Driver)

#### 1. `startDriverLocation`
Starts real-time location sharing for a carpool.

**Payload:**
```javascript
{
  carpoolId: "string", // MongoDB ObjectId of the carpool
  driverId: "string",  // MongoDB ObjectId of the driver/user
  location: [number, number] // [longitude, latitude]
}
```

**Response Events:**
- `driverLocationStarted`: Success confirmation
- `driverLocationError`: Error message

#### 2. `updateDriverLocation`
Updates the current driver location (sent periodically while driving).

**Payload:**
```javascript
{
  location: [number, number] // [longitude, latitude]
}
```

**Response Events:**
- `driverLocationError`: Error message if update fails

#### 3. `stopDriverLocation`
Stops location sharing and saves the last location to database.

**Payload:** None

**Response Events:**
- `driverLocationStopped`: Confirmation with last known location
- `driverLocationError`: Error message

### Member Events (Emitted by Carpool Members)

#### 1. `joinCarpoolLocation`
Join a carpool's location update room to receive driver location updates.

**Payload:**
```javascript
{
  carpoolId: "string", // MongoDB ObjectId of the carpool
  userId: "string"     // MongoDB ObjectId of the member
}
```

**Response Events:**
- `locationRoomJoined`: Success confirmation
- `locationRoomError`: Error message

#### 2. `leaveCarpoolLocation`
Leave a carpool's location update room.

**Payload:**
```javascript
{
  carpoolId: "string", // MongoDB ObjectId of the carpool
  userId: "string"     // MongoDB ObjectId of the member
}
```

**Response Events:**
- `locationRoomLeft`: Success confirmation
- `locationRoomError`: Error message

### Received Events (For All Carpool Members)

#### 1. `driverLocationUpdate`
Real-time location update from the driver.

**Payload:**
```javascript
{
  carpoolId: "string",
  driverId: "string",
  location: [number, number], // [longitude, latitude]
  timestamp: "Date"
}
```

#### 2. `driverLocationStopped`
Driver stopped sharing location or disconnected.

**Payload:**
```javascript
{
  carpoolId: "string",
  driverId: "string",
  lastKnownLocation: [number, number], // [longitude, latitude]
  timestamp: "Date",
  reason?: "Driver disconnected" // Optional disconnect reason
}
```

## REST API Endpoints

### GET `/api/carpools/:carpoolId/driver-location`
Get the current/last known driver location for a carpool.

**Response:**
```javascript
{
  success: true,
  statusCode: 200,
  message: "Driver location retrieved successfully",
  data: {
    carpoolId: "string",
    eventName: "string",
    driverLocation: [number, number] | null,
    driver: "string" | null,
    lastUpdated: "Date"
  }
}
```

## Frontend Implementation Example

### Driver Side (React/React Native)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

// Start location sharing when driver hits the "Drive" button
const startDriving = async (carpoolId, driverId) => {
  // Get initial location
  navigator.geolocation.getCurrentPosition((position) => {
    const location = [
      position.coords.longitude,
      position.coords.latitude
    ];
    
    // Start location sharing
    socket.emit('startDriverLocation', {
      carpoolId,
      driverId,
      location
    });
  });

  // Start watching position for updates
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const location = [
        position.coords.longitude,
        position.coords.latitude
      ];
      
      // Send location update
      socket.emit('updateDriverLocation', { location });
    },
    (error) => console.error('Location error:', error),
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    }
  );

  return watchId;
};

// Stop location sharing
const stopDriving = (watchId) => {
  navigator.geolocation.clearWatch(watchId);
  socket.emit('stopDriverLocation');
};

// Listen for responses
socket.on('driverLocationStarted', (data) => {
  console.log('Location sharing started:', data);
});

socket.on('driverLocationStopped', (data) => {
  console.log('Location sharing stopped:', data);
});

socket.on('driverLocationError', (error) => {
  console.error('Driver location error:', error.message);
});
```

### Member Side (React/React Native)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

// Join carpool location updates
const joinCarpoolLocationUpdates = (carpoolId, userId) => {
  socket.emit('joinCarpoolLocation', { carpoolId, userId });
};

// Leave carpool location updates
const leaveCarpoolLocationUpdates = (carpoolId, userId) => {
  socket.emit('leaveCarpoolLocation', { carpoolId, userId });
};

// Listen for driver location updates
socket.on('driverLocationUpdate', (data) => {
  console.log('Driver location update:', data);
  // Update map with new driver location
  updateDriverMarkerOnMap(data.location);
});

socket.on('driverLocationStopped', (data) => {
  console.log('Driver stopped sharing location:', data);
  if (data.reason === 'Driver disconnected') {
    showNotification('Driver disconnected');
  }
});

// Listen for room events
socket.on('locationRoomJoined', (data) => {
  console.log('Joined location updates:', data);
});

socket.on('locationRoomError', (error) => {
  console.error('Location room error:', error.message);
});
```

## Security Features

1. **Authorization**: Only carpool drivers or members can start/receive location updates
2. **Validation**: Coordinates are validated for proper longitude/latitude ranges
3. **Auto-cleanup**: Locations are automatically saved when drivers disconnect
4. **Room isolation**: Location updates are only sent to members of the specific carpool

## Database Schema

The carpool model includes a `driverLocation` field:

```javascript
driverLocation: {
  type: [Number],
  required: false,
  validate: {
    validator: function(coords) {
      if (!coords || coords.length === 0) return true;
      return (
        coords.length === 2 &&
        coords[0] >= -180 && coords[0] <= 180 && // longitude
        coords[1] >= -90 && coords[1] <= 90      // latitude
      );
    },
    message: "Coordinates must be [longitude, latitude] with valid ranges",
  },
  default: null,
}
```

## Error Handling

- Invalid coordinates are rejected
- Non-existent carpools return appropriate errors
- Unauthorized users cannot start location sharing
- Connection drops automatically save the last location
- All errors are logged and returned to clients

## Performance Considerations

- Location updates are throttled by the client (recommended 5-10 second intervals)
- Active driver locations are stored in memory for fast access
- Database writes only occur when stopping/disconnecting
- Room-based updates ensure efficient message delivery
