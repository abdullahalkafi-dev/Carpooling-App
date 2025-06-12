import { model, Schema } from "mongoose";
import { TUser, UserModal } from "./user.interface";
import bcrypt from "bcryptjs";
import config from "../../../config";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
const userSchema = new Schema<TUser, UserModal>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "First name must be at least 2 characters long"],
      maxlength: [50, "First name can't be more than 50 characters"],
      match: [
        /^[a-zA-ZÀ-ÿ\u00f1\u00d1'-\s]+$/,
        "First name contains invalid characters",
      ],
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Last name must be at least 2 characters long"],
      maxlength: [50, "Last name can't be more than 50 characters"],
      match: [
        /^[a-zA-ZÀ-ÿ\u00f1\u00d1'-\s]+$/,
        "Last name contains invalid characters",
      ],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        },
        message: "Please provide a valid email",
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: [6, "Password must be at least 6 characters long"],
      maxlength: [50, "Password can't be more than 50 characters"],
    },
    role: {
      type: String,
      enum: ["ADMIN", "USER"],
      default: "USER",
    },
    address: {
      type: [Schema.Types.ObjectId],
      ref:"addresses",
      default: [],
    },
    phoneNumber: {
      type: String,
      unique: true,
      trim: true,
      sparse: true, // This prevents duplicate "" or null errors
     
    },
    image: {
      type: String,
      default: null,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "delete"],
      default: "active",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    authentication: {
      isResetPassword: {
        type: Boolean,
        default: false,
      },
      oneTimeCode: {
        type: String,
        default: null,
      },

      expireAt: {
        type: Date,
        default: null,
      },
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        // Remove the auto-generated id property
        delete ret.id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
    versionKey: false,
  }
);
userSchema.index({ status: 1 });
// this for better index performance
userSchema.index({ createdAt: -1 });
// this for text search in names
userSchema.index({ firstName: "text", lastName: "text" });
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

//exist user check
userSchema.statics.isExistUserById = async (id: string) => {
  const isExist = await User.findById(id);
  return isExist;
};

userSchema.statics.isExistUserByEmail = async (email: string) => {
  const isExist = await User.findOne({ email });
  return isExist;
};

userSchema.statics.isExistUserByPhnNum = async (phoneNumber: string) => {
  const isExist = await User.findOne({ phoneNumber });
  return isExist;
};

//is match password
userSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

//check if JWT issued before password changed
userSchema.statics.isJWTIssuedBeforePasswordChanged = (
  passwordChangedAt: Date | null,
  jwtIssuedTimestamp: number
): boolean => {
  if (!passwordChangedAt) return false; // no change = token is valid

  const passwordChangedTime = Math.floor(passwordChangedAt.getTime() / 1000); // to match JWT iat in seconds
  return jwtIssuedTimestamp < passwordChangedTime;
};

//check user
userSchema.pre("save", async function (next) {
  //password hash
  if (!this.isModified("password")) return next(); // Only hash if changed
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds)
  );
  // Set passwordChangedAt only if password was modified
  this.passwordChangedAt = new Date();
  next();
});
// Remove password field from query results

userSchema.pre(/^find/, function (this: any, next) {
  if (this.getQuery && this.getProjection) {
    const projection = this.getProjection();
    if (!projection || Object.keys(projection).length === 0) {
      this.select("-password");
    }
  }
  next();
});

// Handle findOneAndUpdate to exclude password
userSchema.pre("findOneAndUpdate", function (this: any, next) {
  const update = this.getUpdate();
  if (update && update.$set && update.$set.password) {
    update.$set.passwordChangedAt = new Date();
  }
  next();
});
// Plugin to include virtuals in lean queries.
userSchema.plugin(mongooseLeanVirtuals);

export const User = model<TUser, UserModal>("User", userSchema, "users");
