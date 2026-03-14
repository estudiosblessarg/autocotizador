const express = require("express")
const serverless = require("serverless-http")

const authRoutes = require("../src/routes/auth.routes")
const { db } = require("../src/config/firebase")

const app = express()

app.use(express.json())

app.use("/auth", authRoutes)

module.exports = serverless(app)
