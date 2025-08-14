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

**Note:** Replace `:carpoolId` with the actual carpool ID in the URL.

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

**Note:** Replace `:carpoolId` with the actual carpool ID in the URL.

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
const socket = io("http://localhost:5000"); // Update port as needed

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

### Complete Chat Integration Example

```javascript
class CarpoolChat {
  constructor(socket, userId) {
    this.socket = socket;
    this.userId = userId;
    this.currentCarpoolId = null;
  }

  // Initialize chat for a specific carpool
  async initializeChat(carpoolId) {
    this.currentCarpoolId = carpoolId;
    
    // Join the carpool room
    this.socket.emit("joinCarpoolRoom", { 
      userId: this.userId, 
      carpoolId: carpoolId 
    });

    // Set up message listener
    this.socket.on(`carpool-message-${carpoolId}`, (data) => {
      this.displayMessage(data);
    });

    // Set up confirmation listeners
    this.socket.on("carpool-message-sent", (data) => {
      this.markMessageAsSent(data);
    });

    this.socket.on("carpool-message-error", (error) => {
      this.handleMessageError(error);
    });

    // Load message history
    try {
      const response = await fetch(`/api/carpool-chat/carpool/${carpoolId}/messages?page=1&limit=50`);
      const messageHistory = await response.json();
      this.loadMessageHistory(messageHistory.data.messages);
    } catch (error) {
      console.error("Failed to load message history:", error);
    }
  }

  // Send a text message
  sendMessage(message) {
    if (!this.currentCarpoolId || !message.trim()) return;
    
    this.socket.emit("sendCarpoolMessage", {
      carpoolId: this.currentCarpoolId,
      senderId: this.userId,
      message: message.trim()
    });
  }

  // Send message with image
  async sendMessageWithImage(message, imageFile) {
    if (!this.currentCarpoolId) return;

    const formData = new FormData();
    formData.append('data', JSON.stringify({
      carpoolId: this.currentCarpoolId,
      senderId: this.userId,
      message: message || ""
    }));
    formData.append('image', imageFile);

    try {
      const response = await fetch('/api/carpool-chat/carpool/message-with-image', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      console.log("Image message sent:", result);
    } catch (error) {
      console.error("Failed to send image message:", error);
    }
  }

  // Clean up when leaving chat
  leaveChat() {
    if (this.currentCarpoolId) {
      this.socket.emit("leaveCarpoolRoom", {
        userId: this.userId,
        carpoolId: this.currentCarpoolId
      });
      
      // Remove listeners
      this.socket.off(`carpool-message-${this.currentCarpoolId}`);
      this.socket.off("carpool-message-sent");
      this.socket.off("carpool-message-error");
      
      this.currentCarpoolId = null;
    }
  }

  // Helper methods (implement based on your UI framework)
  displayMessage(messageData) {
    // Implementation depends on your frontend framework
    console.log("New message:", messageData);
  }

  markMessageAsSent(messageData) {
    // Update UI to show message was sent successfully
    console.log("Message sent successfully:", messageData);
  }

  handleMessageError(error) {
    // Handle and display error to user
    console.error("Message error:", error);
  }

  loadMessageHistory(messages) {
    // Load and display previous messages
    messages.forEach(message => this.displayMessage(message));
  }
}

// Usage
const socket = io("http://localhost:5000");
const userId = "current_user_id";
const carpoolChat = new CarpoolChat(socket, userId);

// When user opens a carpool chat
carpoolChat.initializeChat("carpool_id_here");

// When user closes the chat
carpoolChat.leaveChat();
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

## Testing the API

### Using curl or Postman

1. **Get Carpool Messages:**
```bash
curl -X GET "http://localhost:5000/api/carpool-chat/carpool/{CARPOOL_ID}/messages?page=1&limit=10"
```

2. **Get Carpool Members:**
```bash
curl -X GET "http://localhost:5000/api/carpool-chat/carpool/{CARPOOL_ID}/members"
```

3. **Send Message with Image:**
```bash
curl -X POST "http://localhost:5000/api/carpool-chat/carpool/message-with-image" \
  -F "data={\"carpoolId\":\"CARPOOL_ID\",\"senderId\":\"USER_ID\",\"message\":\"Test message\"}" \
  -F "image=@/path/to/image.jpg"
```

### Testing Socket Events

```javascript
// Test in browser console
const socket = io("http://localhost:5000");

// Test joining room
socket.emit("joinCarpoolRoom", {
  userId: "USER_ID",
  carpoolId: "CARPOOL_ID"
});

// Test sending message
socket.emit("sendCarpoolMessage", {
  carpoolId: "CARPOOL_ID",
  senderId: "USER_ID",
  message: "Hello everyone!"
});
```
