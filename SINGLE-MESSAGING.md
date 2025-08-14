# Direct User Messaging System

This document explains how to use the direct messaging system that allows users to send private messages to each other one-on-one.

## Features

- ✅ One-to-one private messaging between users
- ✅ Real-time message delivery via WebSocket
- ✅ Image sharing support
- ✅ Message persistence in database
- ✅ Message read tracking and status
- ✅ Online user status tracking
- ✅ REST API endpoints for message history
- ✅ Active chat session management

## Socket Events

### Client to Server Events

#### 1. Register User Online
```javascript
socket.emit("register", "user_id_here");
```

#### 2. Send Direct Message
```javascript
socket.emit("sendMessage", {
  senderId: "sender_id_here",
  receiverId: "receiver_id_here",
  message: "Hello there!",
  image: null // optional
});
```

#### 3. Mark Messages as Read
```javascript
socket.emit("markAsRead", {
  senderId: "sender_id_here",
  receiverId: "receiver_id_here"
});
```

#### 4. Set Active Chat Session
```javascript
// When user opens a chat with someone
socket.emit("activeChat", {
  senderId: "current_user_id",
  receiverId: "chat_partner_id"
});

// When user closes/leaves the chat
socket.emit("activeChat", {
  receiverId: "chat_partner_id"
  // Note: senderId is omitted to indicate leaving chat
});
```

### Server to Client Events

#### 1. Online Users List
```javascript
socket.on("onlineUsers", (userIds) => {
  console.log("Online users:", userIds);
  // userIds is an array of user IDs who are currently online
});
```

#### 2. Receive Direct Message
```javascript
socket.on("receiver-{userId}", (data) => {
  console.log("New message received:", data);
  // data contains: _id, senderId, receiverId, message, image, isRead, createAt
});
```

#### 3. Message Sent Confirmation
```javascript
socket.on("message-sent", (data) => {
  console.log("Message sent successfully:", data);
  // data contains: _id, senderId, receiverId, message, image, isRead, createAt, status
});
```

#### 4. Messages Read Confirmation
```javascript
socket.on("messages-read", (data) => {
  console.log("Messages marked as read:", data);
  // data contains: senderId, receiverId, isRead
});
```

#### 5. Error Handling
```javascript
socket.on("error", (error) => {
  console.error("Message error:", error);
});
```

## REST API Endpoints

### 1. Get Messages Between Two Users
```
GET /api/message/messages?senderId=SENDER_ID&receiverId=RECEIVER_ID&page=1&limit=50
```

**Note:** Both senderId and receiverId are required query parameters.

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "message_id",
      "sender": {
        "_id": "sender_id",
        "firstName": "John",
        "lastName": "Doe",
        "image": "/images/user.jpg"
      },
      "receiver": {
        "_id": "receiver_id",
        "firstName": "Jane",
        "lastName": "Smith",
        "image": "/images/user2.jpg"
      },
      "message": "Hello there!",
      "image": null,
      "isRead": false,
      "createdAt": "2025-08-14T10:00:00.000Z",
      "updatedAt": "2025-08-14T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPage": 1
  }
}
```

### 2. Send Message with Image
```
POST /api/message/message-with-image
Content-Type: multipart/form-data

Fields:
- data: JSON string with { senderId, receiverId, message }
- image: File upload
```

Response:
```json
{
  "success": true,
  "message": "Message created successfully",
  "data": {
    "_id": "message_id",
    "sender": "sender_id",
    "receiver": "receiver_id",
    "message": "Check out this image!",
    "image": "/images/filename.jpg",
    "isRead": false,
    "createdAt": "2025-08-14T10:00:00.000Z"
  }
}
```

## Usage Example

### Frontend Implementation

```javascript
// Initialize socket connection
const socket = io("http://localhost:5000"); // Update port as needed

// Register user as online when app starts
const registerUserOnline = (userId) => {
  socket.emit("register", userId);
};

// Listen for online users updates
socket.on("onlineUsers", (userIds) => {
  // Update UI to show who's online
  updateOnlineStatus(userIds);
});

// Listen for incoming messages
const setupMessageListener = (currentUserId) => {
  socket.on(`receiver-${currentUserId}`, (data) => {
    // Display the new message in chat UI
    displayIncomingMessage(data);
    
    // Auto-mark as read if user is actively viewing this chat
    if (isActiveChatWith(data.senderId)) {
      markMessagesAsRead(currentUserId, data.senderId);
    }
  });
};

// Send a direct message
const sendDirectMessage = (senderId, receiverId, message) => {
  socket.emit("sendMessage", {
    senderId,
    receiverId,
    message
  });
};

// Mark messages as read
const markMessagesAsRead = (currentUserId, chatPartnerId) => {
  socket.emit("markAsRead", {
    senderId: chatPartnerId,
    receiverId: currentUserId
  });
};

// Set active chat session
const setActiveChat = (currentUserId, chatPartnerId) => {
  socket.emit("activeChat", {
    senderId: currentUserId,
    receiverId: chatPartnerId
  });
};

// Clear active chat session
const clearActiveChat = (chatPartnerId) => {
  socket.emit("activeChat", {
    receiverId: chatPartnerId
  });
};
```

### Complete Direct Messaging Integration

```javascript
class DirectMessaging {
  constructor(socket, currentUserId) {
    this.socket = socket;
    this.currentUserId = currentUserId;
    this.activeChatPartner = null;
    this.onlineUsers = [];
    
    this.initialize();
  }

  initialize() {
    // Register user as online
    this.socket.emit("register", this.currentUserId);

    // Set up event listeners
    this.socket.on("onlineUsers", (userIds) => {
      this.onlineUsers = userIds;
      this.updateOnlineStatus(userIds);
    });

    this.socket.on(`receiver-${this.currentUserId}`, (data) => {
      this.handleIncomingMessage(data);
    });

    this.socket.on("message-sent", (data) => {
      this.handleMessageSent(data);
    });

    this.socket.on("messages-read", (data) => {
      this.handleMessagesRead(data);
    });

    this.socket.on("error", (error) => {
      this.handleError(error);
    });
  }

  // Start a chat with a specific user
  async startChat(userId) {
    this.activeChatPartner = userId;
    
    // Set active chat session
    this.socket.emit("activeChat", {
      senderId: this.currentUserId,
      receiverId: userId
    });

    // Load chat history
    try {
      const response = await fetch(
        `/api/message/messages?senderId=${this.currentUserId}&receiverId=${userId}&page=1&limit=50`
      );
      const messageHistory = await response.json();
      this.loadMessageHistory(messageHistory.data);
      
      // Mark existing messages as read
      this.markMessagesAsRead(userId);
    } catch (error) {
      console.error("Failed to load message history:", error);
    }
  }

  // End current chat session
  endChat() {
    if (this.activeChatPartner) {
      // Clear active chat session
      this.socket.emit("activeChat", {
        receiverId: this.activeChatPartner
      });
      
      this.activeChatPartner = null;
    }
  }

  // Send a text message
  sendMessage(receiverId, message) {
    if (!message.trim()) return;
    
    this.socket.emit("sendMessage", {
      senderId: this.currentUserId,
      receiverId: receiverId,
      message: message.trim()
    });
  }

  // Send message with image
  async sendMessageWithImage(receiverId, message, imageFile) {
    const formData = new FormData();
    formData.append('data', JSON.stringify({
      senderId: this.currentUserId,
      receiverId: receiverId,
      message: message || ""
    }));
    formData.append('image', imageFile);

    try {
      const response = await fetch('/api/message/message-with-image', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      console.log("Image message sent:", result);
    } catch (error) {
      console.error("Failed to send image message:", error);
    }
  }

  // Mark messages as read
  markMessagesAsRead(senderId) {
    this.socket.emit("markAsRead", {
      senderId: senderId,
      receiverId: this.currentUserId
    });
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.onlineUsers.includes(userId);
  }

  // Event handlers
  handleIncomingMessage(data) {
    this.displayMessage(data, 'incoming');
    
    // Auto-mark as read if this is the active chat
    if (this.activeChatPartner === data.senderId) {
      this.markMessagesAsRead(data.senderId);
    } else {
      // Show notification for inactive chats
      this.showNotification(data);
    }
  }

  handleMessageSent(data) {
    this.displayMessage(data, 'sent');
    this.markMessageAsDelivered(data._id);
  }

  handleMessagesRead(data) {
    // Update UI to show messages were read
    this.markMessagesAsReadInUI(data.senderId, data.receiverId);
  }

  handleError(error) {
    console.error("Messaging error:", error);
    this.showErrorMessage(error.message);
  }

  // UI helper methods (implement based on your frontend framework)
  displayMessage(messageData, type) {
    console.log(`${type} message:`, messageData);
    // Implementation depends on your UI framework
  }

  loadMessageHistory(messages) {
    messages.forEach(message => {
      this.displayMessage(message, message.sender._id === this.currentUserId ? 'sent' : 'received');
    });
  }

  updateOnlineStatus(onlineUserIds) {
    // Update UI to show online status indicators
    console.log("Online users updated:", onlineUserIds);
  }

  showNotification(messageData) {
    // Show push notification or badge for new messages
    console.log("New message notification:", messageData);
  }

  markMessageAsDelivered(messageId) {
    // Update UI to show message was delivered
    console.log("Message delivered:", messageId);
  }

  markMessagesAsReadInUI(senderId, receiverId) {
    // Update UI to show messages were read (read receipts)
    console.log("Messages read by:", receiverId);
  }

  showErrorMessage(message) {
    // Display error to user
    console.error("Error:", message);
  }
}

// Usage
const socket = io("http://localhost:5000");
const currentUserId = "current_user_id";
const messaging = new DirectMessaging(socket, currentUserId);

// Start a chat with a user
messaging.startChat("other_user_id");

// Send a message
messaging.sendMessage("other_user_id", "Hello!");

// End the chat
messaging.endChat();
```

## Security Notes

- Message validation is performed server-side before processing
- Socket events include validation to prevent malicious data
- User authentication should be implemented before allowing messaging
- Rate limiting should be considered for message sending

## Database Schema

The direct messages are stored in a `Message` collection with the following structure:

```javascript
{
  sender: ObjectId,           // Reference to user who sent message
  receiver: ObjectId,         // Reference to user who receives message
  message: String,            // Text content (optional)
  image: String,              // Image URL (optional)
  isRead: Boolean,            // Whether message has been read
  createdAt: Date,            // Auto-generated timestamp
  updatedAt: Date             // Auto-generated timestamp
}
```

## Error Handling

The system includes comprehensive error handling for:
- Invalid sender/receiver IDs
- Missing required fields (senderId, receiverId)
- Messages with neither text nor image content
- Database connection issues
- Socket connection problems

All errors are logged server-side and appropriate error messages are sent to clients via socket events.

## Testing the API

### Using curl or Postman

1. **Get Messages Between Users:**
```bash
curl -X GET "http://localhost:5000/api/message/messages?senderId=USER_ID_1&receiverId=USER_ID_2&page=1&limit=10"
```

2. **Send Message with Image:**
```bash
curl -X POST "http://localhost:5000/api/message/message-with-image" \
  -F "data={\"senderId\":\"USER_ID_1\",\"receiverId\":\"USER_ID_2\",\"message\":\"Test message\"}" \
  -F "image=@/path/to/image.jpg"
```

### Testing Socket Events

```javascript
// Test in browser console
const socket = io("http://localhost:5000");

// Register user
socket.emit("register", "USER_ID");

// Test sending message
socket.emit("sendMessage", {
  senderId: "USER_ID_1",
  receiverId: "USER_ID_2",
  message: "Hello!"
});

// Test marking messages as read
socket.emit("markAsRead", {
  senderId: "USER_ID_2",
  receiverId: "USER_ID_1"
});

// Listen for responses
socket.on("onlineUsers", (users) => console.log("Online:", users));
socket.on("receiver-USER_ID_1", (data) => console.log("New message:", data));
socket.on("message-sent", (data) => console.log("Sent:", data));
```

## Message Flow Example

1. **User A wants to message User B:**
   - User A opens chat with User B
   - `startChat(userB_id)` is called
   - Socket emits `activeChat` event
   - Previous messages are loaded via API
   - Existing unread messages are marked as read

2. **User A sends a message:**
   - `sendMessage(userB_id, "Hello")` is called
   - Socket emits `sendMessage` event
   - Server validates and saves message to database
   - Server sends message to User B if online
   - Server sends confirmation to User A

3. **User B receives the message:**
   - User B's socket receives `receiver-{userB_id}` event
   - Message is displayed in UI
   - If User B is actively viewing the chat, message is auto-marked as read
   - If not, a notification is shown

4. **User B reads the message:**
   - When User B views the chat, `markAsRead` is emitted
   - Server updates message status in database
   - Server notifies User A via `messages-read` event
   - User A's UI shows read receipt

This comprehensive documentation should give your frontend developer everything they need to implement the direct messaging feature! 🚀
