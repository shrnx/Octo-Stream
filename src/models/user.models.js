import mongoose, { Schema } from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true    // This makes searching optimized of DB
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

    avatar: {
        type: String,       // cloudinary URL
        required: true,
    },
    coverImage: {           // cloudinary URL
        type: String
    },
    watchHistory: [         // This is array which holds multiple watched video links.
        // Earlier I forgot to put this inside array, so an array(even empty) didn't returned.
        {         
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true })

userSchema.pre("save", async function (next) {   // If we have use arrow function here, we won't have the access of this
    if (!this.isModified("password")) {
        next()
    };
    // This will check if password is not modified, don't run this logic

    this.password = await bcrypt.hash(this.password, 10);
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)    // returns true or false
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,   // from mongoDB
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({   // This only has _id because this gets refreshed frequently
        _id: this._id,   // from mongoDB
    },  
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)