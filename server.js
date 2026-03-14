const express = require("express")
const cors = require("cors")

const authRoutes = require("./src/routes/auth.routes")

const app = express()

// ======================
// MIDDLEWARE
// ======================

app.use(cors())
app.use(express.json())

// ======================
// STATUS TEST
// ======================

app.get("/api/status",(req,res)=>{
 console.log("STATUS OK")
 res.status(200).json({ok:true})
})

// ======================
// ROUTES
// ======================

app.use("/api/auth",authRoutes)

// ======================
// SERVER START
// ======================

const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{
 console.log("SERVER RUNNING ON PORT",PORT)
})
