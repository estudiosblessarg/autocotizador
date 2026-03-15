const { db } = require("../config/firebase")

exports.marcas=async(req,res)=>{

 const snap=
  await db.collection("precios")
   .select("marca")
   .get()

 const marcas=new Set()

 snap.forEach(doc=>{
  marcas.add(doc.data().marca)
 })

 res.json([...marcas].sort())

}

exports.modelos=async(req,res)=>{

 const {marca}=req.params

 const snap=
  await db.collection("precios")
   .where("marca","==",marca)
   .select("modelo")
   .get()

 const modelos=new Set()

 snap.forEach(doc=>{
  modelos.add(doc.data().modelo)
 })

 res.json([...modelos].sort())

}

exports.versiones=async(req,res)=>{

 const {marca,modelo}=req.params

 const snap=
  await db.collection("precios")
   .where("marca","==",marca)
   .where("modelo","==",modelo)
   .select("version")
   .get()

 const versiones=new Set()

 snap.forEach(doc=>{
  versiones.add(doc.data().version)
 })

 res.json([...versiones].sort())

}

exports.anios=async(req,res)=>{

 const {marca,modelo,version}=req.params

 const snap=
  await db.collection("precios")
   .where("marca","==",marca)
   .where("modelo","==",modelo)
   .where("version","==",version)
   .select("anio")
   .get()

 const anios=new Set()

 snap.forEach(doc=>{
  anios.add(doc.data().anio)
 })

 res.json([...anios].sort((a,b)=>b-a))

}