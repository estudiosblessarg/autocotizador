const {db} = require("../config/firebase")

exports.getKM = async(req,res)=>{

 try{

  const doc = await db.collection("config").doc("km").get()

  res.json(doc.data())

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
