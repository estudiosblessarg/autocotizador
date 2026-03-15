const { db } = require("../config/firebase")

const fetch = (...args) =>
 import("node-fetch").then(({ default: fetch }) => fetch(...args))

const CACHE_LIMIT_MARCAS = 80
const CACHE_LIMIT_MODELOS = 200

const MODELOS_EXTRA = {

 Peugeot:["208","2008","308","3008","408","5008","Partner","Expert","Boxer","RCZ"],

 Renault:["Clio","Megane","Sandero","Logan","Duster","Kwid","Captur","Koleos"],

 Fiat:["500","Argo","Cronos","Pulse","Toro","Strada","Mobi","Uno"],

 Chevrolet:["Onix","Cruze","Tracker","S10","Spin","Captiva","Equinox"],

 Volkswagen:["Golf","Polo","Virtus","Jetta","Tiguan","Taos","Amarok"],

 Toyota:["Corolla","Corolla Cross","Hilux","RAV4","Yaris","Camry","Land Cruiser"]

}

const VERSIONES_BASE=[
"Base","SE","LE","Sport","Premium","Limited","Touring","GT"
]

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

function generarVersiones(modelo){

 return VERSIONES_BASE.map(v => `${modelo} ${v}`)

}

function generarAnios(){

 const anios=[]
 const actual=new Date().getFullYear()

 for(let a=actual;a>=2000;a--){
  anios.push(a)
 }

 return anios

}

function combinarModelos(marca,apiModelos){

 const extra = MODELOS_EXTRA[marca] || []

 const lista = [...apiModelos,...extra]

 return [...new Set(lista)]

}

async function buscarModelosInternet(marca){

 try{

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

  console.error("API modelos error:",err)

  return []

 }

}

exports.getMarcas = async(req,res)=>{

 try{

  const snap = await db.collection("vehiculos").get()

  if(!snap.empty){

   const marcas = snap.docs
    .map(d=>d.data().nombre)
    .filter(Boolean)

   return res.json(marcas)

  }

  const url="https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json"

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

  res.status(500).json({
   error:"error obteniendo versiones"
  })

 }

}

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

}
