# Carpool Invitation System

This feature allows users to invite their contacts (friends) to join their carpools. The system integrates with the contact module to ensure only accepted friends can be invited.

## Features

- Invite multiple contacts to a carpool at once
- Only accepted friends can be invited
- Prevent duplicate invitations
- Accept or decline carpool invitations
- View received and sent invitations
- Automatic seat management for drive carpools
- View all invitations for a specific carpool

## API Endpoints

### Base URL: `/api/v1/carpool`

### 1. Get Contacts Available for Invitation
**GET** `/api/v1/contact/invitation-contacts`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Contacts for invitation retrieved successfully",
  "data": [
    {
      "_id": "60d5f1234567890abcdef456",
      "friend": {
        "_id": "60d5f1234567890abcdef789",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "image": "/images/john.jpg"
      },
      "status": "accepted",
      "createdAt": "2025-05-28T10:00:00.000Z"
    }
  ]
}
```

### 2. Invite Contacts to Carpool
**POST** `/invite`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "carpoolId": "60d5f1234567890abcdef123",
  "inviteeIds": [
    "60d5f1234567890abcdef789",
    "60d5f1234567890abcdef456"
  ],
  "message": "Hey! Want to join my carpool to the office?"
}
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Successfully sent 2 invitation(s)",
  "data": [
    {
      "_id": "60d5f1234567890abcdef999",
      "carpool": "60d5f1234567890abcdef123",
      "inviter": "60d5f1234567890abcdef111",
      "invitee": "60d5f1234567890abcdef789",
      "status": "pending",
      "message": "Hey! Want to join my carpool to the office?",
      "createdAt": "2025-05-28T12:00:00.000Z"
    }
  ]
}
```

### 3. Respond to Carpool Invitation
**PATCH** `/invitation/:invitationId/respond`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "status": "accepted" // or "declined"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Invitation accepted successfully",
  "data": {
    "_id": "60d5f1234567890abcdef999",
    "carpool": "60d5f1234567890abcdef123",
    "inviter": "60d5f1234567890abcdef111",
    "invitee": "60d5f1234567890abcdef789",
    "status": "accepted",
    "message": "Hey! Want to join my carpool to the office?",
    "createdAt": "2025-05-28T12:00:00.000Z",
    "updatedAt": "2025-05-28T12:05:00.000Z"
  }
}
```

### 4. Get My Received Invitations
**GET** `/invitations/received`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page
- `status` (optional): Filter by status (pending, accepted, declined)

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Invitations retrieved successfully",
  "data": [
    {
      "_id": "60d5f1234567890abcdef999",
      "carpool": {
        "_id": "60d5f1234567890abcdef123",
        "eventName": "Office Commute",
        "startLocation": "Downtown",
        "endLocation": "Tech Park",
        "startDate": "2025-05-29T08:00:00.000Z",
        "user": {
          "_id": "60d5f1234567890abcdef111",
          "firstName": "Jane",
          "lastName": "Smith",
          "email": "jane@example.com",
          "image": "/images/jane.jpg"
        }
      },
      "inviter": {
        "_id": "60d5f1234567890abcdef111",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com",
        "image": "/images/jane.jpg"
      },
      "status": "pending",
      "message": "Hey! Want to join my carpool to the office?",
      "createdAt": "2025-05-28T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPage": 1,
    "total": 1
  }
}
```

### 5. Get My Sent Invitations
**GET** `/invitations/sent`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Sent invitations retrieved successfully",
  "data": [
    {
      "_id": "60d5f1234567890abcdef999",
      "carpool": {
        "_id": "60d5f1234567890abcdef123",
        "eventName": "Office Commute",
        "startLocation": "Downtown",
        "endLocation": "Tech Park",
        "startDate": "2025-05-29T08:00:00.000Z"
      },
      "invitee": {
        "_id": "60d5f1234567890abcdef789",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "image": "/images/john.jpg"
      },
      "status": "pending",
      "message": "Hey! Want to join my carpool to the office?",
      "createdAt": "2025-05-28T12:00:00.000Z"
    }
  ]
}
```

### 6. Get Invitations for Specific Carpool
**GET** `/:carpoolId/invitations`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Carpool invitations retrieved successfully",
  "data": [
    {
      "_id": "60d5f1234567890abcdef999",
      "invitee": {
        "_id": "60d5f1234567890abcdef789",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "image": "/images/john.jpg"
      },
      "status": "pending",
      "message": "Hey! Want to join my carpool to the office?",
      "createdAt": "2025-05-28T12:00:00.000Z"
    }
  ]
}
```

## Database Schema

### CarpoolInvitation Model
```typescript
{
  carpool: ObjectId, // Reference to Carpool
  inviter: ObjectId, // User who sent the invitation
  invitee: ObjectId, // User who received the invitation
  status: "pending" | "accepted" | "declined",
  message?: string, // Optional invitation message
  createdAt: Date,
  updatedAt: Date
}
```

## Business Rules

1. **Friend Requirement**: Only users who are friends (accepted contacts) can be invited
2. **Carpool Ownership**: Only carpool creators can send invitations for their carpools
3. **Duplicate Prevention**: Cannot send multiple invitations to the same user for the same carpool
4. **Seat Management**: For "Drive" carpools, accepting an invitation reduces available seats
5. **Response Permission**: Only invitees can respond to invitations sent to them
6. **Status Lock**: Once responded to, invitation status cannot be changed
7. **Bulk Invitation**: Can invite up to 10 people at once
8. **Message Limit**: Invitation messages cannot exceed 500 characters

## Validation

### Invite to Carpool
- `carpoolId`: Required, valid ObjectId
- `inviteeIds`: Required array of valid ObjectIds (1-10 items)
- `message`: Optional string (max 500 characters)

### Respond to Invitation
- `status`: Required, must be "accepted" or "declined"
- `invitationId`: Required, valid ObjectId in URL params

## Error Handling

Common error scenarios:
- Carpool not found
- Not carpool owner
- User not found
- Not friends with invitee
- Duplicate invitation
- No available seats
- Invitation already responded to
- Permission violations

## Integration Points

1. **Contact Module**: Validates friendship status before sending invitations
2. **Carpool Module**: Updates seat counts and validates carpool ownership
3. **User Module**: Validates user existence and retrieves user details
4. **Authentication**: Ensures proper user authorization for all operations

## Usage Flow

1. **Get Friends**: Use `/api/v1/contact/invitation-contacts` to get available friends
2. **Send Invitations**: Use `/api/v1/carpool/invite` with friend IDs
3. **Check Status**: Use `/api/v1/carpool/invitations/sent` to see invitation status
4. **Respond**: Recipients use `/api/v1/carpool/invitation/:id/respond`
5. **Track**: Use `/api/v1/carpool/:carpoolId/invitations` to see all responses

## Indexes

- Compound unique index on `carpool` and `invitee`
- Index on `status`
- Index on `inviter` and `status`
- Index on `invitee` and `status`
- Index on `carpool` and `status`
