const { db } = require("../config/firebase")
const fs = require("fs-extra")
const path = require("path")
const pdfParse = require("pdf-parse")

const fetch = (...args) =>
 import("node-fetch").then(({ default: fetch }) => fetch(...args))

/*
CARPETA PDF
*/

const PDF_DIR = path.join(__dirname,"../data/pdfs")
const PDF_PATH = path.join(PDF_DIR,"acara.pdf")

/*
DESCARGAR PDF ACARA
*/

async function descargarPDF(){

 const url =
 "https://acara.org.ar/wp-content/uploads/2024/01/listado-precios.pdf"

 await fs.ensureDir(PDF_DIR)

 const res = await fetch(url)

 if(!res.ok){
  throw new Error("No se pudo descargar PDF")
 }

 const buffer = await res.arrayBuffer()

 await fs.writeFile(PDF_PATH,Buffer.from(buffer))

}

/*
PARSEAR PDF
*/

async function procesarPDF(){

 const dataBuffer = await fs.readFile(PDF_PATH)

 const data = await pdfParse(dataBuffer)

 const lineas = data.text.split("\n")

 const batch = db.batch()

 for(const linea of lineas){

  const partes = linea.trim().split(/\s+/)

  if(partes.length < 5) continue

  const marca = partes[0]
  const modelo = partes[1]
  const version = partes[2]
  const anio = partes[3]
  const precio = partes[4]

  if(!marca || !modelo || !anio || !precio) continue

  const precioNumero =
   Number(precio.replace(/\./g,""))

  if(!precioNumero) continue

  const id =
   `${marca}_${modelo}_${version}_${anio}`
    .toLowerCase()
    .replace(/\s/g,"_")

  const ref = db.collection("precios").doc(id)

  batch.set(ref,{

   marca,
   modelo,
   version,
   anio:Number(anio),
   precio:precioNumero,
   fuente:"ACARA",
   createdAt:new Date()

  })

 }

 await batch.commit()

 await fs.remove(PDF_PATH)

}

/*
BUSCAR PRECIO EN DB
*/

async function buscarPrecioDB(marca,modelo,version,anio){

 const id =
  `${marca}_${modelo}_${version}_${anio}`
   .toLowerCase()
   .replace(/\s/g,"_")

 const doc =
  await db.collection("precios").doc(id).get()

 if(!doc.exists) return null

 return doc.data().precio

}

/*
BUSCAR PRECIO INTERNET (fallback)
*/

async function buscarPrecioVehiculo(marca,modelo,anio){

 try{

  const query =
   `${marca} ${modelo} ${anio}`

  const url =
  `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(query)}&category=MLA1744&limit=10`

  const res = await fetch(url)

  const data = await res.json()

  if(!data.results) return null

  const precios =
   data.results.map(v=>v.price).filter(Boolean)

  if(!precios.length) return null

  const promedio =
   precios.reduce((a,b)=>a+b,0) / precios.length

  return Math.round(promedio)

 }catch(err){

  return null

 }

}

/*
CONFIG ADMIN
*/

async function obtenerConfigKM(){

 const doc =
  await db.collection("config").doc("km").get()

 if(!doc.exists) return {descuento:0}

 return doc.data()

}

/*
COTIZAR
*/

exports.cotizar = async(req,res)=>{

 try{

  const {marca,modelo,version,anio,km} = req.body

  let precio =
   await buscarPrecioDB(marca,modelo,version,anio)

  /*
  SI NO EXISTE EN DB → PDF
  */

  if(!precio){

   await descargarPDF()

   await procesarPDF()

   precio =
    await buscarPrecioDB(marca,modelo,version,anio)

  }

  /*
  SI SIGUE SIN PRECIO → INTERNET
  */

  if(!precio){

   precio =
    await buscarPrecioVehiculo(marca,modelo,anio)

  }

  if(!precio){

   return res.status(400).json({
    success:false,
    error:"No se pudo obtener precio"
   })

  }

  /*
  CONFIG ADMIN
  */

  const config = await obtenerConfigKM()

  const descuento =
   Number(config.descuento || 0)

  /*
  AJUSTE KM
  */

  let ajusteKm = 0

  const kmNumero = Number(km)

  if(kmNumero > 100000) ajusteKm = 0.15
  else if(kmNumero > 70000) ajusteKm = 0.10
  else if(kmNumero > 40000) ajusteKm = 0.05

  const precioKm =
   precio - (precio * ajusteKm)

  const descuentoValor =
   precioKm * (descuento/100)

  const precioFinal =
   Math.round(precioKm - descuentoValor)

  /*
  GUARDAR COTIZACION
  */

  const cotizacion = {

   marca,
   modelo,
   version,
   anio,
   km,

   precioBase:precio,
   descuentoPorcentaje:descuento,
   precioFinal,

   createdAt:new Date()

  }

  const ref =
   await db.collection("cotizaciones").add(cotizacion)

  res.json({

   success:true,
   id:ref.id,
   precioBase:precio,
   descuento,
   precioFinal

  })

 }catch(error){

  console.log(error)

  res.status(500).json({
   success:false,
   error:error.message
  })

 }

}
