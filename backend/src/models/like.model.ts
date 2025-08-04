
import mongoose, { Schema, Document, model } from 'mongoose';

export interface ILike extends Document {
  post?: mongoose.Schema.Types.ObjectId;
  comment?: mongoose.Schema.Types.ObjectId;
  user: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const likeSchema: Schema<ILike> = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

likeSchema.index(
  { post: 1, user: 1 },
  { unique: true, partialFilterExpression: { post: { $exists: true } } }
);

likeSchema.index(
  { comment: 1, user: 1 },
  { unique: true, partialFilterExpression: { comment: { $exists: true } } }
);

export const Like = mongoose.model<ILike>('Like', likeSchema);