const express = require("express")
const serverless = require("serverless-http")

const { db } = require("../src/config/firebase")

const app = express()

app.get("/api/status", async (req,res)=>{

await db.collection("test").limit(1).get()

res.status(200).end()

})

module.exports = serverless(app)
