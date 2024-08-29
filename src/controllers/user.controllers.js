import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/APIError.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from '../models/user.model.js' 
import { uploadOnCloudinary } from "../utils/cloudinary.js";
const registerUser = asyncHandler( async (req, res) => {
    // get user details
    // validation
    // check is User already registered : username, email
    // check for img, check for avatar
    // upload then to cloudinary, avatar
    // create user object, create user to db
    // remove password and refresh token from response
    // check for user creation
    // return res


    const { fullName, email, username, password } = req.body
    if(
        [fullName,email,username,password].some(field => field?.trim()==="")
    ){
        throw new ApiError(400 , "All fields are required ");
    }

    const isUserExist = User.findOne({
        $or : [{email, username}]
    });

    if(isUserExist){
        throw new ApiError(409, "User with same email and password is already registered.")
    }
    
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(409 , "Avatar is required ")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(409 , "Avatar is required ")
    }

    const user = await User.create({
        fullName,
        email,
        avatar_url : avatar.url,
        coverImage : coverImage?.url || "",
        password,
        username

    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user.")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registerd successfully")
    )
})

export { registerUser }