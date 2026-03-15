const { db } = require("../config/firebase")

/*
========================================
CONFIG
========================================
*/

const CACHE_LIMIT_MARCAS = 120
const CACHE_LIMIT_MODELOS = 200
const PARALLEL_BATCH = 20


/*
========================================
LISTA MARCAS REALES
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

 return texto
  .toLowerCase()
  .replace(/\//g,"-")
  .replace(/#/g,"")
  .replace(/\./g,"")
  .replace(/\[/g,"")
  .replace(/\]/g,"")
  .replace(/\s+/g,"-")
  .trim()

}


/*
========================================
FILTRAR MARCAS VALIDAS
========================================
*/

function filtrarMarcas(marcas){

 const set = new Set()

 for(const m of marcas){

  if(MARCAS_REALES.includes(m)){
   set.add(m)
  }

 }

 return [...set]

}


/*
========================================
BUSCAR MODELOS INTERNET
========================================
*/

async function buscarModelosInternet(marca){

 console.log("🌐 Buscando modelos internet:",marca)

 try{

  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${marca}?format=json`

  const res = await fetch(url)

  const data = await res.json()

  if(!data.Results) return []

  const modelos = data.Results.map(m=>m.Model_Name)

  const unicos = [...new Set(modelos)]

  console.log("Modelos encontrados:",unicos.length)

  return unicos

 }catch(err){

  console.error("❌ Error API modelos:",err)

  return []

 }

}


/*
========================================
GET MARCAS
========================================
*/

exports.getMarcas = async(req,res)=>{

 console.log("🚗 GET MARCAS")

 try{

  const snap = await db.collection("vehiculos").get()

  if(!snap.empty){

   const marcas = snap.docs.map(d=>d.data().nombre)

   console.log("Marcas cache:",marcas.length)

   return res.json(marcas)

  }

  console.log("⚠️ Cache vacío → consultando API")

  const url = "https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json"

  const response = await fetch(url)

  const data = await response.json()

  let marcasInternet = data.Results.map(m=>m.Make_Name)

  marcasInternet = filtrarMarcas(marcasInternet)

  console.log("Marcas filtradas:",marcasInternet)

  /*
  GUARDAR CACHE
  */

  const batch = db.batch()

  marcasInternet.slice(0,CACHE_LIMIT_MARCAS).forEach(m=>{

   const id = limpiarID(m)

   const ref = db.collection("vehiculos").doc(id)

   batch.set(ref,{
    nombre:m,
    created:Date.now()
   })

  })

  await batch.commit()

  res.json(marcasInternet)

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

 console.log("🚗 GET MODELOS")

 try{

  const {marca} = req.params

  const marcaID = limpiarID(marca)

  const snap = await db
   .collection("vehiculos")
   .doc(marcaID)
   .collection("modelos")
   .get()

  if(!snap.empty){

   const modelos = snap.docs.map(d=>d.data().nombre)

   console.log("Modelos cache:",modelos.length)

   return res.json(modelos)

  }

  console.log("⚠️ Cache vacío modelos")

  const modelosInternet = await buscarModelosInternet(marca)

  /*
  EVITAR DUPLICADOS
  */

  const modelos = [...new Set(modelosInternet)]

  console.log("Modelos únicos:",modelos.length)

  /*
  GUARDADO PARALELO OPTIMIZADO
  */

  let batch = db.batch()
  let count = 0

  for(const modelo of modelos.slice(0,CACHE_LIMIT_MODELOS)){

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

   count++

   if(count % PARALLEL_BATCH === 0){

    await batch.commit()
    batch = db.batch()

   }

  }

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

  const versiones = snap.docs.map(d=>d.data().nombre)

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

  if(!doc.exists) return res.json([])

  res.json(doc.data().anios || [])

 }catch(err){

  console.error(err)

  res.status(500).json({
   error:"error años"
  })

 }

}
