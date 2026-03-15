const { db } = require("../config/firebase")
const fs = require("fs-extra")
const path = require("path")

const fetch = (...args) =>
 import("node-fetch").then(({ default: fetch }) => fetch(...args))

/*
PDF CONFIG
*/

const PDF_DIR = path.join(__dirname,"../data/pdfs")
const PDF_PATH = path.join(PDF_DIR,"acara.pdf")

const PDF_URL =
"https://acara.org.ar/wp-content/uploads/2024/01/listado-precios.pdf"

/*
MARCAS VALIDAS
*/

const MARCAS_VALIDAS = [
"FORD",
"CHEVROLET",
"VOLKSWAGEN",
"TOYOTA",
"HONDA",
"NISSAN",
"RENAULT",
"PEUGEOT",
"FIAT",
"CITROEN",
"JEEP",
"RAM",
"KIA",
"HYUNDAI",
"MERCEDES-BENZ",
"BMW",
"AUDI"
]

/*
PARSE PDF
*/

async function parsePDF(buffer){

 const pdf = await import("pdf-parse")
 const parser = pdf.default || pdf

 return parser(buffer)

}

/*
VERIFICAR SI HAY QUE ACTUALIZAR
*/

async function necesitaActualizar(){

 const doc =
  await db.collection("config")
   .doc("precios")
   .get()

 if(!doc.exists) return true

 const data = doc.data()

 if(!data.ultimaActualizacion) return true

 const ultima =
  new Date(data.ultimaActualizacion)

 const ahora = new Date()

 const dias =
  (ahora - ultima) / (1000*60*60*24)

 return dias > 30

}

/*
DESCARGAR PDF
*/

async function descargarPDF(){

 await fs.ensureDir(PDF_DIR)

 const res = await fetch(PDF_URL)

 if(!res.ok){
  throw new Error("Error descargando PDF")
 }

 const buffer = await res.arrayBuffer()

 await fs.writeFile(PDF_PATH,Buffer.from(buffer))

 console.log("PDF descargado")

}

/*
PROCESAR PDF
*/

async function procesarPDF(){

 const buffer = await fs.readFile(PDF_PATH)

 const data = await parsePDF(buffer)

 const lineas = data.text.split("\n")

 let batch = db.batch()
 let operaciones = 0

 for(const linea of lineas){

  const partes = linea.trim().split(/\s+/)

  if(partes.length < 5) continue

  const marca = partes[0]

  if(!MARCAS_VALIDAS.includes(marca)) continue

  const precio =
   Number(partes[partes.length-1].replace(/\./g,""))

  const anio =
   Number(partes[partes.length-2])

  if(anio < 1990 || anio > 2030) continue

  if(!precio) continue

  const modelo = partes[1]

  const version =
   partes.slice(2,partes.length-2).join(" ")

  const id =
   `${marca}_${modelo}_${version}_${anio}`
   .toLowerCase()
   .replace(/\s/g,"_")

  const ref =
   db.collection("precios").doc(id)

  batch.set(ref,{

   marca,
   modelo,
   version,
   anio,
   precio,
   fuente:"ACARA",
   createdAt:new Date()

  })

  operaciones++

  if(operaciones === 450){

   await batch.commit()

   batch = db.batch()
   operaciones = 0

  }

 }

 if(operaciones > 0){
  await batch.commit()
 }

 await db.collection("config")
  .doc("precios")
  .set({
   ultimaActualizacion:new Date()
  })

 await fs.remove(PDF_PATH)

 console.log("PDF procesado correctamente")

}

/*
ACTUALIZAR PRECIOS
*/

async function verificarActualizarPrecios(){

 const snapshot =
  await db.collection("precios")
   .limit(1)
   .get()

 const vacia = snapshot.empty

 const actualizar =
  await necesitaActualizar()

 if(vacia || actualizar){

  console.log("Actualizando base de precios")

  await descargarPDF()
  await procesarPDF()

 }

}

/*
PRECIO PROMEDIO (ignora version)
*/

async function obtenerPrecioPromedio(marca,modelo,anio){

 const snap =
  await db.collection("precios")
   .where("marca","==",marca)
   .where("modelo","==",modelo)
   .where("anio","==",Number(anio))
   .get()

 if(snap.empty) return null

 const precios = []

 snap.forEach(doc=>{
  precios.push(doc.data().precio)
 })

 const promedio =
  precios.reduce((a,b)=>a+b,0) / precios.length

 return Math.round(promedio)

}

/*
CONFIG KM
*/

async function obtenerConfigKM(){

 const doc =
  await db.collection("config")
   .doc("km")
   .get()

 if(!doc.exists) return {descuento:0}

 return doc.data()

}

/*
COTIZAR
*/

exports.cotizar = async(req,res)=>{

 try{

  const {marca,modelo,anio,km} = req.body

  await verificarActualizarPrecios()

  const precio =
   await obtenerPrecioPromedio(marca,modelo,anio)

  if(!precio){

   return res.status(400).json({
    success:false,
    error:"Modelo no encontrado"
   })

  }

  const config =
   await obtenerConfigKM()

  const descuento =
   Number(config.descuento || 0)

  let ajusteKm = 0

  if(km > 100000) ajusteKm = 0.15
  else if(km > 70000) ajusteKm = 0.10
  else if(km > 40000) ajusteKm = 0.05

  const precioKm =
   precio - (precio * ajusteKm)

  const precioFinal =
   Math.round(
    precioKm - (precioKm * (descuento/100))
   )

  console.log("------ COTIZACION ------")
  console.log("MARCA:",marca)
  console.log("MODELO:",modelo)
  console.log("AÑO:",anio)
  console.log("PRECIO:",precioFinal)

  const ref =
   await db.collection("cotizaciones")
    .add({

     marca,
     modelo,
     anio,
     km,

     precioBase:precio,
     precioFinal,

     createdAt:new Date()

    })

  res.json({

   success:true,
   id:ref.id,
   precioBase:precio,
   precioFinal

  })

 }catch(err){

  console.log(err)

  res.status(500).json({
   success:false,
   error:err.message
  })

 }

}
