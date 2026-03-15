const { db } = require("../config/firebase")
const fs = require("fs-extra")
const path = require("path")
const pdfParse = require("pdf-parse")

const fetch = (...args) =>
 import("node-fetch").then(({ default: fetch }) => fetch(...args))

const PDF_DIR = path.join(__dirname,"../data/pdfs")
const PDF_PATH = path.join(PDF_DIR,"acara.pdf")

const PDF_URL =
"https://acara.org.ar/wp-content/uploads/2024/01/listado-precios.pdf"

const MARCAS_VALIDAS = [
"FORD","CHEVROLET","VOLKSWAGEN","TOYOTA","HONDA","NISSAN",
"RENAULT","PEUGEOT","FIAT","CITROEN","JEEP","RAM",
"KIA","HYUNDAI","MERCEDES-BENZ","BMW","AUDI"
]

async function descargarPDF(){

 await fs.ensureDir(PDF_DIR)

 const res = await fetch(PDF_URL)

 if(!res.ok)
  throw new Error("Error descargando PDF")

 const buffer = await res.arrayBuffer()

 await fs.writeFile(PDF_PATH,Buffer.from(buffer))

 console.log("PDF descargado")

}

async function parsePDF(buffer){

 return pdfParse(buffer)

}

function limpiarPrecio(texto){

 if(!texto) return null

 const limpio =
  texto.replace(/\./g,"")
       .replace(/,/g,"")
       .replace(/[^0-9]/g,"")

 const numero = Number(limpio)

 if(!numero || numero < 1000000) return null

 return numero

}

function detectarLineaAuto(linea){

 const matchPrecio =
  linea.match(/(\d{1,3}(\.\d{3})+)/g)

 if(!matchPrecio) return null

 const precio = limpiarPrecio(matchPrecio.pop())

 if(!precio) return null

 const matchAnio =
  linea.match(/\b(19|20)\d{2}\b/)

 if(!matchAnio) return null

 const anio = Number(matchAnio[0])

 const partes = linea.split(" ")

 const marca = partes[0]

 if(!MARCAS_VALIDAS.includes(marca))
  return null

 const resto =
  linea.replace(marca,"")
       .replace(matchAnio[0],"")
       .replace(matchPrecio[0],"")
       .trim()

 const tokens = resto.split(/\s+/)

 if(tokens.length === 0) return null

 const modelo = tokens[0]

 const version =
  tokens.slice(1).join(" ")

 return {
  marca,
  modelo,
  version,
  anio,
  precio
 }

}

async function procesarPDF(){

 const buffer = await fs.readFile(PDF_PATH)

 const data = await parsePDF(buffer)

 const lineas = data.text.split("\n")

 let batch = db.batch()
 let operaciones = 0

 let total = 0

 for(const linea of lineas){

  const auto = detectarLineaAuto(linea)

  if(!auto) continue

  const {marca,modelo,version,anio,precio} = auto

  const id =
  `${marca}_${modelo}_${version}_${anio}`
   .toLowerCase()
   .replace(/\s+/g,"_")
   .replace(/[^a-z0-9_]/g,"")

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
  total++

  if(operaciones >= 450){

   await batch.commit()

   batch = db.batch()
   operaciones = 0

  }

 }

 if(operaciones > 0)
  await batch.commit()

 await fs.remove(PDF_PATH)

 console.log("Autos cargados:",total)

}

async function actualizarSiNecesario(){

 const doc =
  await db.collection("config")
   .doc("precios")
   .get()

 if(!doc.exists){

  console.log("Base vacia, cargando ACARA")

  await descargarPDF()
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

  console.log("Actualizando precios ACARA")

  await descargarPDF()
  await procesarPDF()

  await db.collection("config")
   .doc("precios")
   .update({
    updated:new Date()
   })

 }

}

module.exports = {
 actualizarSiNecesario
}
