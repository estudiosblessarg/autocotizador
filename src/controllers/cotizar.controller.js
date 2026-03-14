const {db} = require("../config/firebase")

exports.cotizar = async(req,res)=>{

 try{

  const cotizacion = {
   ...req.body,
   createdAt:new Date()
  }

  const ref = await db.collection("cotizaciones").add(cotizacion)

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
