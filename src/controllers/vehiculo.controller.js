const axios = require("axios")
const { db } = require("../config/firebase")

/*
========================================
BUSCAR EN INTERNET SI NO EXISTE
========================================
*/

async function buscarEnInternet(marca,modelo){

 try{

  const url = "https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/"+marca+"?format=json"

  const res = await axios.get(url)

  const modelos = res.data.Results.map(m=>m.Model_Name)

  return modelos

 }catch(err){

  console.error("Error buscando en internet",err)
  return []

 }

}


/*
========================================
GET MARCAS
========================================
*/

exports.getMarcas = async(req,res)=>{

 try{

  const snap = await db.collection("vehiculos").get()

  const marcas = snap.docs.map(d=>d.id)

  res.json(marcas)

 }catch(err){

  console.error(err)
  res.status(500).json({error:"error obteniendo marcas"})

 }

}


/*
========================================
GET MODELOS
========================================
*/

exports.getModelos = async(req,res)=>{

 try{

  const {marca} = req.params

  const snap = await db
   .collection("vehiculos")
   .doc(marca)
   .collection("modelos")
   .get()

  if(!snap.empty){

   const modelos = snap.docs.map(d=>d.id)
   return res.json(modelos)

  }

  // si no existe buscar en internet

  console.log("Buscando modelos en internet")

  const modelosInternet = await buscarEnInternet(marca)

  // guardar en firestore

  for(const modelo of modelosInternet){

   await db
    .collection("vehiculos")
    .doc(marca)
    .collection("modelos")
    .doc(modelo)
    .set({created:true})

  }

  res.json(modelosInternet)

 }catch(err){

  console.error(err)
  res.status(500).json({error:"error obteniendo modelos"})

 }

}


/*
========================================
GET VERSIONES
========================================
*/

exports.getVersiones = async(req,res)=>{

 try{

  const {marca,modelo} = req.params

  const snap = await db
   .collection("vehiculos")
   .doc(marca)
   .collection("modelos")
   .doc(modelo)
   .collection("versiones")
   .get()

  const versiones = snap.docs.map(d=>d.id)

  res.json(versiones)

 }catch(err){

  console.error(err)
  res.status(500).json({error:"error versiones"})

 }

}


/*
========================================
GET AÑOS
========================================
*/

exports.getAnios = async(req,res)=>{

 try{

  const {marca,modelo,version} = req.params

  const doc = await db
   .collection("vehiculos")
   .doc(marca)
   .collection("modelos")
   .doc(modelo)
   .collection("versiones")
   .doc(version)
   .get()

  if(!doc.exists){

   return res.json([])

  }

  const data = doc.data()

  res.json(data.anios || [])

 }catch(err){

  console.error(err)
  res.status(500).json({error:"error años"})

 }

}
