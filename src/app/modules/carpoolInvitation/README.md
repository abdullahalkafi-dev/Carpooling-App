# Carpool Invitation Module

This module handles carpool invitations in the carpooling application, allowing users to invite their contacts to join carpools as either members or drivers.

## Features

- **Send Invitations**: Invite contacts to join carpools as members or drivers
- **Respond to Invitations**: Accept or decline carpool invitations
- **View Invitations**: Get received, sent, and carpool-specific invitations
- **Friend Validation**: Only friends can be invited to carpools
- **Duplicate Prevention**: Prevents duplicate invitations
- **Role-based Invitations**: Support for member and driver invitations
- **Cache Management**: Redis caching for better performance

## API Endpoints

### POST /carpool-invitation/invite
Send invitations to contacts for a carpool.

**Request Body:**
```json
{
  "carpoolId": "64a123456789abcdef123456",
  "inviteeIds": ["64a123456789abcdef123457", "64a123456789abcdef123458"],
  "invitationType": "member", // "member" or "driver"
  "message": "Join my carpool to downtown!"
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
      "_id": "64a123456789abcdef123459",
      "carpool": "64a123456789abcdef123456",
      "inviter": "64a123456789abcdef123460",
      "invitee": "64a123456789abcdef123457",
      "message": "Join my carpool to downtown!",
      "invitationType": "member",
      "status": "pending",
      "createdAt": "2024-06-14T10:00:00.000Z",
      "updatedAt": "2024-06-14T10:00:00.000Z"
    }
  ]
}
```

### PATCH /carpool-invitation/:invitationId/respond
Respond to a carpool invitation.

**Request Body:**
```json
{
  "status": "accepted" // "accepted" or "declined"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Invitation accepted successfully",
  "data": {
    "_id": "64a123456789abcdef123459",
    "carpool": "64a123456789abcdef123456",
    "inviter": "64a123456789abcdef123460",
    "invitee": "64a123456789abcdef123457",
    "status": "accepted",
    "invitationType": "member",
    "createdAt": "2024-06-14T10:00:00.000Z",
    "updatedAt": "2024-06-14T10:05:00.000Z"
  }
}
```

### GET /carpool-invitation/received
Get invitations received by the current user.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (pending, accepted, declined)
- `sort`: Sort field and order (e.g., -createdAt)

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Invitations retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPage": 1
  },
  "data": [
    {
      "_id": "64a123456789abcdef123459",
      "carpool": {
        "_id": "64a123456789abcdef123456",
        "eventName": "Daily Commute to Downtown",
        "startLocation": {
          "title": "Home",
          "coordinates": [-73.935242, 40.730610]
        },
        "endLocation": {
          "title": "Office",
          "coordinates": [-73.986307, 40.748817]
        },
        "startDate": "2024-06-15T08:00:00.000Z",
        "startTime": "2024-06-15T08:00:00.000Z",
        "createdBy": {
          "_id": "64a123456789abcdef123460",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "image": "profile.jpg"
        }
      },
      "inviter": {
        "_id": "64a123456789abcdef123460",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "image": "profile.jpg"
      },
      "message": "Join my carpool to downtown!",
      "invitationType": "member",
      "status": "pending",
      "createdAt": "2024-06-14T10:00:00.000Z"
    }
  ]
}
```

### GET /carpool-invitation/sent
Get invitations sent by the current user.

**Query Parameters:** Same as received invitations

**Response:** Similar structure with invitee information instead of inviter

### GET /carpool-invitation/carpool/:carpoolId
Get all invitations for a specific carpool (only carpool creator can access).

**Query Parameters:** Same as above

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Carpool invitations retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPage": 1
  },
  "data": [
    {
      "_id": "64a123456789abcdef123459",
      "invitee": {
        "_id": "64a123456789abcdef123457",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com",
        "image": "jane.jpg"
      },
      "message": "Join my carpool to downtown!",
      "invitationType": "member",
      "status": "pending",
      "createdAt": "2024-06-14T10:00:00.000Z"
    }
  ]
}
```

## Validation Rules

### Invite to Carpool
- `carpoolId`: Required, valid MongoDB ObjectId
- `inviteeIds`: Required, array of valid MongoDB ObjectIds (1-10 users)
- `invitationType`: Optional, enum ["member", "driver"], defaults to "member"
- `message`: Optional, string (max 500 characters)

### Respond to Invitation
- `status`: Required, enum ["accepted", "declined"]

## Business Logic

### Invitation Creation
1. **Carpool Validation**: Check if carpool exists and user is the creator
2. **Driver Constraint**: Only one driver per carpool (prevent driver invitation if driver exists)
3. **Friendship Validation**: Inviter and invitee must be friends
4. **Duplicate Prevention**: Prevent multiple invitations to same user for same carpool
5. **Membership Check**: Prevent inviting users already in the carpool
6. **Batch Processing**: Process multiple invitees with error collection

### Invitation Response
1. **Authorization**: Only invitee can respond to invitation
2. **Status Check**: Only pending invitations can be responded to
3. **Carpool Update**: On acceptance, add user to carpool as member or driver
4. **Driver Validation**: Ensure carpool doesn't already have a driver when accepting driver invitation

### Data Retrieval
1. **User-specific**: Filter invitations by user role (inviter/invitee)
2. **Carpool-specific**: Only carpool creator can view all invitations for their carpool
3. **Pagination**: Support for paginated results
4. **Population**: Include related user and carpool information

## Error Handling

### Common Errors
- **404 Not Found**: Carpool, invitation, or user not found
- **403 Forbidden**: Unauthorized access to carpool or invitation
- **400 Bad Request**: Invalid data, duplicate invitation, already responded
- **422 Unprocessable Entity**: Validation errors

### Friendship Validation Errors
- Users must be friends before carpool invitations can be sent
- Detailed error messages for each failed invitation attempt

### Driver Constraint Errors
- Prevent multiple drivers for same carpool
- Clear error messages when driver slot is already filled

## Caching Strategy

### Cache Keys
- Individual invitations: `carpoolInvitation:{id}`
- User received invitations: `userReceivedInvitations:{userId}`
- User sent invitations: `userSentInvitations:{userId}`
- Carpool invitations: `carpoolInvitations:{carpoolId}`
- Query-based lists: `carpoolInvitationListWithQuery:{queryHash}`

### Cache Invalidation
- Automatic invalidation on invitation creation, response, or update
- Pattern-based invalidation for user and carpool-specific caches
- TTL: 6 hours for optimal performance and data freshness

## Database Schema

### CarpoolInvitation Model
```typescript
{
  carpool: ObjectId, // Reference to Carpool
  inviter: ObjectId, // Reference to User (carpool creator)
  invitee: ObjectId, // Reference to User (invited user)
  message?: string, // Optional invitation message
  invitationType: "member" | "driver", // Type of invitation
  status: "pending" | "accepted" | "declined", // Invitation status
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `{ carpool: 1, invitee: 1 }` - Unique compound index for duplicate prevention
- `{ invitee: 1, status: 1 }` - For efficient received invitation queries
- `{ inviter: 1, status: 1 }` - For efficient sent invitation queries
- `{ carpool: 1, status: 1 }` - For efficient carpool invitation queries

## Integration Points

### Contact Module
- Uses `Contact.isAlreadyFriends()` for friendship validation
- Ensures only friends can be invited to carpools

### Carpool Module
- Validates carpool existence and ownership
- Updates carpool members/driver on invitation acceptance
- Respects carpool constraints (single driver, member limits)

### User Module
- Validates user existence for invitations
- Populates user information in responses

## Security Considerations

1. **Authorization**: Users can only manage their own invitations
2. **Friendship Requirement**: Prevents spam by requiring friendship
3. **Ownership Validation**: Only carpool creators can send invitations
4. **Input Validation**: Comprehensive validation of all inputs
5. **Rate Limiting**: Consider implementing invitation rate limits

## Performance Optimizations

1. **Caching**: Redis caching for frequently accessed data
2. **Pagination**: Efficient pagination for large datasets
3. **Population**: Selective field population to reduce payload size
4. **Indexing**: Database indexes for optimal query performance
5. **Batch Processing**: Efficient handling of multiple invitations

## Testing Recommendations

### Unit Tests
- Service functions for invitation creation and response
- Validation logic for friendship and carpool constraints
- Cache management operations

### Integration Tests
- Complete invitation workflow (send → respond → carpool update)
- Error handling for various failure scenarios
- Authentication and authorization

### Performance Tests
- Bulk invitation creation
- Cache performance under load
- Database query performance with large datasets
