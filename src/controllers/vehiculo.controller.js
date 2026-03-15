const { db } = require("../config/firebase")

/*
========================================
BUSCAR EN INTERNET SI NO EXISTE
========================================
*/

async function buscarEnInternet(marca){

 console.log("====================================")
 console.log("🌐 BUSQUEDA INTERNET INICIADA")
 console.log("Marca solicitada:",marca)

 try{

  const url = "https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/"+marca+"?format=json"

  console.log("URL API:",url)

  const res = await fetch(url)

  console.log("Status API:",res.status)

  const data = await res.json()

  console.log("Respuesta completa API:",data)

  if(!data.Results){
   console.log("⚠️ No hay resultados en la API")
   return []
  }

  const modelos = data.Results.map(m=>m.Model_Name)

  console.log("Modelos encontrados en internet:",modelos)

  console.log("====================================")

  return modelos

 }catch(err){

  console.error("❌ Error buscando en internet:",err)

  return []

 }

}


/*
========================================
GET MARCAS
========================================
*/

exports.getMarcas = async(req,res)=>{

 console.log("====================================")
 console.log("🚗 GET MARCAS")

 try{

  const snap = await db.collection("vehiculos").get()

  console.log("Documentos encontrados en Firestore:",snap.size)

  const marcas = snap.docs.map(d=>d.id)

  console.log("Marcas Firestore:",marcas)

  if(marcas.length > 0){

   console.log("Enviando marcas desde Firestore")

   return res.json(marcas)

  }

  /*
  ====================================
  SI FIRESTORE ESTA VACIO
  BUSCAR EN INTERNET
  ====================================
  */

  console.log("⚠️ Firestore vacío")
  console.log("🌐 Buscando marcas en internet...")

  const url = "https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json"

  console.log("URL API:",url)

  const response = await fetch(url)

  console.log("Status API:",response.status)

  const data = await response.json()

  console.log("Total marcas recibidas:",data.Results.length)

  const marcasInternet = data.Results.map(m=>m.Make_Name)

  console.log("Primeras 20 marcas:",marcasInternet.slice(0,20))

  /*
  ====================================
  GUARDAR EN FIRESTORE
  ====================================
  */

  for(const marca of marcasInternet.slice(0,200)){

   console.log("Guardando marca:",marca)

   await db
    .collection("vehiculos")
    .doc(marca)
    .set({created:true})

  }

  console.log("Marcas enviadas al frontend:",marcasInternet.length)

  res.json(marcasInternet)

 }catch(err){

  console.error("❌ Error obteniendo marcas:",err)

  res.status(500).json({
   error:"error obteniendo marcas"
  })

 }

}

/*
========================================
GET MODELOS
========================================
*/

exports.getModelos = async(req,res)=>{

 console.log("====================================")
 console.log("🚗 GET MODELOS")

 try{

  const {marca} = req.params

  console.log("Marca solicitada:",marca)

  const snap = await db
   .collection("vehiculos")
   .doc(marca)
   .collection("modelos")
   .get()

  console.log("Modelos encontrados en Firestore:",snap.size)

  if(!snap.empty){

   const modelos = snap.docs.map(d=>d.id)

   console.log("Modelos enviados al frontend:",modelos)

   return res.json(modelos)

  }

  /*
  ========================================
  SI NO EXISTE BUSCAR EN INTERNET
  ========================================
  */

  console.log("⚠️ No hay modelos en Firestore")
  console.log("🌐 Buscando modelos en internet...")

  const modelosInternet = await buscarEnInternet(marca)

  console.log("Modelos obtenidos de internet:",modelosInternet)

  /*
  ========================================
  GUARDAR EN FIRESTORE
  ========================================
  */

  for(const modelo of modelosInternet){

   console.log("Guardando modelo en Firestore:",modelo)

   await db
    .collection("vehiculos")
    .doc(marca)
    .collection("modelos")
    .doc(modelo)
    .set({created:true})

  }

  console.log("Modelos enviados al frontend:",modelosInternet)

  res.json(modelosInternet)

 }catch(err){

  console.error("❌ Error obteniendo modelos:",err)

  res.status(500).json({error:"error obteniendo modelos"})

 }

}


/*
========================================
GET VERSIONES
========================================
*/

exports.getVersiones = async(req,res)=>{

 console.log("====================================")
 console.log("🚗 GET VERSIONES")

 try{

  const {marca,modelo} = req.params

  console.log("Marca:",marca)
  console.log("Modelo:",modelo)

  const snap = await db
   .collection("vehiculos")
   .doc(marca)
   .collection("modelos")
   .doc(modelo)
   .collection("versiones")
   .get()

  console.log("Versiones encontradas:",snap.size)

  const versiones = snap.docs.map(d=>d.id)

  console.log("Versiones enviadas al frontend:",versiones)

  res.json(versiones)

 }catch(err){

  console.error("❌ Error versiones:",err)

  res.status(500).json({error:"error versiones"})

 }

}


/*
========================================
GET AÑOS
========================================
*/

exports.getAnios = async(req,res)=>{

 console.log("====================================")
 console.log("🚗 GET AÑOS")

 try{

  const {marca,modelo,version} = req.params

  console.log("Marca:",marca)
  console.log("Modelo:",modelo)
  console.log("Version:",version)

  const doc = await db
   .collection("vehiculos")
   .doc(marca)
   .collection("modelos")
   .doc(modelo)
   .collection("versiones")
   .doc(version)
   .get()

  if(!doc.exists){

   console.log("⚠️ Documento no existe en Firestore")

   return res.json([])

  }

  const data = doc.data()

  console.log("Datos documento:",data)

  console.log("Años enviados al frontend:",data.anios)

  res.json(data.anios || [])

 }catch(err){

  console.error("❌ Error años:",err)

  res.status(500).json({error:"error años"})

 }

}
