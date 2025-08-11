# Carpool Group Messaging System

This document explains how to use the carpool group messaging system that allows all members of a carpool to communicate with each other.

## Features

- ✅ Group messaging for carpool members
- ✅ Real-time message delivery via WebSocket
- ✅ Image sharing support
- ✅ Message persistence in database
- ✅ Member verification (only carpool members can send/receive messages)
- ✅ Message read tracking
- ✅ REST API endpoints for message history

## Socket Events

### Client to Server Events

#### 1. Join Carpool Room
```javascript
socket.emit("joinCarpoolRoom", {
  userId: "user_id_here",
  carpoolId: "carpool_id_here"
});
```

#### 2. Send Carpool Message
```javascript
socket.emit("sendCarpoolMessage", {
  carpoolId: "carpool_id_here",
  senderId: "sender_id_here",
  message: "Hello everyone!",
  image: null // optional
});
```

#### 3. Leave Carpool Room
```javascript
socket.emit("leaveCarpoolRoom", {
  userId: "user_id_here",
  carpoolId: "carpool_id_here"
});
```

### Server to Client Events

#### 1. Carpool Room Joined
```javascript
socket.on("carpool-room-joined", (data) => {
  console.log("Joined carpool room:", data.carpoolId);
});
```

#### 2. Receive Carpool Message
```javascript
socket.on("carpool-message-{carpoolId}", (data) => {
  console.log("New carpool message:", data);
  // data contains: _id, carpoolId, senderId, message, image, createAt, sender
});
```

#### 3. Message Sent Confirmation
```javascript
socket.on("carpool-message-sent", (data) => {
  console.log("Message sent successfully:", data);
});
```

#### 4. Error Handling
```javascript
socket.on("carpool-message-error", (error) => {
  console.error("Carpool message error:", error);
});
```

## REST API Endpoints

### 1. Get Carpool Messages
```
GET /api/carpool-chat/carpool/:carpoolId/messages?page=1&limit=50
```

Response:
```json
{
  "success": true,
  "data": {
    "messages": [...],
    "carpoolInfo": {
      "_id": "carpool_id",
      "eventName": "Morning School Run"
    }
  },
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPage": 1
  }
}
```

### 2. Get Carpool Members
```
GET /api/carpool-chat/carpool/:carpoolId/members
```

Response:
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "_id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "image": "/images/user.jpg"
      }
    ],
    "carpoolInfo": {
      "_id": "carpool_id",
      "eventName": "Morning School Run"
    }
  }
}
```

### 3. Send Message with Image
```
POST /api/carpool-chat/carpool/message-with-image
Content-Type: multipart/form-data

Fields:
- data: JSON string with { carpoolId, senderId, message }
- image: File upload
```

## Usage Example

### Frontend Implementation

```javascript
// Initialize socket connection
const socket = io("http://localhost:5007");

// Join carpool room when user opens carpool chat
const joinCarpoolChat = (userId, carpoolId) => {
  socket.emit("joinCarpoolRoom", { userId, carpoolId });
};

// Listen for new messages
const setupCarpoolMessageListener = (carpoolId) => {
  socket.on(`carpool-message-${carpoolId}`, (data) => {
    // Add message to chat UI
    displayMessage(data);
  });
};

// Send a message
const sendCarpoolMessage = (carpoolId, senderId, message) => {
  socket.emit("sendCarpoolMessage", {
    carpoolId,
    senderId,
    message
  });
};

// Leave carpool room when user closes chat
const leaveCarpoolChat = (userId, carpoolId) => {
  socket.emit("leaveCarpoolRoom", { userId, carpoolId });
};
```

## Security Notes

- Only verified carpool members can send/receive messages
- User membership is checked server-side before allowing message sending
- Socket events include validation to prevent malicious data

## Database Schema

The carpool messages are stored in a `CarpoolMessage` collection with the following structure:

```javascript
{
  carpoolId: ObjectId,        // Reference to carpool
  sender: ObjectId,           // Reference to user who sent message
  message: String,            // Text content (optional)
  image: String,              // Image URL (optional)
  readBy: [ObjectId],         // Array of users who read the message
  createdAt: Date,            // Auto-generated timestamp
  updatedAt: Date             // Auto-generated timestamp
}
```

## Error Handling

The system includes comprehensive error handling for:
- Invalid carpool IDs
- Non-member users trying to send messages
- Missing required fields
- Database connection issues
- Socket connection problems

All errors are logged server-side and appropriate error messages are sent to clients via socket events.
