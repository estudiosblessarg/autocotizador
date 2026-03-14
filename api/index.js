const express = require("express")
const serverless = require("serverless-http")

const authRoutes = require("../src/routes/auth.routes")

const app = express()

app.use(express.json())

// ROUTES
app.use("/api/auth", authRoutes)

app.get("/api/status",(req,res)=>{

console.log("STATUS ENDPOINT")

res.json({
ok:true
})

})

module.exports = serverless(app)
