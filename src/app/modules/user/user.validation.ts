import { z } from "zod";

const createUser = z.object({
  body: z
    .object({
      firstName: z
        .string()
        .min(2, "First name is required")
        .max(50, "First name cannot exceed 50 characters")
        .trim()
        .regex(/^[A-Za-z\s.'-]+$/, "First name contains invalid characters"),
      lastName: z
        .string()
        .min(2, "Last name is required")
        .max(50, "Last name cannot exceed 50 characters")
        .trim()
        .regex(/^[A-Za-z\s.'-]+$/, "Last name contains invalid characters"),
      email: z.string().email("Invalid email address").trim().toLowerCase(),
      password: z
        .string()
        .min(6, "Password must be at least 6 characters long")
        .max(100, "Password is too long")
        .trim(),
    })
    .strict(),
});

const updateUser = z.object({
  body: z
    .object({
      firstName: z
        .string()
        .min(2, "First name must be at least 2 characters long")
        .max(50, "First name can't be more than 50 characters")
        .regex(
          /^[a-zA-ZÀ-ÿ\u00f1\u00d1'-\s]+$/,
          "First name contains invalid characters"
        )
        .trim()
        .optional(),
      lastName: z
        .string()
        .min(2, "Last name must be at least 2 characters long")
        .max(50, "Last name can't be more than 50 characters")
        .regex(
          /^[a-zA-ZÀ-ÿ\u00f1\u00d1'-\s]+$/,
          "Last name contains invalid characters"
        )
        .trim()
        .optional(),

      phoneNumber: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, "Please provide a valid phone number")
        .trim()
        .optional(),
      image: z.string().nullable().optional(),
      fcmToken: z.string().nullable().optional(),
      address: z
        .array(
          z.object({
            title: z.string(),
            street: z.string(),
            apartmentNumber: z.string(),
            city: z.string(),
            state: z.string(),
            postalCode: z.string(),
          })
        )
        .optional(),
    })
    .strict(),
});

const updateUserActivationStatus = z.object({
  body: z
    .object({
      status: z.enum(["active", "delete"]),
    })
    .strict(),
});

const updateUserRole = z.object({
  body: z
    .object({
      role: z.enum(["ADMIN", "USER"]),
    })
    .strict(),
});

export const UserValidation = {
  createUser,
  updateUser,
  updateUserActivationStatus,
  updateUserRole,
};
