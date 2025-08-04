// import mongoose, { Schema } from 'mongoose';

// const likeSchema: Schema = new mongoose.Schema({
//     post: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Post', 
//         required: true
//     },
//     comment:{
//         type:mongoose.Schema.Types.ObjectId,
//         ref:'Comment'
//     },
//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//     }
// }, { timestamps: true }); 


// likeSchema.index({ post: 1, user: 1 }, { unique: true });

// export const Like = mongoose.model('Like', likeSchema);

import mongoose, { Schema, Document, model } from 'mongoose';

// Define the interface for your Like document
export interface ILike extends Document {
  post?: mongoose.Schema.Types.ObjectId;    // Optional: present if liking a post
  comment?: mongoose.Schema.Types.ObjectId; // Optional: present if liking a comment
  user: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const likeSchema: Schema<ILike> = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        // Do NOT set required: true here, as a like can be for a comment instead of a post
    },
    comment:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Comment',
        // Do NOT set required: true here, as a like can be for a post instead of a comment
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Unique index for post likes: A user can like a specific post only once.
// partialFilterExpression ensures this index only applies when 'post' field exists.
likeSchema.index(
  { post: 1, user: 1 },
  { unique: true, partialFilterExpression: { post: { $exists: true } } }
);

// Unique index for comment likes: A user can like a specific comment only once.
// partialFilterExpression ensures this index only applies when 'comment' field exists.
likeSchema.index(
  { comment: 1, user: 1 },
  { unique: true, partialFilterExpression: { comment: { $exists: true } } }
);

export const Like = mongoose.model<ILike>('Like', likeSchema);