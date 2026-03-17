const {db} = require("../config/firebase")

exports.getUsers = async(req,res)=>{

 try{

  const snap = await db.collection("users").get()

  const users = snap.docs.map(d=>({
   id:d.id,
   ...d.data()
  }))

  res.json(users)

 }catch(error){

  res.status(500).json({
   error:error.message
  })

 }

}

exports.updateKM = async(req,res)=>{

 try{

  await db.collection("config").doc("km").set(req.body)

  res.json({success:true})

 }catch(error){

  res.status(500).json({
   error:error.message
  })

 }

}



exports.updateRole = async(req,res)=>{

 try{

  const {id} = req.params
  const {role} = req.body

  await db.collection("users").doc(id).update({role})

  res.json({success:true})

 }catch(error){

  res.status(500).json({
   error:error.message
  })

 }

}
