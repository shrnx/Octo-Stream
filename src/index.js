// require('dotenv').config({path: './env'})
import dotenv from 'dotenv'
dotenv.config({
    path: './env'
})

import express from 'express'
const app = express();

import connectDB from './db/index.js'

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log("Server is running at port: " + process.env.PORT);
    })
})
.catch((err) => {
    console.log("MongoDB connection failed: " + err)
})