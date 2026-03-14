const express = require("express")
const serverless = require("serverless-http")
const authRoutes = require("../src/routes/auth.routes")

const { db } = require("../src/config/firebase")

const app = express()

app.use(express.json())

app.get("/api/status", async (req,res)=>{

await db.collection("test").limit(1).get()

res.status(200).end()

})

app.use("/auth", authRoutes)



module.exports = serverless(app)
