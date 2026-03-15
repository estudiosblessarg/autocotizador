const { db } = require("../config/firebase")
const fs = require("fs-extra")
const path = require("path")

let pdfModule = require("pdf-parse")
const pdfParse = pdfModule.default || pdfModule

const fetch = (...args) =>
 import("node-fetch").then(({ default: fetch }) => fetch(...args))

/*
CARPETA PDF
*/

const PDF_DIR = path.join(__dirname,"../data/pdfs")
const PDF_PATH = path.join(PDF_DIR,"acara.pdf")

/*
DESCARGAR PDF
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

 console.log("PDF descargado")

}

/*
PROCESAR PDF ACARA
*/

async function procesarPDF(){

 try{

  const dataBuffer = await fs.readFile(PDF_PATH)

  const data = await parsePDF(dataBuffer)

  const lineas = data.text.split("\n")

  let batch = db.batch()
  let operaciones = 0

  for(const linea of lineas){

   const partes = linea.trim().split(/\s+/)

   if(partes.length < 5) continue

   const marca = partes[0]
   const modelo = partes[1]
   const version = partes.slice(2,partes.length-2).join(" ")
   const anio = partes[partes.length-2]
   const precio = partes[partes.length-1]

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

  console.log("PDF procesado correctamente")

  await fs.remove(PDF_PATH)

 }catch(err){

  console.log("Error procesando PDF:",err)

 }

}
/*
VERIFICAR MODELO OFICIAL
*/

async function validarVehiculoOficial(marca,modelo,anio){

 const snapshot =
  await db.collection("precios")
   .where("marca","==",marca)
   .where("modelo","==",modelo)
   .where("anio","==",Number(anio))
   .limit(1)
   .get()

 return !snapshot.empty

}

/*
PROMEDIAR PRECIOS POR MODELO Y AÑO
IGNORA VERSION
*/

async function obtenerPrecioPromedio(marca,modelo,anio){

 const snapshot =
  await db.collection("precios")
   .where("marca","==",marca)
   .where("modelo","==",modelo)
   .where("anio","==",Number(anio))
   .get()

 if(snapshot.empty) return null

 const precios = []

 snapshot.forEach(doc=>{
  precios.push(doc.data().precio)
 })

 const promedio =
  precios.reduce((a,b)=>a+b,0) / precios.length

 return Math.round(promedio)

}

/*
BUSCAR PRECIO INTERNET
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

  console.log("Error MercadoLibre:",err)

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

  /*
  VALIDAR VEHICULO OFICIAL
  */

  let esOficial =
   await validarVehiculoOficial(marca,modelo,anio)

  /*
  SI NO EXISTE → CARGAR PDF
  */

  if(!esOficial){

   console.log("Modelo no encontrado, cargando PDF ACARA")

   await descargarPDF()
   await procesarPDF()

   esOficial =
    await validarVehiculoOficial(marca,modelo,anio)

  }

  if(!esOficial){

   return res.status(400).json({
    success:false,
    error:"Vehiculo no reconocido oficialmente"
   })

  }

  /*
  OBTENER PRECIO PROMEDIO
  */

  let precio =
   await obtenerPrecioPromedio(marca,modelo,anio)

  /*
  FALLBACK INTERNET
  */

  if(!precio){

   precio =
    await buscarPrecioVehiculo(marca,modelo,anio)

  }

  if(!precio){

   return res.status(400).json({
    success:false,
    error:"No se pudo calcular precio"
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
  LOG CONSOLA
  */

  console.log("----- COTIZACION -----")
  console.log("MARCA:",marca)
  console.log("MODELO:",modelo)
  console.log("AÑO:",anio)
  console.log("PRECIO CALCULADO:",precioFinal)

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

  console.log("Error cotizacion:",error)

  res.status(500).json({
   success:false,
   error:error.message
  })

 }

}
