const { db } = require("../config/firebase")

/*
========================================
CONFIG
========================================
*/

const CACHE_LIMIT_MARCAS = 80
const CACHE_LIMIT_MODELOS = 150


/*
========================================
MARCAS PERMITIDAS
========================================
*/

const MARCAS_REALES = [
"Toyota","Ford","Chevrolet","Nissan","Honda","BMW","Mercedes-Benz","Audi",
"Volkswagen","Hyundai","Kia","Mazda","Subaru","Jeep","Ram","Dodge",
"Lexus","Volvo","Peugeot","Renault","Fiat","Citroen","Mitsubishi",
"Suzuki","Mini","Land Rover","Jaguar","Porsche","Ferrari","Lamborghini",
"Maserati","Tesla","Genesis","Chery","BYD","Great Wall","Haval"
]


/*
========================================
LIMPIAR ID FIRESTORE
========================================
*/

function limpiarID(texto){

 if(!texto) return ""

 return texto
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"")
  .replace(/[^a-z0-9]/g,"-")
  .replace(/-+/g,"-")
  .trim()

}


/*
========================================
FILTRAR MARCAS
========================================
*/

function filtrarMarcas(marcas){

 const validas = new Set(
  MARCAS_REALES.map(m=>m.toLowerCase())
 )

 const resultado = new Set()

 for(const marca of marcas){

  if(validas.has(marca.toLowerCase())){
   resultado.add(marca)
  }

 }

 return [...resultado]

}


/*
========================================
BUSCAR MODELOS API
========================================
*/

async function buscarModelosInternet(marca){

 try{

  console.log("🌐 Buscando modelos:",marca)

  const url =
  `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(marca)}?format=json`

  const res = await fetch(url)

  const data = await res.json()

  if(!data.Results) return []

  const modelos = data.Results
   .map(m=>m.Model_Name)
   .filter(Boolean)

  return [...new Set(modelos)]

 }catch(err){

  console.error("Error API modelos",err)

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

  console.log("🚗 GET MARCAS")

  const snap = await db.collection("vehiculos").get()

  if(!snap.empty){

   const marcas = snap.docs
    .map(d=>d.data().nombre)
    .filter(Boolean)

   return res.json(marcas)

  }

  console.log("⚠️ Firestore vacío, consultando API")

  const url =
  "https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json"

  const response = await fetch(url)

  const data = await response.json()

  let marcas = data.Results
   .map(m=>m.Make_Name)
   .filter(Boolean)

  marcas = filtrarMarcas(marcas)

  const batch = db.batch()

  marcas.slice(0,CACHE_LIMIT_MARCAS).forEach(marca=>{

   const id = limpiarID(marca)

   const ref = db.collection("vehiculos").doc(id)

   batch.set(ref,{
    nombre:marca,
    created:Date.now()
   })

  })

  await batch.commit()

  res.json(marcas.slice(0,CACHE_LIMIT_MARCAS))

 }catch(err){

  console.error(err)

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

 try{

  const {marca} = req.params

  console.log("🚗 GET MODELOS",marca)

  const marcaID = limpiarID(marca)

  const snap = await db
   .collection("vehiculos")
   .doc(marcaID)
   .collection("modelos")
   .get()

  if(!snap.empty){

   const modelos = snap.docs
    .map(d=>d.data().nombre)
    .filter(Boolean)

   return res.json(modelos)

  }

  console.log("⚠️ modelos no encontrados en cache")

  const modelosInternet = await buscarModelosInternet(marca)

  const modelos = modelosInternet.slice(0,CACHE_LIMIT_MODELOS)

  const batch = db.batch()

  modelos.forEach(modelo=>{

   const modeloID = limpiarID(modelo)

   const ref = db
    .collection("vehiculos")
    .doc(marcaID)
    .collection("modelos")
    .doc(modeloID)

   batch.set(ref,{
    nombre:modelo,
    created:Date.now()
   })

  })

  await batch.commit()

  res.json(modelos)

 }catch(err){

  console.error(err)

  res.status(500).json({
   error:"error obteniendo modelos"
  })

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

  const marcaID = limpiarID(marca)
  const modeloID = limpiarID(modelo)

  const snap = await db
   .collection("vehiculos")
   .doc(marcaID)
   .collection("modelos")
   .doc(modeloID)
   .collection("versiones")
   .get()

  const versiones = snap.docs
   .map(d=>d.data().nombre)
   .filter(Boolean)

  res.json(versiones)

 }catch(err){

  console.error(err)

  res.status(500).json({
   error:"error versiones"
  })

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

  const marcaID = limpiarID(marca)
  const modeloID = limpiarID(modelo)
  const versionID = limpiarID(version)

  const doc = await db
   .collection("vehiculos")
   .doc(marcaID)
   .collection("modelos")
   .doc(modeloID)
   .collection("versiones")
   .doc(versionID)
   .get()

  if(!doc.exists){
   return res.json([])
  }

  const data = doc.data()

  res.json(data.anios || [])

 }catch(err){

  console.error(err)

  res.status(500).json({
   error:"error años"
  })

 }

}
