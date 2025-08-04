import express, { Request, Response, NextFunction } from 'express';
import { ApiError } from './utils/ApiError';
import cors from 'cors';
import cookieParser from "cookie-parser"



const app = express()

app.use(cors({
  origin: 'http://localhost:5174',
  credentials: true
}))

app.use(express.json({ limit: "2000kb" }))
app.use(express.urlencoded({ extended: true, limit: "2000kb" }))
app.use(express.static("public"))
app.use(cookieParser())


import authRouter from "./routes/auth.routes"
app.use("/api/auth", authRouter)

import userRouter from "./routes/user.routes"
app.use("/api/user", userRouter);


import postRouter from "./routes/post.routes"
app.use("/api/post", postRouter)


import commentRouter from "./routes/comment.routes"
app.use("/api/comment", commentRouter)

import likeRouter from "./routes/like.routes"
app.use("/api/like", likeRouter)

import socialRouter from "./routes/social.routes"
app.use("/api/social", socialRouter )

app.use(
  (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Global Error Caught:", err);
    if (err instanceof ApiError) {

      return res.status(err.statusCode).json({
        success: err.success,
        message: err.message,
        errors: err.errors,
        data: err.data,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errors: [err instanceof Error ? err.message : "An unexpected error occurred"],
    });
  }
);

export { app }