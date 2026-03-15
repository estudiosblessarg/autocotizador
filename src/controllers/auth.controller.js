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

  // ======================
  // VALIDATION
  // ======================

  if(!email || !password){

   console.warn("❌ Missing email or password")

   return res.status(400).json({
    success:false,
    error:"email y password requeridos"
   })

  }

  // ======================
  // CHECK EXISTING USER
  // ======================

  console.log("🔎 Checking if user exists:",email)

  const existing = await db
   .collection("users")
   .where("email","==",email)
   .limit(1)
   .get()

  if(!existing.empty){

   console.warn("⚠ User already exists")

   return res.status(409).json({
    success:false,
    error:"usuario ya existe"
   })

  }

  // ======================
  // CREATE USER
  // ======================

  const user = {
   email,
   password,
   role: role || "cotizador",
   createdAt: admin.firestore.FieldValue.serverTimestamp()
  }

  console.log("💾 Creating user in Firestore")

  const ref = await db.collection("users").add(user)

  console.log("✅ User created:",ref.id)

  res.json({
   success:true,
   id:ref.id
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

  const { email,password } = req.body

  // ======================
  // VALIDATION
  // ======================

  if(!email || !password){

   console.warn("❌ Missing credentials")

   return res.status(400).json({
    success:false,
    error:"email y password requeridos"
   })

  }

  console.log("🔎 Searching user:",email)

  // ======================
  // QUERY USER
  // ======================

  const snap = await db
   .collection("users")
   .where("email","==",email)
   .limit(1)
   .get()

  if(snap.empty){

   console.warn("❌ User not found")

   return res.status(401).json({
    success:false,
    error:"credenciales invalidas"
   })

  }

  const doc = snap.docs[0]
  const user = doc.data()

  // ======================
  // PASSWORD CHECK
  // ======================

  if(user.password !== password){

   console.warn("❌ Password mismatch")

   return res.status(401).json({
    success:false,
    error:"credenciales invalidas"
   })

  }

  console.log("✅ Login success")
  console.log("ROLE:",user.role)

  res.json({
   success:true,
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
