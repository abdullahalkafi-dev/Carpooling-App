import { z } from "zod";

const createVerifyEmail = z.object({
  body: z
    .object({
      email: z.string({ required_error: "Email is required" }),
      oneTimeCode: z
        .union([z.string().transform((val) => parseFloat(val)), z.number()])
        .refine((val: any) => !isNaN(val), {
          message: "One time code is required",
        }),
    })
    .strict(),
});

const Login = z.object({
  body: z
    .object({
      email: z.string({ required_error: "Email is required" }),
      password: z.string({ required_error: "Password is required" }),
    })
    .strict(),
});

const createForgetPassword = z.object({
  body: z
    .object({
      email: z.string({ required_error: "Email is required" }),
    })
    .strict(),
});

const createResetPassword = z.object({
  body: z
    .object({
      newPassword: z.string({ required_error: "Password is required" }),
      confirmPassword: z.string({
        required_error: "Confirm Password is required",
      }),
    })
    .strict(),
});

const createChangePassword = z.object({
  body: z
    .object({
      currentPassword: z.string({
        required_error: "Current Password is required",
      }),
      newPassword: z.string({ required_error: "New Password is required" }),
      confirmPassword: z.string({
        required_error: "Confirm Password is required",
      }),
    })
    .strict(),
});

export const AuthValidation = {
  createVerifyEmail,
  Login,
  createForgetPassword,
  createResetPassword,
  createChangePassword,
};
