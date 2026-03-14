require("dotenv").config()

const express = require("express")
const cors = require("cors")
const path = require("path")
const serverless = require("serverless-http")

const app = express()

app.use(cors())
app.use(express.json())

// ================================
// STATUS
// ================================

app.get("/api/status",(req,res)=>{

 return res.json({
  success:true,
  message:"API funcionando",
  time:new Date()
 })

})


// ================================
// ROUTES
// ================================

const authRoutes = require("../src/routes/auth.routes")

app.use("/api",authRoutes)


// ================================
// FRONTEND
// ================================

app.use(express.static(path.join(__dirname,"../public")))

app.get("/",(req,res)=>{

 res.sendFile(path.join(__dirname,"../public/index.html"))

})


// ================================
// 404
// ================================

app.use((req,res)=>{

 res.status(404).json({
  success:false,
  message:"Ruta no encontrada"
 })

})


// ================================
// EXPORT SERVERLESS
// ================================

module.exports.handler = serverless(app)
