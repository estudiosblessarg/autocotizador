const { db } = require("../config/firebase")
const fs = require("fs-extra")
const path = require("path")
const PDFParser = require("pdf2json")

const PDF_DIR = path.join(__dirname,"../pdfs")
const PDF_PATH = path.join(PDF_DIR,"acara_precios.pdf")

const USD_TO_ARS = 1500

const MARCAS_VALIDAS = [
"ALFA","FORD","CHEVROLET","VOLKSWAGEN","TOYOTA","HONDA","NISSAN",
"RENAULT","PEUGEOT","FIAT","CITROEN","JEEP","RAM",
"KIA","HYUNDAI","MERCEDES","BMW","AUDI"
]

/*
PARSEAR PDF
*/
function parsePDF(filePath){

 return new Promise((resolve,reject)=>{

  const pdfParser = new PDFParser()

  pdfParser.on("pdfParser_dataError", err => reject(err))

  pdfParser.on("pdfParser_dataReady", pdfData => {

   let texto = ""

   pdfData.Pages.forEach(page => {

    page.Texts.forEach(text => {

     text.R.forEach(t => {
      texto += decodeURIComponent(t.T) + " "
     })

    })

    texto += "\n"

   })

   resolve(texto)

  })

  pdfParser.loadPDF(filePath)

 })

}

/*
LIMPIAR USD
*/
function limpiarUSD(str){

 const limpio =
  str.replace(/\./g,"")
     .replace(",",".")
     .replace(/[^0-9.]/g,"")

 const num = Number(limpio)

 if(!num || num < 1000)
  return null

 return num

}

/*
DETECTAR PRECIO
*/
function extraerPrecio(linea){

 const match =
  linea.match(/\d{2,3}\.\d{3},\d{2}/)

 if(!match)
  return null

 return limpiarUSD(match[0])

}

/*
DETECTAR AUTO
*/
function detectarAuto(linea){

 const precioUSD = extraerPrecio(linea)

 if(!precioUSD)
  return null

 let marcaDetectada = null

 for(const marca of MARCAS_VALIDAS){

  if(linea.startsWith(marca)){
   marcaDetectada = marca
   break
  }

 }

 if(!marcaDetectada)
  return null

 const texto =
  linea.replace(marcaDetectada,"")
       .replace(/\d{2,3}\.\d{3},\d{2}/,"")
       .trim()

 const partes =
  texto.split(/\s+/)

 if(partes.length < 1)
  return null

 const modelo = partes[0]

 const version =
  partes.slice(1).join(" ")

 const precioARS =
  Math.round(precioUSD * USD_TO_ARS)

 return {
  marca:marcaDetectada,
  modelo,
  version,
  precioUSD,
  precioARS
 }

}

/*
PROCESAR PDF
*/
async function procesarPDF(){

 if(!await fs.pathExists(PDF_PATH))
  throw new Error("No se encontró el PDF")

 console.log("Leyendo PDF ACARA...")

 const texto = await parsePDF(PDF_PATH)

 const lineas = texto.split("\n")

 let batch = db.batch()
 let operaciones = 0
 let total = 0

 for(const linea of lineas){

  const auto = detectarAuto(linea)

  if(!auto) continue

  const {
   marca,
   modelo,
   version,
   precioUSD,
   precioARS
  } = auto

  const id =
   `${marca}_${modelo}_${version}`
   .toLowerCase()
   .replace(/\s+/g,"_")
   .replace(/[^a-z0-9_]/g,"")

  const ref =
   db.collection("precios").doc(id)

  batch.set(ref,{
   marca,
   modelo,
   version,
   precio_usd:precioUSD,
   precio_ars:precioARS,
   conversion:USD_TO_ARS,
   fuente:"ACARA",
   createdAt:new Date()
  })

  operaciones++
  total++

  if(operaciones >= 450){

   await batch.commit()
   batch = db.batch()
   operaciones = 0

  }

 }

 if(operaciones > 0)
  await batch.commit()

 console.log("Autos cargados:",total)

}

/*
ACTUALIZAR
*/
async function actualizarSiNecesario(){

 try{

  const doc =
   await db.collection("config")
    .doc("precios")
    .get()

  if(!doc.exists){

   console.log("Base vacía, procesando PDF")

   await procesarPDF()

   await db.collection("config")
    .doc("precios")
    .set({
     updated:new Date()
    })

   return

  }

  const last = doc.data().updated

  const dias =
   (Date.now() - new Date(last))
   /(1000*60*60*24)

  if(dias > 30){

   console.log("Actualizando precios")

   await procesarPDF()

   await db.collection("config")
    .doc("precios")
    .update({
     updated:new Date()
    })

  }

 }catch(err){

  console.error("Error cargando precios:",err)

 }

}

module.exports = {
 actualizarSiNecesario
}
