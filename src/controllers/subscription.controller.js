import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscriptions.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!channelId){
        throw new ApiError(401, "Channel Id is required")
    }

    const findSubscription = await Subscription.findOne({channel : channelId, subscriber : req.user._id})

    let toggleSubscriptionResult;

    if(!findSubscription){
        toggleSubscriptionResult = await Subscription.create({channel : channelId, subscriber : req.user._id})
    }else {
        await Subscription.findByIdAndUpdate(findSubscription._id)
    }

    if(!toggleSubscriptionResult){
        throw new ApiError(500, "Subscription toggle failed", ["Internal server error"])
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200 , {
            subscriptionStatus : !findSubscription ? true : false 
        })
    )

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(401, "Channel Id is required")
    }

    const allSubscribers = await Subscription.find({channel : channelId})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            allSubscribers ? { subscriberCount : allSubscribers.length , allSubscribers } : { subscriberCount : 0 , allSubscribers : []},
            allSubscribers ? "All subscribers" : "No subscription"
        )
    )

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!subscriberId){
        throw new ApiError(401, "Subscriber Id is required")
    }

    const allSubscribers = await Subscription.find({subscriber : subscriberId})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            allSubscribers ? { subscriberCount : allSubscribers.length , allSubscribers } : { subscriberCount : 0 , allSubscribers : []},
            allSubscribers ? "All subscribers" : "No subscription"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}