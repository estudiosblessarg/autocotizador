const express = require("express")
const serverless = require("serverless-http")

const { db } = require("../src/config/firebase")

const app = express()

app.use(express.json())

// test firebase
app.get("/status", async (req,res)=>{
  await db.collection("test").limit(1).get()
  res.status(200).end()
})

// REGISTER
app.post("/auth/register", async (req,res)=>{

  const { email, password, role } = req.body

  try{

    const user = {
      email,
      password,
      role,
      createdAt: new Date()
    }

    const ref = await db.collection("users").add(user)

    res.json({
      success:true,
      id:ref.id
    })

  }catch(err){

    res.status(500).json({
      error:"error creando usuario"
    })

  }

})

module.exports = serverless(app)
