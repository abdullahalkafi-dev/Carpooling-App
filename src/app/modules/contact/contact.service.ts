import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { TContact, TReturnContact } from "./contact.interface";
import { Contact } from "./contact.model";
import { User } from "../user/user.model";
import ContactCacheManage from "./contact.cacheManage";

const sendContactRequest = async (
  requesterId: string,
  recipientId: string
): Promise<TContact> => {
  // Check if requester exists
  const requester = await User.findById(requesterId);
  if (!requester) {
    throw new AppError(StatusCodes.NOT_FOUND, "Requester not found");
  }
  console.log(recipientId);
  // Check if recipient exists
  const recipient = await User.findById(recipientId);
  console.log(recipient);
  if (!recipient) {
    throw new AppError(StatusCodes.NOT_FOUND, "Recipient not found");
  }

  // Check if user is trying to send request to themselves
  if (requesterId === recipientId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You cannot send friend request to yourself"
    );
  }

  // Check if contact already exists
  const existingContact = await Contact.isContactExists(
    requesterId,
    recipientId
  );
  console.log(existingContact);
  if (existingContact) {
    if (existingContact.status === "pending") {
      throw new AppError(StatusCodes.CONFLICT, "Friend request already sent");
    }
    if (existingContact.status === "accepted") {
      throw new AppError(StatusCodes.CONFLICT, "You are already friends");
    }
    if (existingContact.status === "blocked") {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Cannot send request to blocked user"
      );
    }
  }

  // Create new contact request
  const newContact = await Contact.create({
    requester: requesterId,
    recipient: recipientId,
    status: "pending",
  });

  // Clear cache for both users
  await ContactCacheManage.clearContactCache(requesterId, recipientId);

  return newContact;
};

const respondToContactRequest = async (
  requestId: string,
  recipientId: string,
  status: "accepted" | "blocked"
): Promise<TContact> => {
  console.log(requestId, recipientId, status);
  // Find the contact request
  const contactRequest = await Contact.findById(requestId);
  if (!contactRequest) {
    throw new AppError(StatusCodes.NOT_FOUND, "Contact request not found");
  }

  // Check if the current user is the recipient
  if (contactRequest.recipient.toString() !== recipientId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only respond to requests sent to you"
    );
  }

  // Check if request is still pending
  if (contactRequest.status !== "pending") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This request has already been responded to"
    );
  }

  // Update the contact request
  contactRequest.status = status;
  await contactRequest.save();

  // Clear cache for both users
  await ContactCacheManage.clearContactCache(
    contactRequest.requester.toString(),
    contactRequest.recipient.toString()
  );

  return contactRequest;
};

const getContactsByUser = async (
  userId: string,
  query: Record<string, unknown>
): Promise<TReturnContact.getAllContacts> => {
  // Get contacts where user is either requester or recipient and status is accepted
  const contactQuery = Contact.find({
    $or: [
      { requester: userId, status: "accepted" },
      { recipient: userId, status: "accepted" },
    ],
  })
    .populate([
      {
        path: "requester",
        select: " firstName  lastName email image",
      },
      {
        path: "recipient",
        select: " firstName  lastName email image",
      },
    ])
    .lean();

  const queryBuilder = new QueryBuilder(contactQuery, query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await queryBuilder.modelQuery;
  console.time("getContactsByUser");
  const meta = await queryBuilder.countTotal();
  console.timeEnd("getContactsByUser");

  return { result, meta };
};

const getPendingRequests = async (
  userId: string,
  query: Record<string, unknown>
): Promise<TReturnContact.getAllContacts> => {
  // Get pending requests sent to the user
  const requestQuery = Contact.find({
    recipient: userId,
    status: "pending",
  }).populate([
    {
      path: "requester",
      select: "firstName lastName email image",
    },
  ]);

  const queryBuilder = new QueryBuilder(requestQuery, query)
    .filter()
    .sort()
    .paginate()
    .fields();

  // const result = await queryBuilder.modelQuery;
  // const meta = await queryBuilder.countTotal();
  const [result, meta] = await Promise.all([
    queryBuilder.modelQuery,
    queryBuilder.countTotal(),
  ]);
  console.log(result);
  return { result, meta };
};

const getSentRequests = async (
  userId: string,
  query: Record<string, unknown>
): Promise<TReturnContact.getAllContacts> => {
  // Get pending requests sent by the user
  const requestQuery = Contact.find({
    requester: userId,
    status: "pending",
  }).populate([
    {
      path: "recipient",
      select: "firstName lastName email image",
    },
  ]);

  const queryBuilder = new QueryBuilder(requestQuery, query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();

  return { result, meta };
};

const removeContact = async (
  contactId: string,
  userId: string
): Promise<void> => {
  // Find the contact
  const contact = await Contact.findById(contactId);
  if (!contact) {
    throw new AppError(StatusCodes.NOT_FOUND, "Contact not found");
  }

  // Check if user is part of this contact
  if (
    contact.requester.toString() !== userId &&
    contact.recipient.toString() !== userId
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only remove your own contacts"
    );
  }

  // Remove the contact
  await Contact.findByIdAndDelete(contactId);

  // Clear cache for both users
  await ContactCacheManage.clearContactCache(
    contact.requester.toString(),
    contact.recipient.toString()
  );
};

const blockUnblockContact = async (
  contactId: string,
  userId: string,
  action: "block" | "unblock"
): Promise<TContact> => {
  // Find the contact
  const contact = await Contact.findById(contactId);
  if (!contact) {
    throw new AppError(StatusCodes.NOT_FOUND, "Contact not found");
  }

  // Check if user is part of this contact
  if (
    contact.requester.toString() !== userId &&
    contact.recipient.toString() !== userId
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only modify your own contacts"
    );
  }

  // Update status
  if (action === "block") {
    contact.status = "blocked";
  } else {
    contact.status = "accepted";
  }

  await contact.save();

  // Clear cache for both users
  await ContactCacheManage.clearContactCache(
    contact.requester.toString(),
    contact.recipient.toString()
  );

  return contact;
};

const getContactsForInvitation = async (
  userId: string,
  query: Record<string, unknown>
): Promise<TReturnContact.getAllContacts> => {
  // Get only accepted contacts for invitation purposes
  const contactQuery = Contact.find({
    $or: [
      { requester: userId, status: "accepted" },
      { recipient: userId, status: "accepted" },
    ],
  }).populate([
    {
      path: "requester",
      select: "firstName lastName email image",
    },
    {
      path: "recipient",
      select: "firstName lastName email image",
    },
  ]);

  const queryBuilder = new QueryBuilder(contactQuery, query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();

  // Transform the result to show the friend (not the current user)
  const transformedResult = result.map((contact: any) => {
    const friend =
      contact.requester._id.toString() === userId
        ? contact.recipient
        : contact.requester;

    return {
      ...contact.toObject(),
      friend,
    };
  });

  return { result: transformedResult, meta };
};
const getNearbyUsers = async (userId: string, maxDistance: number) => {
  // Find users within the specified radius
  const user: any = await User.findById(userId)
    .populate("address")
    .lean();
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (
    !user.address ||
    !user.address.location ||
    !user.address.location.coordinates ||
    user.address.location.coordinates.length !== 2
  ) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User location not set");
  }
  
  const coordinates = user.address.location.coordinates;
  const radiusInRadians = maxDistance / 6378100; // Convert meters to radians (Earth radius in meters)

  // Get all existing contacts (accepted, pending, blocked) for this user
  const existingContacts = await Contact.find({
    $or: [
      { requester: userId },
      { recipient: userId },
    ],
  }).lean();

  // Extract user IDs from existing contacts
  const contactUserIds = existingContacts.map(contact => {
    return contact.requester.toString() === userId 
      ? contact.recipient 
      : contact.requester;
  });

  // Find users within the specified radius using aggregation pipeline
  const nearbyUsers = await User.aggregate([
    {
      $match: {
        _id: { 
          $ne: user._id, // Exclude the current user
          $nin: contactUserIds // Exclude existing contacts
        },
        address: { $ne: null }, // Ensure user has an address
      },
    },
    {
      $lookup: {
        from: "addresses",
        localField: "address",
        foreignField: "_id",
        as: "address",
      },
    },
    {
      $unwind: "$address",
    },
    {
      $match: {
        "address.location": {
          $geoWithin: {
            $centerSphere: [coordinates, radiusInRadians],
          },
        },
      },
    },
    {
      $addFields: {
        // Calculate distance in meters using the haversine formula
        distance: {
          $multiply: [
            6378100, // Earth radius in meters
            {
              $acos: {
                $add: [
                  {
                    $multiply: [
                      { $sin: { $degreesToRadians: { $arrayElemAt: [coordinates, 1] } } },
                      { $sin: { $degreesToRadians: { $arrayElemAt: ["$address.location.coordinates", 1] } } }
                    ]
                  },
                  {
                    $multiply: [
                      { $cos: { $degreesToRadians: { $arrayElemAt: [coordinates, 1] } } },
                      { $cos: { $degreesToRadians: { $arrayElemAt: ["$address.location.coordinates", 1] } } },
                      { $cos: { 
                        $degreesToRadians: {
                          $subtract: [
                            { $arrayElemAt: ["$address.location.coordinates", 0] },
                            { $arrayElemAt: [coordinates, 0] }
                          ]
                        }
                      }}
                    ]
                  }
                ]
              }
            }
          ]
        }
      }
    },
    {
      $project: {
        userId: "$_id",
        name: { $concat: ["$firstName", " ", "$lastName"] },
        locationTitle: "$address.address",
         // Convert to km and round to 2 decimal places
          image: 1,
          email: 1,
          phone: { $ifNull: ["$phone", null] },
          distance: { $round: [{ $divide: ["$distance", 1000] }, 2] }, // Convert to km
          createdAt: 1,
              },
            },
            {
              $sort: { distance: 1 }
        }
  ]);

  return { result: nearbyUsers, meta: { total: nearbyUsers.length } };
};

export const ContactServices = {
  sendContactRequest,
  respondToContactRequest,
  getContactsByUser,
  getPendingRequests,
  getSentRequests,
  removeContact,
  blockUnblockContact,
  getContactsForInvitation,
  getNearbyUsers,
};
