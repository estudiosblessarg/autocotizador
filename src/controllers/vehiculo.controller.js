const { db } = require("../config/firebase")

const fetch = (...args) =>
 import("node-fetch").then(({ default: fetch }) => fetch(...args))

/*
CONFIG
*/

const CACHE_LIMIT_MARCAS = 80
const CACHE_LIMIT_MODELOS = 200


/*
CATALOGO COMPLEMENTARIO
para marcas que la API devuelve incompleto
*/

const MODELOS_EXTRA = {

 Peugeot: [
  "208","2008","308","3008","408","5008",
  "Partner","Expert","Boxer","RCZ"
 ],

 Renault: [
  "Clio","Megane","Sandero","Logan",
  "Duster","Kwid","Captur","Koleos"
 ],

 Fiat: [
  "500","Argo","Cronos","Pulse","Toro",
  "Strada","Mobi","Uno"
 ],

 Chevrolet: [
  "Onix","Cruze","Tracker","S10",
  "Spin","Captiva","Equinox"
 ],

 Volkswagen: [
  "Golf","Polo","Virtus","Jetta",
  "Tiguan","Taos","Amarok"
 ],

 Toyota: [
  "Corolla","Corolla Cross","Hilux",
  "RAV4","Yaris","Camry","Land Cruiser"
 ]

}


/*
VERSIONES GENERICAS
*/

const VERSIONES_BASE = [
"Base",
"SE",
"LE",
"Sport",
"Premium",
"Limited",
"Touring",
"GT"
]


/*
LIMPIAR IDS
*/

function limpiarID(texto){

 if(!texto) return ""

 return texto
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"")
  .replace(/[^a-z0-9]/g,"-")
  .replace(/-+/g,"-")
  .replace(/^-|-$/g,"")

}


/*
GENERAR VERSIONES
*/

function generarVersiones(modelo){

 return VERSIONES_BASE.map(v => `${modelo} ${v}`)

}


/*
GENERAR AÑOS
*/

function generarAnios(){

 const anios=[]
 const actual=new Date().getFullYear()

 for(let a=actual;a>=2000;a--){
  anios.push(a)
 }

 return anios

}


/*
COMBINAR MODELOS
*/

function combinarModelos(marca,apiModelos){

 const extra = MODELOS_EXTRA[marca] || []

 const lista = [...apiModelos,...extra]

 return [...new Set(lista)]

}


/*
API MODELOS
*/

async function buscarModelosInternet(marca){

 try{

  console.log("🌐 API modelos:",marca)

  const url =
  `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(marca)}?format=json`

  const res = await fetch(url)

  if(!res.ok){
   throw new Error("API error")
  }

  const data = await res.json()

  if(!data.Results){
   return []
  }

  const modelos = data.Results
   .map(m => m.Model_Name)
   .filter(Boolean)

  return [...new Set(modelos)]

 }catch(err){

  console.error("❌ Error API modelos:",err)

  return []

 }

}


/*
GET MARCAS
*/

exports.getMarcas = async(req,res)=>{

 try{

  const snap = await db.collection("vehiculos").get()

  if(!snap.empty){

   const marcas = snap.docs
    .map(d=>d.data().nombre)
    .filter(Boolean)

   return res.json(marcas)

  }

  const url =
  "https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json"

  const response = await fetch(url)

  const data = await response.json()

  const marcas = data.Results
   .map(m=>m.Make_Name)
   .filter(Boolean)

  const batch = db.batch()

  marcas.slice(0,CACHE_LIMIT_MARCAS).forEach(m=>{

   const id = limpiarID(m)

   const ref = db.collection("vehiculos").doc(id)

   batch.set(ref,{
    nombre:m,
    created:Date.now()
   })

  })

  await batch.commit()

  res.json(marcas.slice(0,CACHE_LIMIT_MARCAS))

 }catch(err){

  console.error("ERROR MARCAS:",err)

  res.status(500).json({
   error:"error obteniendo marcas"
  })

 }

}


/*
GET MODELOS
*/

exports.getModelos = async(req,res)=>{

 try{

  const {marca} = req.params

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

  const modelosAPI = await buscarModelosInternet(marca)

  const modelosFinal =
   combinarModelos(marca,modelosAPI)
   .slice(0,CACHE_LIMIT_MODELOS)

  const batch = db.batch()

  modelosFinal.forEach(modelo=>{

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

  res.json(modelosFinal)

 }catch(err){

  console.error("ERROR MODELOS:",err)

  res.status(500).json({
   error:"error obteniendo modelos"
  })

 }

}


/*
GET VERSIONES
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

  if(!snap.empty){

   const versiones = snap.docs.map(d=>d.data().nombre)

   return res.json(versiones)

  }

  const versiones = generarVersiones(modelo)

  const batch = db.batch()

  versiones.forEach(v=>{

   const versionID = limpiarID(v)

   const ref = db
    .collection("vehiculos")
    .doc(marcaID)
    .collection("modelos")
    .doc(modeloID)
    .collection("versiones")
    .doc(versionID)

   batch.set(ref,{
    nombre:v,
    anios:generarAnios(),
    created:Date.now()
   })

  })

  await batch.commit()

  res.json(versiones)

 }catch(err){

  console.error("ERROR VERSIONES:",err)

  res.status(500().json({
   error:"error obteniendo versiones"
  })

 }

}


/*
GET AÑOS
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

  console.error("ERROR AÑOS:",err)

  res.status(500).json({
   error:"error obteniendo años"
  })

 }

}  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"")
  .replace(/[^a-z0-9]/g,"-")
  .replace(/-+/g,"-")
  .replace(/^-|-$/g,"")
}


/*
FILTRAR MARCAS VALIDAS
*/

function filtrarMarcas(lista){

 const permitidas = MARCAS_REALES.map(m => m.toLowerCase())

 return lista.filter(m =>
  permitidas.includes(m.toLowerCase())
 )

}


/*
BUSCAR MODELOS EN API
*/

async function buscarModelosInternet(marca){

 try{

  console.log("🌐 API modelos:", marca)

  const url =
  `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(marca)}?format=json`

  const res = await fetch(url)

  if(!res.ok){
   throw new Error("API error")
  }

  const data = await res.json()

  if(!data.Results){
   console.log("⚠️ API sin resultados")
   return []
  }

  const modelos = data.Results
   .map(m => m.Model_Name)
   .filter(Boolean)

  const unicos = [...new Set(modelos)]

  console.log("Modelos encontrados:", unicos.length)

  return unicos

 }catch(err){

  console.error("❌ Error API modelos:", err)

  return []

 }

}


/*
GET MARCAS
*/

exports.getMarcas = async (req,res)=>{

 try{

  console.log("🚗 GET MARCAS")

  const snap = await db.collection("vehiculos").get()

  console.log("Firestore docs:", snap.size)

  if(!snap.empty){

   const marcas = snap.docs
    .map(d => d.data().nombre)
    .filter(Boolean)

   console.log("Marcas desde cache:", marcas.length)

   return res.json(marcas)

  }

  console.log("⚠️ Firestore vacío → consultando API")

  const url =
  "https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json"

  const response = await fetch(url)

  if(!response.ok){
   throw new Error("API error")
  }

  const data = await response.json()

  console.log("API marcas:", data.Results.length)

  let marcas = data.Results
   .map(m => m.Make_Name)
   .filter(Boolean)

  marcas = filtrarMarcas(marcas)

  console.log("Marcas filtradas:", marcas)

  const batch = db.batch()

  marcas.slice(0,CACHE_LIMIT_MARCAS).forEach(marca => {

   const id = limpiarID(marca)

   const ref = db.collection("vehiculos").doc(id)

   batch.set(ref,{
    nombre:marca,
    created:Date.now()
   })

  })

  await batch.commit()

  console.log("Cache guardado")

  res.json(marcas.slice(0,CACHE_LIMIT_MARCAS))

 }catch(err){

  console.error("ERROR MARCAS:", err)

  res.status(500).json({
   error:"error obteniendo marcas"
  })

 }

}


/*
GET MODELOS
*/

exports.getModelos = async (req,res)=>{

 try{

  const {marca} = req.params

  console.log("🚗 GET MODELOS:", marca)

  const marcaID = limpiarID(marca)

  const snap = await db
   .collection("vehiculos")
   .doc(marcaID)
   .collection("modelos")
   .get()

  console.log("Modelos cache:", snap.size)

  if(!snap.empty){

   const modelos = snap.docs
    .map(d => d.data().nombre)
    .filter(Boolean)

   return res.json(modelos)

  }

  console.log("⚠️ modelos no encontrados en cache")

  const modelosInternet = await buscarModelosInternet(marca)

  const modelos = modelosInternet.slice(0,CACHE_LIMIT_MODELOS)

  const batch = db.batch()

  modelos.forEach(modelo => {

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

  console.log("Modelos guardados")

  res.json(modelos)

 }catch(err){

  console.error("ERROR MODELOS:", err)

  res.status(500).json({
   error:"error obteniendo modelos"
  })

 }

}


/*
GET VERSIONES
*/

exports.getVersiones = async (req,res)=>{

 try{

  const {marca,modelo} = req.params

  console.log("🚗 GET VERSIONES:", marca, modelo)

  const marcaID = limpiarID(marca)
  const modeloID = limpiarID(modelo)

  const snap = await db
   .collection("vehiculos")
   .doc(marcaID)
   .collection("modelos")
   .doc(modeloID)
   .collection("versiones")
   .get()

  console.log("Versiones encontradas:", snap.size)

  if(snap.empty){
   return res.json([])
  }

  const versiones = snap.docs
   .map(d => d.data().nombre)
   .filter(Boolean)

  res.json(versiones)

 }catch(err){

  console.error("ERROR VERSIONES:", err)

  res.status(500).json({
   error:"error obteniendo versiones"
  })

 }

}


/*
GET AÑOS
*/

exports.getAnios = async (req,res)=>{

 try{

  const {marca,modelo,version} = req.params

  console.log("🚗 GET AÑOS:", marca, modelo, version)

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

   console.log("⚠️ No existen años")

   return res.json([])

  }

  const data = doc.data()

  console.log("Años encontrados:", data.anios)

  res.json(data.anios || [])

 }catch(err){

  console.error("ERROR AÑOS:", err)

  res.status(500).json({
   error:"error obteniendo años"
  })

 }

}
