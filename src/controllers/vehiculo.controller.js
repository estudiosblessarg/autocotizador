const { db } = require("../config/firebase")

const fetch = (...args) =>
 import("node-fetch").then(({default: fetch}) => fetch(...args))


/*
CONFIG
*/

const CACHE_LIMIT_MARCAS = 80
const CACHE_LIMIT_MODELOS = 150


/*
MARCAS PERMITIDAS
*/

const MARCAS_REALES = [
"Toyota","Ford","Chevrolet","Nissan","Honda","BMW","Mercedes-Benz","Audi",
"Volkswagen","Hyundai","Kia","Mazda","Subaru","Jeep","Ram","Dodge",
"Lexus","Volvo","Peugeot","Renault","Fiat","Citroen","Mitsubishi",
"Suzuki","Mini","Land Rover","Jaguar","Porsche","Ferrari","Lamborghini",
"Maserati","Tesla","Genesis","Chery","BYD","Great Wall","Haval"
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
FILTRAR MARCAS
*/

function filtrarMarcas(lista){

 const permitidas = MARCAS_REALES.map(m=>m.toLowerCase())

 return lista.filter(m =>
  permitidas.includes(m.toLowerCase())
 )

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
   console.log("⚠️ API sin resultados")
   return []
  }

  const modelos = data.Results
   .map(m=>m.Model_Name)
   .filter(Boolean)

  const unicos = [...new Set(modelos)]

  console.log("Modelos encontrados:",unicos.length)

  return unicos

 }catch(err){

  console.error("Error API modelos",err)

  return []

 }

}


/*
GET MARCAS
*/

exports.getMarcas = async(req,res)=>{

 try{

  console.log("🚗 GET MARCAS")

  const snap = await db.collection("vehiculos").get()

  console.log("Firestore docs:",snap.size)

  if(!snap.empty){

   const marcas = snap.docs
    .map(d=>d.data().nombre)
    .filter(Boolean)

   console.log("Marcas desde cache:",marcas.length)

   return res.json(marcas)

  }

  console.log("⚠️ Firestore vacío → API")

  const url =
  "https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json"

  const response = await fetch(url)

  if(!response.ok){
   throw new Error("API error")
  }

  const data = await response.json()

  console.log("API marcas:",data.Results.length)

  let marcas = data.Results
   .map(m=>m.Make_Name)
   .filter(Boolean)

  marcas = filtrarMarcas(marcas)

  console.log("Marcas filtradas:",marcas)

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

  console.log("Cache guardado")

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

  console.log("🚗 GET MODELOS:",marca)

  const marcaID = limpiarID(marca)

  const snap = await db
   .collection("vehiculos")
   .doc(marcaID)
   .collection("modelos")
   .get()

  console.log("Modelos cache:",snap.size)

  if(!snap.empty){

   const modelos = snap.docs
    .map(d=>d.data().nombre)
    .filter(Boolean)

   return res.json(modelos)

  }

  console.log("⚠️ modelos no cache")

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

  console.log("Modelos guardados")

  res.json(modelos)

 }catch(err){

  console.error("ERROR MODELOS:",err)

  res.status(500).json({
   error:"error obteniendo modelos"
  })

 }

}
