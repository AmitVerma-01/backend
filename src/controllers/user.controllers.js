import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/APIError.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from '../models/user.model.js' 
import { uploadOnCloudinary } from "../utils/cloudinary.js";
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
    
    if(!email || !username){
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
        .json({
            message : "User logout successfully"
        })

    } catch (error) {
        throw new ApiError(401, "Logout Failed. Try Again")
    }
})

export { registerUser , loginUser, logoutUser}