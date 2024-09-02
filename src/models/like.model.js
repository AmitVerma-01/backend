import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema({
    likedBy : {
        type : Schema.Types.ObjectId,
        ref  : "User" 
    },
    video : {
        type : Schema.Types.ObjectId,
        ref : "Video"
    },
    tweet : {
        type : Schema.Types.ObjectId,
        ref : "Tweet"
    },
    comment : {
        type : Schema.Types.ObjectId,
        ref : "Comment"
    }
},{
    timestamps : true
})

likeSchema.plugin(mongooseAggregatePaginate)
export const Like = mongoose.model("Like", likeSchema);