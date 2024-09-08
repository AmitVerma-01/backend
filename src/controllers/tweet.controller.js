import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body

    if(!content.trim()){
        throw new ApiError(401, "Content is required to create a tweet")
    }

    const tweet = await Tweet.create({
        content,
        owner : req.user._id
    })

    if(!tweet){
        throw new ApiError(500, "Failed to create tweet, internal server error")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet created successfully")
    )
    
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params

    if (!userId) {
        throw new ApiError(409 , "User id is required")
    }

    if(!isValidObjectId(userId)){
        throw new ApiError(401, "Invalid user id")
    }
     
    const userTweets = await Tweet.aggregate([
        {
            $match : {
                owner :new mongoose.Types.ObjectId(userId)
            }
        },{
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner",
                pipeline : [
                    {
                        $project : {
                            fullName : 1,
                            username : 1,
                            avatar : 1
                        }
                    }
                ]
            }
        }
    ])

    if(!userTweets){
        throw new ApiError(500, "Failed to fetch tweets, internal server error/Invalid user id")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, userTweets, "Tweets fetched successfully")
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    let { tweetId } = req.params
    let { content } = req.body
    tweetId = tweetId.trim()
    content.trim()

    if(!(content || tweetId)){
        throw new ApiError(401, "Tweet Id and Content is required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(401, "Invalid Tweet Id") 
    }

    const tweet = await Tweet.findByIdAndUpdate(tweetId, {
        content
    }, {
        new : true
    })

    if(!tweet){
        throw new ApiError(500, "Failed to update tweet, internal server error")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    let {tweetId} = req.params
    tweetId = tweetId.trim()
    
    if(!tweetId){
        throw new ApiError(401, "Tweet Id is required")
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(401, "Invalid Tweet Id")
    }
    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(401, "No tweet present with this id :"+ tweetId )
    }

    if(!tweet.owner.equals(req.user._id)){
        throw new ApiError(401, "You are not authorized to delete this tweet")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if(!deletedTweet){
        throw new ApiError(500, "Failed to delete tweet, internal server error")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, deletedTweet, "Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}