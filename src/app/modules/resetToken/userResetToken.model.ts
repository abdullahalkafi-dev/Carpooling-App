import { model, Schema } from 'mongoose';
import { IResetToken, ResetTokenModel } from './ResetToken.interface';

const ResetTokenSchema = new Schema<IResetToken, ResetTokenModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    token: {
      type: String,
      required: true,
    },
    expireAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);
    
//token check
ResetTokenSchema.statics.isExistToken = async (
  token: string
): Promise<IResetToken | null> => {
  return await ResetToken.findOne({ token });
};
 
//token validity check
ResetTokenSchema.statics.isExpireToken = async (token: string) => {
  const currentDate = new Date();
  const resetToken = await ResetToken.findOne({
    token,
    expireAt: { $gt: currentDate },
  });
  return !!resetToken;
};
 
export const ResetToken = model<IResetToken, ResetTokenModel>(
  'ResetToken',
  ResetTokenSchema
);
