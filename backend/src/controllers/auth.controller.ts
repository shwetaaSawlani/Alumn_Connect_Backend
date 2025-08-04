import { User } from "../models/user.model";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import * as EmailValidator from 'email-validator';
import { validator } from "../utils/PasswordValidator"
import { ApiResponse } from "../utils/ApiResponse";


const generateAccessToken = (user: InstanceType<typeof User>) => {
    return jwt.sign({ id: user._id, type: user.type }, process.env.JWT_SECRET!, {
        expiresIn: '15m',
    });
};

const generateRefreshToken = (user: InstanceType<typeof User>) => {
    return jwt.sign({ id: user._id, type: user.type }, process.env.JWT_SECRET!, {
        expiresIn: '7d',
    });
};

export const isValidPhone = (phone: string) => /^\d{10}$/.test(phone);
export const isValidRollNo = (rollNo: string) => /^\d{4}[a-zA-Z]{2}\d{6}$/.test(rollNo);
const allowedTypes = ['student', 'alumni'];

export const signUp = asyncHandler(async (req: Request, res: Response) => {

    const { fullName, email, phoneNumber, password, type, rollNo } = req.body;

    if (!email && !phoneNumber) {
        throw new ApiError(400, "Either Email or Phone Number is required to register.");
    }

    if (!password) {
        throw new ApiError(400, "Password is required to register.");
    }
    if (!type) {
        throw new ApiError(400, "User Type is required");
    }
    if (!allowedTypes.includes(type)) {
        throw new ApiError(400, "Type must be either 'student' or 'alumni'.");
    }
    if (!fullName) {
        throw new ApiError(400, "Name is Required to register");
    }
    if (!rollNo) {
        throw new ApiError(400, "Roll No. is required");
    }

    const lowercasedEmail = typeof email === 'string' ? email.trim().toLowerCase() : undefined;
    if (lowercasedEmail && !EmailValidator.validate(lowercasedEmail)) {
        throw new ApiError(400, "Email is not valid.");
    }

    if (phoneNumber && (!isValidPhone(phoneNumber))) {
        throw new ApiError(400, "Phone number must be exactly 10 digits.");
    }

    if (rollNo && !isValidRollNo(rollNo)) {
        throw new ApiError(400, "Roll No. must be in the format 'DDDDLLDDDDDD' (e.g., '0827IT211110' where D=digit, L=letter).");
    }

    const passwordValidationResult = validator.validate(password);
    if (!passwordValidationResult.valid) {
        throw new ApiError(400, "Password does not meet requirements.", passwordValidationResult.errors);
    }

    const existingUserQueryConditions: any[] = [];

    if (lowercasedEmail) {
        existingUserQueryConditions.push({ email: lowercasedEmail });
    }
    if (phoneNumber && typeof phoneNumber === 'string') {
        const phoneNumberNum = Number(phoneNumber);
        existingUserQueryConditions.push({ phoneNumber: phoneNumberNum });
    }
    existingUserQueryConditions.push({ rollNo: rollNo });


    const userExists = await User.findOne({
        $or: existingUserQueryConditions
    });

    console.log("userExists:", userExists);

    if (userExists) {

        if (lowercasedEmail && userExists.email === lowercasedEmail) {
            throw new ApiError(409, "User already exists with this email. Please log in or use a different email.");
        }
        if (phoneNumber && String(userExists.phoneNumber) === String(phoneNumber)) {
            throw new ApiError(409, "User already exists with this phone number. Please log in or use a different phone number.");
        }
        if (userExists.rollNo === rollNo) {
            throw new ApiError(409, "User already exists with this roll number. Please log in.");
        }
        throw new ApiError(409, "User already exists with provided credentials.");
    }

    const userData: any = {
        fullName: fullName,
        password: password,
        type: type,
        rollNo: rollNo
    };

    if (lowercasedEmail && lowercasedEmail.trim() !== '') {
        userData.email = lowercasedEmail;
    }

    if (phoneNumber) {
        userData.phoneNumber = phoneNumber;
    }

    const user = await User.create(userData);
    if (!user) {
        throw new ApiError(500, "Failed to create user. Please try again.");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    if (!accessToken) {
        throw new ApiError(500, "Failed to generate access token.");
    }

    if (!refreshToken) {
        throw new ApiError(500, "Failed to generate refresh token.");
    }

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });


    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000
    });

    res.status(201).json(
        new ApiResponse(201,
            {
                user: {
                    _id: user._id,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    rollNo: user.rollNo,
                    type: user.type,
                    fullName: user.fullName
                },
            }, "User registered successfully"
        )
    );
});

export const signIn = asyncHandler(async (req: Request, res: Response) => {
    const { rollNo, phoneNumber, email, password } = req.body;

    if (!password) {
        throw new ApiError(400, "Password is required to Sign in.");
    }
    if (!email && !phoneNumber && !rollNo) {
        throw new ApiError(400, "Please provide an email, or phone number, or roll number to log in.");
    }

    const loginQueryConditions: any[] = [];
    let identifierProvided = false;

    if (email) {
        const lowercasedEmail = email.toLowerCase();
        if (!EmailValidator.validate(lowercasedEmail)) {
            throw new ApiError(400, "Provided email is not valid.");
        }
        loginQueryConditions.push({ email: lowercasedEmail });
        identifierProvided = true;
    }

    if (phoneNumber) {
        if (!isValidPhone(phoneNumber)) {
            throw new ApiError(400, "Phone number must be exactly 10 digits.");
        }
        loginQueryConditions.push({ phoneNumber: phoneNumber });
        identifierProvided = true;
    }

    if (rollNo) {
        if (!isValidRollNo(rollNo)) {
            throw new ApiError(400, "Roll No. must be in the format 'DDDDLLDDDDDD' (e.g., '0827IT211110' where D=digit, L=letter).");
        }
        loginQueryConditions.push({ rollNo: rollNo });
        identifierProvided = true;
    }

    if (!identifierProvided || loginQueryConditions.length === 0) {
        throw new ApiError(400, "No valid login identifier provided.");
    }

    const user = await User.findOne({
        $or: loginQueryConditions
    }).select('+password');

    if (!user) {
        throw new ApiError(404, "User not found with the provided credentials. Please register or check your input.");
    }

    if (!user.password) {
        throw new ApiError(500, "User password data is missing. Contact support.");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new ApiError(401, "Invalid credentials. Please check your password.");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    if (!accessToken) {
        throw new ApiError(500, "Failed to generate access token during sign-in.");
    }

    if (!refreshToken) {
        throw new ApiError(500, "Failed to generate refresh token during sign-in.");
    }

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    const cookieOptions = {
        httpOnly: true,
        secure: false
    };

    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000
    });


    res.status(200).json(new ApiResponse(200, {
        user: {
            _id: user._id,
            type: user.type,
            email: user.email,
            phoneNumber: user.phoneNumber,
            rollNo: user.rollNo,
            fullName: user.fullName
        },
    }, "User logged in successfully"));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.accessToken;

    if (!token) {
        throw new ApiError(401, "Access Denied / Unauthorized request: Token is missing from cookies.");
    }

    if (token === 'null') {
        throw new ApiError(401, "Access Denied / Unauthorized request: Token is invalid (null string).");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

        if (!decoded || !decoded.id) {
            throw new ApiError(401, "Invalid token: User ID missing.");
        }

        const user = await User.findById(decoded.id);
        if (user) {
            user.refreshToken = null;
            await user.save();
        }

        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: false,
        });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: false,
        });

        res.status(200).json(new ApiResponse(200, "You are logged out Successfully!!!"));
    } catch (error: any) {
        console.error("Logout error:", error.message);
        throw new ApiError(500, "Logout failed.");
    }
});

export const generateAccessTokenFromRefreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new ApiError(400, "Refresh Token not found");
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string) as { id: string };

        if (!decoded || !decoded.id) {
            throw new ApiError(401, "Refresh token is invalid or expired. Please log in again.");
        }
        const user = await User.findById(decoded.id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token: User not found.");
        }
        if (user.refreshToken !== refreshToken) {
            throw new ApiError(401, "Refresh token has been revoked. Please log in again.");
        }

        const newAccessToken = generateAccessToken(user);

        if (!newAccessToken) {
            throw new ApiError(500, "Failed to generate a new access token.");
        }
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: false,
        });

        res.status(200).json(new ApiResponse(200, { accessToken: newAccessToken }, "New access token generated successfully."));

    } catch (error: any) {
        console.error("Refresh token error:", error.message);
        throw new ApiError(401, "Refresh token is invalid or expired. Please log in again.");
    }

});



