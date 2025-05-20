import { z } from "zod";

const createChildren = z.object({
  data: z
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
      parentId: z
        .string()
        .min(24, "Parent ID is required")
        .regex(/^[0-9a-fA-F]{24}$/, "Parent ID must be a valid ObjectId"),
      schoolName: z
        .string()
        .min(2, "School name is required")
        .max(50, "School name cannot exceed 50 characters")
        .trim()
        .regex(/^[A-Za-z\s.'-]+$/, "School name contains invalid characters")
        .optional(),
      tag: z.enum(["children", "spouse"], {
        required_error: "Tag is required",
        invalid_type_error: "Tag must be either 'children' or 'spouse'",
      }),
    })
    .strict()
    .refine(
      (data) => !(data.tag === "children" && !data.schoolName),
      {
        message: "School name is required when tag is 'children'",
        path: ["schoolName"],
      }
    )
    .refine(
      (data) => !(data.tag !== "children" && data.schoolName),
      {
        message: "School name is only allowed when tag is 'children'",
        path: ["schoolName"],
      }
    ),
});

const updateChildren = z.object({
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
        tag: z.enum(["children", "spouse"], {
          required_error: "Tag is required",
          invalid_type_error: "Tag must be either 'children' or 'spouse'",
        }).optional(),
        schoolName: z
        .string()
        .min(2, "School name is required")
        .max(50, "School name cannot exceed 50 characters")
        .trim()
        .regex(/^[A-Za-z\s.'-]+$/, "School name contains invalid characters")
        .optional(),                 
      
    })
    .strict() .refine(
      (data) => !(data.tag !== "children" && data.schoolName),
      {
        message: "School name is only allowed when tag is 'children'",
        path: ["schoolName"],
      }
    ),
});

export const ChildrenValidation = {
  createChildren,
  updateChildren,
};
