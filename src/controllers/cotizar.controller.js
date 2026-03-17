const { db } = require("../config/firebase")

exports.cotizar=async(req,res)=>{

 try{

  const {marca,modelo,anio,km}=req.body

  const snap=
   await db.collection("autos")
    .where("marca","==",marca)
    .where("modelo","==",modelo)
    .where("anio","==",Number(anio))
    .get()

  if(snap.empty)
   return res.status(400).json({
    error:"modelo no encontrado"
   })

  const precios=[]

  snap.forEach(doc=>{
   precios.push(doc.data().precio)
  })

  const promedio=
   precios.reduce((a,b)=>a+b,0)/precios.length

  let ajusteKm=0

  if(km>100000) ajusteKm=0.15
  else if(km>70000) ajusteKm=0.10
  else if(km>40000) ajusteKm=0.05

  const precioFinal=
   Math.round(promedio-(promedio*ajusteKm))

  res.json({
   precioBase:promedio,
   precioFinal
  })

 }catch(err){

  res.status(500).json({
   error:err.message
  })

 }

}
