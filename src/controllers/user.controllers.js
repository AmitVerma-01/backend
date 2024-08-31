import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/APIError.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from '../models/user.model.js' 
import { deleteImageFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
const generateAccessAndRefreshToken = async (userId)=>{
    try {
        
        const user = await User.findById(userId);
        const refreshToken = user.generateRefreshToken()
        const accesToken = user.generateAccessToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return { 
            accesToken,
            refreshToken
        }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access token")
    }

} 
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
    console.log(req.body);
    
    if(
        [fullName,email,username,password].some(field => field?.trim()==="")
    ){
        throw new ApiError(400 , "All fields are required ");
    }

    const isUserExist = await User.findOne({
        $or : [{email, username}]
    });

    if(isUserExist){
        throw new ApiError(409, "User with same email and password is already registered.")
    }
    
    const avatarLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath;
    if(req.files?.coverImage){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(409 , "Avatar is required ")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(409 , "Avatar is required ")
    }

    const user = await User.create({
        username,
        fullName,
        email,
        password,
        avatar : avatar.url,
        coverImage : coverImage?.url || ""
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user.")
    }
  
    return res.status(201).json(
        new ApiResponse(200, createdUser , "User registerd successfully")
    )
})

const loginUser = asyncHandler( async (req, res) => {
    // get body
    // username or email
    // check username or email
    // check user existance
    // if yes then check password
    // access token and refresh token
    // send secure cookie
    // send response
    
    const {email, username, password} = req.body
    console.log(req.body);
    
    if(!(email || username)){
        throw new ApiError(400, "Username or Email is required")
    }

    const user = await User.findOne({
        $or : [{email},{username}]
    })

    if(!user){
        throw new ApiError(400,"User doesn't exist.")
    }

    const checkPassword = await user.isPasswordCorrect(password)
    console.log(checkPassword);
    

    if(!checkPassword){
        throw new ApiError(401, "Password is Incorrect.")
    }
    const {accesToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken" , accesToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                loggedInUser, accesToken, refreshToken
            },
            "User loggedIn successfully"
        )
    )

})

const logoutUser = asyncHandler(async ( req, res) => {
    try {
        const userId = req.user._id
        const user  = await User.findByIdAndUpdate(userId,{
            $set : {
                refreshToken : null
            }
        },{
            new : true
        })

        const options = {
            httpOnly : true,
            secure : true
        }

        console.log(user);
        
        return res.status(200)
        .clearCookie("accessToken",options)
        .json(new ApiResponse(200, {}, "User logged Out"))

    } catch (error) {
        throw new ApiError(401, "Logout Failed. Try Again")
    }
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    try {
        const incomingRefreshToken = req.cookie.refreshAccessToken || req.body.refreshToken
        if(!incomingRefreshToken){
            throw new ApiError(401, "Invalid Authorization")
        }
        const decodeToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        if(!decodeToken){
            throw new ApiError(401, "Invalid Refresh Token")
        }
        const user = await User.findById(decodeToken?._id);
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if(incomingRefreshToken !== user.refreshAccessToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const {accesToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
        return res
            .cookie("accessToken",accesToken)
            .cookie("refreshToken",refreshToken)
            .json(
                new ApiResponse(200, {
                    accesToken,
                    refreshToken
                },
                "Access Token Refreshed Successfully"
            ))
    } catch (error) {
        throw new ApiError(500,"Failed to generate new access token");
    }
})

const changeCurrentPassword = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword} = req.body
    
    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(401, "Old Password is incorrect")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave : false})

    return res
        .status(200)
        .json(
            new ApiResponse(200,"","Password change successfully")
        )
})

const getCurrentUser =  asyncHandler( async (req, res)=> {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "Current user fetched successfully.")
    )
})

const updateUserDetailes = asyncHandler(async ( req , res)=>{

    const {fullName} = req.body

    if(!fullName){
        throw new ApiError(401, "FullName is required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullName
            }
        },{
            new : true
        }
    ).select("-password -refreshToken")

    return res
            .status(200)
            .json(
                new ApiResponse(200,user,"FullName Updated Successfully")
            )
})

const updateUserAvatar = asyncHandler(async(req, res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar File is missing.")
    }

    const userPrevDetails = req?.user;

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(500, "Error while updating avatar.")
    }
    
    const user = await User.findByIdAndUpdate(
        req?.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },{
            new : true
        }
    ).select("-password -refreshToken")

    const isDeleted = await deleteImageFromCloudinary(userPrevDetails.avatar)


    if(!isDeleted){
        throw new ApiError(500, "Image updation failed(deletion failed from cloudinary)")
    }

    return res
            .status(200)
            .json(
                new ApiResponse(200, user, "Avatar Updated successfully.")
            )

})

const updateUserCoverImage = asyncHandler(async(req, res)=>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400, "cover image File is missing.")
    }

    const userPrevDetails = req.user;

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(500, "Error while updating cover image.")
    }

    const user = await User.findByIdAndUpdate(
        req?.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },{
            new : true
        }
    ).select("-password -refreshToken")

    if(userPrevDetails.coverImage){
        const isDeleted = await deleteImageFromCloudinary(userPrevDetails.coverImage)
        
        
        if(!isDeleted){
            throw new ApiError(500, "Cover image updation failed(deletion failed from cloudinary)")
        }
    }

    return res
            .status(200)
            .json(
                new ApiResponse(200, user, "coverImage Updated successfully")
            )

})

const getChannelProfile = asyncHandler(async(req, res)=>{
    const username = req.params

    if(!username?.trim()){
        throw new ApiError(401, "Username is not valid")
    }

    const channel = await User.aggregate([
        {
            $match : {
                username : username?.toLowerCase()
            }
        },{
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },{
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },{
            $addFields : {
                subscriberCount : {
                    $size : "$subscribers"
                },
                subscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $cond : {
                        if : {$in : [req.user?._id, "$subscribers.subscriber"]} ,
                        then : true,
                        else : false
                    }
                }
            }
        },{
            $project : {
                fullName : 1,
                username : 1,
                avatar : 1,
                coverImage : 1,
                email : 1,
                isSubscribed : 1,
                subscribedToCount : 1,
                subscriberCount : 1,
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(400, "Channel does not exists.")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0],"Channel data recieved successfully")
    )
})

export { registerUser,
         loginUser,
         logoutUser, 
         refreshAccessToken, 
         getCurrentUser, 
         changeCurrentPassword,
         updateUserDetailes,
         updateUserAvatar,
         updateUserCoverImage,
         getChannelProfile
        }