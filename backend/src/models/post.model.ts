import mongoose, { Schema, Document, model } from 'mongoose';

export interface IPost extends Document {
  description: string;
  mediaurl: string;
  author: mongoose.Schema.Types.ObjectId; 
  comments: mongoose.Schema.Types.ObjectId[];
  likes: mongoose.Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
 
}

const postSchema: Schema<IPost> = new Schema(
  {
    description: {
      type: String,
      required: true, 
      trim: true,
      maxlength: 500, 
    },
    mediaurl: {
      type: String, 
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
    },
     comments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
      likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Like',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Post = model<IPost>('Post', postSchema);