require("dotenv").config()

const express = require("express")
const cors = require("cors")
const path = require("path")
const serverless = require("serverless-http")

const routes = require("../src/routes/auth.routes")

const app = express()

app.use(cors())
app.use(express.json())

// =================
// API
// =================

app.use("/api", routes)

app.get("/api/status", (req,res)=>{
  res.json({
    ok:true,
    message:"API funcionando"
  })
})


// =================
// FRONTEND
// =================

app.use(express.static(path.join(__dirname,"../public")))

app.get("/",(req,res)=>{
  res.sendFile(path.join(__dirname,"../public/index.html"))
})

module.exports = serverless(app)
