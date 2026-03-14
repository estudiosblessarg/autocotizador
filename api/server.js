const express = require("express")
const serverless = require("serverless-http")

const app = express()

app.get("/api/status", (req,res)=>{

console.log("STATUS ENDPOINT HIT")

res.json({
ok:true,
message:"API funcionando"
})

})

module.exports = serverless(app)
