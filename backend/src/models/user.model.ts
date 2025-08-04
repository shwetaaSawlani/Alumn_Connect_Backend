import mongoose, { Schema, Document } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

export interface IUser extends Document {
    fullName: string;
    email?: string;
    password: string;
    type: 'student' | 'alumni';
    avatar?: string;
    rollNo: string;
    phoneNumber?: number;
    department?: 'IT' | 'CS' | 'CSIT' | 'EE' | 'CE' | 'ME' | 'AIML';
    linkedin?: string;
    github?: string;
    graduationyear?: number;
    currentcompany?: string;
    yearsofexperience?: number;
    jobtitle?: string;
    industry?: string;
    bio?: string;
    refreshToken?: string | null;
    codechef?: string;
    hackerRank?: string;
    leetcode?: string;


    isPrivate: boolean;
    followers: mongoose.Types.ObjectId[];
    following: mongoose.Types.ObjectId[];
    followRequests: mongoose.Types.ObjectId[];


    //   isPasswordCorrect: (password: string) => Promise<boolean>;
    //   generateAccessToken: () => string;
    //   generateRefreshToken: () => string;
}


const userSchema = new mongoose.Schema({

    fullName: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
    },

    avatar: {
        type: String,
    },

    rollNo: {
        type: String,
        unique: true,
        required: [true, "Roll Number is required"],
        trim: true,
        match: [/^\d{4}[A-Za-z]{2}\d{6}$/, "Roll number must be in format DDDDYYDDDDDD"]
    },

    email: {
        type: String,
        unique: true,
        lowercase: true,
        sparse: true,
        trim: true,
        match: [/.+@.+\..+/, 'Please enter a valid email address'],
    },

    phoneNumber: {
        type: Number,
        unique: true,
        trim: true,
        sparse: true,
        match: [/^\d{10}$/, "Phone number must be exactly 10 digits"]
    },

    department: {
        type: String,
        enum: {
            values: ['IT', 'CS', 'CSIT', 'EE', 'CE', 'ME', 'AIML']
        },
        trim: true,
    },

    linkedin: {
        type: String,
        trim: true,
    },

    github: {
        type: String,
        trim: true,

    },
    hackerRank: {
        type: String,
        trim: true,

    },
    leetcode: {
        type: String,
        trim: true,
    },
    codechef: {
        type: String,
        trim: true,
    },


    graduationyear: {
        type: Number,
        trim: true,
    },

    currentcompany: {
        type: String,
        trim: true,
    },

    yearsofexperience: {
        type: Number,
        trim: true,
    },

    jobtitle: {
        type: String,
        trim: true,
    },

    industry: {
        type: String,
        trim: true
    },

    bio: {
        type: String,
        trim: true,
    },

    type: {
        type: String,
        enum: ['alumni', 'student'],
        required: [true, 'User type is required'],
    },

    password: {
        type: String,
        required: true,
        trim: true,
        minlength: [6, 'Password must be at least 6 characters long'],
        match: [
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{6,}$/,
            'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character'
        ],
        select: false,
    },

    refreshToken: {
        type: String || null,
        select: false
    },
    isPrivate: {
        type: Boolean,
        default: false,
    },
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: [],
        }
    ],
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: [],
        }
    ],
    followRequests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: [],
        }
    ]

},
    { timestamps: true });

userSchema.pre("validate", function (next) {
    if (!this.email && !this.phoneNumber) {
        this.invalidate("email", "Either email or phoneNumber is required");
        this.invalidate("phoneNumber", "Either phoneNumber or email is required");
    }
    next();
});


userSchema.pre("save", function (next) {
    if (!this.isModified("password")) return next();

    if (typeof this.password === "string") {
        bcrypt.hash(this.password, 10, (err, hash) => {
            if (err) return next(err);
            this.password = hash;
            next();
        });
    } else {
        return next(new Error("Password must be a string"));
    }
})

// // Method to check if the provided password is correct
// userSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
//     return await bcrypt.compare(password, this.password);
// };

// Method to generate Access Token
// userSchema.methods.generateAccessToken = function (): string {
//     return jwt.sign(
//         {
//             _id: this._id,
//             email: this.email,
//             username: this.fullName, // Assuming fullName is used as username
//             type: this.type,
//             isPrivate: this.isPrivate,
//         },
//         process.env.ACCESS_TOKEN_SECRET as string,
//         {
//             expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
//         }
//     );
// };

// // Method to generate Refresh Token
// userSchema.methods.generateRefreshToken = function (): string {
//     return jwt.sign(
//         {
//             _id: this._id,
//         },
//         process.env.REFRESH_TOKEN_SECRET as string,
//         {
//             expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
//         }
//     );
// };




export const User = mongoose.model<IUser>('User', userSchema);