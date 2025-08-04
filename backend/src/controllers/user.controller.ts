import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { User } from "../models/user.model";
import { uploadOnCloudinary } from "../utils/Cloudinary";

export const applyPaginationAndSorting = async (req: Request, filter: any = {}) => {

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (isNaN(page) || page <= 0) {
        throw new ApiError(400, "Page number must be a positive integer.");
    }
    if (isNaN(limit) || limit <= 0) {
        throw new ApiError(400, "Limit must be a positive integer.");
    }

    const skip = (page - 1) * limit;

    try {
        const totalUsers = await User.countDocuments(filter);
        const users = await User.find(filter)
            .skip(skip)
            .limit(limit)
            .collation({ locale: "en" })
            .sort({
                fullName: 1
            });

        const totalPages = Math.ceil(totalUsers / limit);
        const finalTotalPages = totalUsers === 0 ? 0 : Math.ceil(totalUsers / limit);

        return {
            users,
            currentPage: page,
            totalPages: finalTotalPages,
            totalCount: totalUsers,
            limit,
        };

    } catch (error: any) {
        console.error("Error applying pagination and sorting:", error);
        if (error.name === 'MongooseError' || error.name === 'MongoError') {
            throw new ApiError(500, "Database error during pagination: " + error.message);
        }
        throw new ApiError(500, "Failed to apply pagination and sorting: " + error.message);

    }
};


export const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {

    const { userId } = req.params;
    const trimmedId = userId?.trim();

    if (!trimmedId) {
        throw new ApiError(400, "User id is not provided. User Id is required to update the profile");
    }

    const user = await User.findById(trimmedId);

    if (!user) {
        throw new ApiError(404, `No user Found with given Id ${trimmedId}`)
    }

    const fullName = req.body?.fullName;
    const rollNo = req.body?.rollNo;
    const email = req.body?.email;
    const phoneNumber = req.body?.phoneNumber;
    const department = req.body?.department;
    const linkedin = req.body?.linkedin;
    const github = req.body?.github;
    const graduationyear = req.body?.graduationyear;
    const currentcompany = req.body?.currentcompany;
    const yearsofexperience = req.body?.yearsofexperience;
    const jobtitle = req.body?.jobtitle;
    const industry = req.body?.industry;
    const bio = req.body?.bio;
    const type = req.body?.type;
    const hackerRank = req.body?.hackerRank;
    const leetcode = req.body?.leetcode;
    const codechef = req.body?.codechef;

    if (fullName) { user.fullName = fullName; }
    if (rollNo) { user.rollNo = rollNo; }
    if (email) { user.email = email; }
    if (phoneNumber) { user.phoneNumber = phoneNumber; }
    if (department) { user.department = department; }
    if (linkedin) { user.linkedin = linkedin; }
    if (github) { user.github = github; }
    if (graduationyear) { user.graduationyear = graduationyear; }
    if (currentcompany) { user.currentcompany = currentcompany; }
    if (yearsofexperience) { user.yearsofexperience = yearsofexperience; }
    if (jobtitle) { user.jobtitle = jobtitle; }
    if (industry) { user.industry = industry; }
    if (bio) { user.bio = bio; }
    if (hackerRank) { user.hackerRank = hackerRank; }
    if (codechef) { user.codechef = codechef; }
    if (leetcode) { user.leetcode = leetcode; }

    if (type) {
        const allowedTypes = ['student', 'alumni'];
        if (!allowedTypes.includes(type)) {
            throw new ApiError(400, "Invalid user type. Allowed values are 'student' or 'alumni'.");
        }
        user.type = type;
    }
    const avatarLocalPath = req.file?.path as string;
    if (avatarLocalPath) {
        const avatarUrl = await uploadOnCloudinary(avatarLocalPath);
        user.avatar = avatarUrl as string;
    }

    await user.save();
    res.status(200).json(new ApiResponse(200, user, `User Profile updated successfullyy for user with userId : ${trimmedId} and userName :${fullName}`))

});


export const deleteUserById = asyncHandler(async (req: Request, res: Response) => {

    const { userId } = req.params;
    const trimmedId = userId?.trim();
    if (!trimmedId) {
        throw new ApiError(400, "ID is required to delete User profile");
    }

    const user = await User.findOneAndDelete({ _id: trimmedId });

    if (!user) {
        throw new ApiError(404, `User not found with the given ID/ Unable to delete the user with userId : ${trimmedId}`);
    }
    res.status(200).json(
        new ApiResponse(200, {}, `User deleted successfully with userId ${trimmedId}`)
    );
});


export const getUserByName = asyncHandler(async (req: Request, res: Response) => {

    const { name } = req.params;
    const trimmedName = name?.trim();

    if (!trimmedName) {
        throw new ApiError(400, "Name is required to get the user ");
    }

    const user = await User.find({ fullName: trimmedName });

    if (!user) {
        throw new ApiError(404, "user not found with given name");
    }

    res.status(200).json(
        new ApiResponse(200, user, `user found successfully with name ${name}`)
    );

})

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const trimmedId = userId?.trim();

    if (!trimmedId) {
        throw new ApiError(400, "Id is required to get the user");
    }
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, `user not found with given id ${userId}`);
    }

    res.status(200).json(
        new ApiResponse(200, user, `user found successfully with Id ${userId}`)
    );
})


export const getUsersByGraduationyear = asyncHandler(async (req: Request, res: Response) => {
    const { year } = req.params;
    const trimmedYear = year?.trim();

    if (!trimmedYear) {
        throw new ApiError(400, " Graduation year is required ")
    }
    const filter: any = { graduationyear: trimmedYear };
    const paginationResult = await applyPaginationAndSorting(req, filter);

    res.status(200).json(
        new ApiResponse(200, paginationResult, `Users found successfully with pass-out year : ${trimmedYear}`)
    );
})


export const getUsersBycurrentcompany = asyncHandler(async (req: Request, res: Response) => {
    const { company } = req.params;
    const trimmedCompany = company?.trim();

    if (!trimmedCompany) {
        throw new ApiError(400, " current company  is required ")
    }
    const filter: any = { currentcompany: trimmedCompany };
    const paginationResult = await applyPaginationAndSorting(req, filter);

    res.status(200).json(
        new ApiResponse(200, paginationResult, `Users found successfully with Company Name: ${trimmedCompany}`)
    );
})

export const getUsersByDepartment = asyncHandler(async (req: Request, res: Response) => {
    const { department } = req.params;
    const trimmedDepartment = department?.trim();

    if (!trimmedDepartment) {
        throw new ApiError(400, " current company  is required ")
    }
    const filter: any = { department: trimmedDepartment };
    const paginationResult = await applyPaginationAndSorting(req, filter);

    res.status(200).json(
        new ApiResponse(200, paginationResult, `Users found successfully with Department : ${trimmedDepartment}`)
    );
})

export const getUsersByJobtitle = asyncHandler(async (req: Request, res: Response) => {
    const { designation } = req.params;
    const trimmedDesignation = designation?.trim();

    if (!trimmedDesignation) {
        throw new ApiError(400, " Job Title is required ")
    }
    const filter: any = { jobtitle: trimmedDesignation };
    const paginationResult = await applyPaginationAndSorting(req, filter);

    res.status(200).json(
        new ApiResponse(200, paginationResult, `Users found successfully with Position: : ${trimmedDesignation}`)
    );
})

export const getUsersByIndustry = asyncHandler(async (req: Request, res: Response) => {
    const { industry } = req.params;
    const trimmedindustry = industry?.trim();

    if (!trimmedindustry) {
        throw new ApiError(400, " insdustry is required ")
    }
    const filter: any = { industry: trimmedindustry };
    const paginationResult = await applyPaginationAndSorting(req, filter);

    res.status(200).json(
        new ApiResponse(200, paginationResult, `Users found successfully with Industry : ${trimmedindustry}`)
    );
})

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {

    const filter: any = {};

    const paginationResult = await applyPaginationAndSorting(req, filter);

    res.status(200).json(
        new ApiResponse(200, paginationResult, "All users fetched with pagination and sorting.")
    );
});
