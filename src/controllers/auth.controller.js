const {db} = require("../config/firebase")

exports.register = async(req,res)=>{

 try{

  const {email,password,role} = req.body

  const user = {
   email,
   password,
   role:role || "cotizador",
   createdAt:new Date()
  }

  const ref = await db.collection("users").add(user)

  res.json({
   success:true,
   id:ref.id
  })

 }catch(error){

  res.status(500).json({
   success:false,
   error:error.message
  })

 }

}



exports.login = async(req,res)=>{

 try{

  const {email,password} = req.body

  const snap = await db
   .collection("users")
   .where("email","==",email)
   .where("password","==",password)
   .get()

  if(snap.empty){

   return res.status(401).json({
    success:false,
    message:"credenciales incorrectas"
   })

  }

  const user = snap.docs[0]

  res.json({
   success:true,
   user:{
    id:user.id,
    ...user.data()
   }
  })

 }catch(error){

  res.status(500).json({
   success:false,
   error:error.message
  })

 }

}
