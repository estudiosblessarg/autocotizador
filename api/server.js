const express = require("express")
const serverless = require("serverless-http")

const authRoutes = require("../src/routes/auth.routes")

const app = express()

app.use(express.json())

// TEST API
app.get("/api/status",(req,res)=>{
 console.log("STATUS OK")
 res.status(200).end()
})

// AUTH ROUTES
app.use("/api/auth",authRoutes)

module.exports = serverless(app)
