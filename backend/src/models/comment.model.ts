// import mongoose, { Schema } from 'mongoose';

// const commentSchema: Schema = new mongoose.Schema({
//     content: {
//         type: String,
//         required: true,
//         trim: true
//     },
//     post: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Post',
//         required: true
//     },
//     author: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//     }
// }, { timestamps: true }); 

// export const Comment = mongoose.model('Comment', commentSchema);


import mongoose, { Schema, Document, model } from 'mongoose';

// 1. Define your interface for the Comment document properties
//    Make sure to EXPORT it so other files can import it.
export interface IComment extends Document {
  content: string;
  post: mongoose.Schema.Types.ObjectId; // Reference to the Post model's _id
  author: mongoose.Schema.Types.ObjectId; 
   likes: mongoose.Schema.Types.ObjectId[];// Reference to the User model's _id
  createdAt: Date;
  updatedAt: Date;
}

// 2. Define the Mongoose Schema using the interface
const commentSchema: Schema<IComment> = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000, // Example: max length for comment content
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post', // Reference to your Post model
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to your User model
      required: true,
    },
     likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Like',
      },
    ],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// 3. Create and export the Mongoose Model
export const Comment = model<IComment>('Comment', commentSchema);