import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  password: string;
  refreshToken: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    age: {
      type: Number,
      required: true,
      max: [120, "Please enter a valid age."],
    },
    password: { type: String, required: true, select: false },
    refreshToken: { type: String, select: false },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
