const { db } = require("../config/firebase")

exports.register = async(req,res)=>{

 console.log("POST /api/auth/register")

 try{

  const { email,password,role } = req.body

  if(!email || !password){

   return res.status(400).json({
    error:"email y password requeridos"
   })

  }

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

 }catch(err){

  console.error(err)

  res.status(500).json({
   error:"error creando usuario"
  })

 }

}

exports.login = async(req,res)=>{

 console.log("POST /api/auth/login")

 try{

  const { email,password } = req.body

  const snap = await db.collection("users")
   .where("email","==",email)
   .where("password","==",password)
   .limit(1)
   .get()

  if(snap.empty){

   return res.status(401).json({
    error:"credenciales invalidas"
   })

  }

  const user = snap.docs[0].data()

  res.json({
   success:true,
   role:user.role
  })

 }catch(err){

  console.error(err)

  res.status(500).json({
   error:"error login"
  })

 }

}
