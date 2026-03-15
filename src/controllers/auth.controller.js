const { db, admin } = require("../config/firebase")

// ======================================
// REGISTER
// ======================================

exports.register = async (req,res)=>{

 console.log("====================================")
 console.log("📥 POST /api/auth/register")
 console.log("BODY:",req.body)

 try{

  const { email,password,role } = req.body

  if(!email || !password){

   return res.status(400).json({
    success:false,
    error:"email y password requeridos"
   })

  }

  // ======================================
  // CREATE USER IN FIREBASE AUTH
  // ======================================

  console.log("🔥 Creating Firebase Auth user")

  const userRecord = await admin.auth().createUser({
   email:email,
   password:password
  })

  console.log("✅ Firebase Auth user created:",userRecord.uid)

  // ======================================
  // SAVE USER IN FIRESTORE
  // ======================================

  const userData = {
   uid:userRecord.uid,
   email:email,
   role:role || "cotizador",
   createdAt:admin.firestore.FieldValue.serverTimestamp()
  }

  console.log("💾 Saving user in Firestore")

  await db.collection("users").doc(userRecord.uid).set(userData)

  console.log("✅ User saved in Firestore")

  res.json({
   success:true,
   uid:userRecord.uid
  })

 }catch(err){

  console.error("🔥 REGISTER ERROR")
  console.error(err)

  res.status(500).json({
   success:false,
   error:"error creando usuario"
  })

 }

}


// ======================================
// LOGIN
// ======================================

exports.login = async(req,res)=>{

 console.log("====================================")
 console.log("📥 POST /api/auth/login")
 console.log("BODY:",req.body)

 try{

  const { email } = req.body

  if(!email){

   return res.status(400).json({
    success:false,
    error:"email requerido"
   })

  }

  // ======================================
  // GET USER FROM FIREBASE AUTH
  // ======================================

  console.log("🔥 Searching Firebase Auth user")

  const userRecord = await admin.auth().getUserByEmail(email)

  console.log("✅ Firebase user found:",userRecord.uid)

  // ======================================
  // GET USER DATA FROM FIRESTORE
  // ======================================

  console.log("🔥 Searching Firestore user")

  const doc = await db.collection("users").doc(userRecord.uid).get()

  if(!doc.exists){

   return res.status(404).json({
    success:false,
    error:"usuario no encontrado en base de datos"
   })

  }

  const user = doc.data()

  console.log("✅ Firestore user found")
  console.log("ROLE:",user.role)

  res.json({
   success:true,
   uid:userRecord.uid,
   role:user.role
  })

 }catch(err){

  console.error("🔥 LOGIN ERROR")
  console.error(err)

  res.status(500).json({
   success:false,
   error:"error login"
  })

 }

}
