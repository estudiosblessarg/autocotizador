const {db} = require("../config/firebase")

exports.getCotizaciones = async(req,res)=>{

 try{

  const snap = await db.collection("cotizaciones").get()

  const data = snap.docs.map(d=>({
   id:d.id,
   ...d.data()
  }))

  res.json(data)

 }catch(error){

  res.status(500).json({
   error:error.message
  })

 }

}



exports.update = async(req,res)=>{

 try{

  const {id} = req.params

  await db.collection("cotizaciones").doc(id).update(req.body)

  res.json({success:true})

 }catch(error){

  res.status(500).json({
   error:error.message
  })

 }

}



exports.delete = async(req,res)=>{

 try{

  const {id} = req.params

  await db.collection("cotizaciones").doc(id).delete()

  res.json({success:true})

 }catch(error){

  res.status(500).json({
   error:error.message
  })

 }

}
