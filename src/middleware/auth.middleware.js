const { db } = require("../config/firebase")

function decodeJWT(token){

 try{

  const base64Payload = token.split(".")[1]

  const payload = Buffer.from(base64Payload, "base64").toString("utf8")

  return JSON.parse(payload)

 }catch(error){

  return null

 }

}

async function verifyToken(req, res, next){

 try{

  const header = req.headers.authorization

  if(!header){
   return res.status(401).json({ error:"token required" })
  }

  if(!header.startsWith("Bearer ")){
   return res.status(401).json({ error:"invalid auth header" })
  }

  const token = header.split(" ")[1]

  if(!token){
   return res.status(401).json({ error:"token missing" })
  }

  // decodificar token SIN verificar
  const decoded = decodeJWT(token)

  if(!decoded){
   return res.status(401).json({ error:"invalid token format" })
  }

  const email = decoded.email

  if(!email){
   return res.status(400).json({ error:"email not found in token" })
  }

  // buscar usuario por email en firestore
  const snapshot = await db
   .collection("users")
   .where("email","==",email)
   .limit(1)
   .get()

  if(snapshot.empty){
   return res.status(404).json({ error:"user not found" })
  }

  const user = snapshot.docs[0].data()

  const role = user.role || "user"

  // guardar datos en request
  req.user = {
   email: email,
   role: role
  }

  next()

 }catch(error){

  console.error("verifyToken error:", error)

  return res.status(500).json({
   error:"role lookup failed"
  })

 }

}

module.exports = verifyToken