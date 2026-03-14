const { db } = require("../config/firebase")

function checkRole(role){

 return async (req,res,next)=>{

  try{

   if(!req.user || !req.user.uid){
    return res.status(401).json({ error:"unauthorized" })
   }

   const uid = req.user.uid

   const doc = await db.collection("users").doc(uid).get()

   if(!doc.exists){
    return res.status(404).json({ error:"user not found" })
   }

   const data = doc.data()

   if(data.role !== role){
    return res.status(403).json({ error:"forbidden" })
   }

   next()

  }catch(error){

   console.error("checkRole error:", error)

   return res.status(500).json({
    error:"role verification failed"
   })

  }

 }

}

module.exports = checkRole