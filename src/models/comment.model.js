import mongoose from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'   // Use where we don't want to give all data at the same time
// Rather we want pagination or some data then some data 

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"    // It would have been videos if this was aggregation
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    }
}, {timestamps: true})

commentSchema.plugin(mongooseAggregatePaginate) // This only does from where to where will it return data(comments, videos etc)

export const Comment = mongoose.model("Comment", commentSchema)