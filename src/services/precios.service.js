const { db } = require("../config/firebase")
const fs = require("fs-extra")
const path = require("path")

const fetch = (...args) =>
 import("node-fetch").then(({ default: fetch }) => fetch(...args))

const PDF_DIR = path.join(__dirname,"../data/pdfs")
const PDF_PATH = path.join(PDF_DIR,"acara.pdf")

const PDF_URL =
"https://acara.org.ar/wp-content/uploads/2024/01/listado-precios.pdf"

const MARCAS_VALIDAS=[
"FORD","CHEVROLET","VOLKSWAGEN","TOYOTA","HONDA","NISSAN",
"RENAULT","PEUGEOT","FIAT","CITROEN","JEEP","RAM",
"KIA","HYUNDAI","MERCEDES-BENZ","BMW","AUDI"
]

async function parsePDF(buffer){

 const module = await import("pdf-parse")

 const parser =
  module.default?.default ||
  module.default ||
  module

 return parser(buffer)

}

async function descargarPDF(){

 await fs.ensureDir(PDF_DIR)

 const res = await fetch(PDF_URL)

 if(!res.ok)
  throw new Error("Error descargando PDF")

 const buffer = await res.arrayBuffer()

 await fs.writeFile(PDF_PATH,Buffer.from(buffer))

}

async function procesarPDF(){

 const buffer = await fs.readFile(PDF_PATH)

 const data = await parsePDF(buffer)

 const lineas=data.text.split("\n")

 let batch=db.batch()
 let ops=0

 for(const linea of lineas){

  const partes=linea.trim().split(/\s+/)

  if(partes.length<5) continue

  const marca=partes[0]

  if(!MARCAS_VALIDAS.includes(marca)) continue

  const precio=
   Number(partes[partes.length-1].replace(/\./g,""))

  const anio=
   Number(partes[partes.length-2])

  if(!precio || anio<1990 || anio>2030) continue

  const modelo=partes[1]

  const version=
   partes.slice(2,partes.length-2).join(" ")

  const id=
  `${marca}_${modelo}_${version}_${anio}`
   .toLowerCase()
   .replace(/\s/g,"_")

  const ref=db.collection("precios").doc(id)

  batch.set(ref,{
   marca,
   modelo,
   version,
   anio,
   precio
  })

  ops++

  if(ops===450){

   await batch.commit()
   batch=db.batch()
   ops=0

  }

 }

 if(ops>0) await batch.commit()

 await fs.remove(PDF_PATH)

 console.log("ACARA cargado")

}

async function actualizarSiNecesario(){

 const config=
  await db.collection("config")
   .doc("precios")
   .get()

 if(!config.exists){

  await descargarPDF()
  await procesarPDF()

  await db.collection("config")
   .doc("precios")
   .set({
    updated:new Date()
   })

  return
 }

 const last=config.data().updated

 const dias=
  (Date.now()-new Date(last))/(1000*60*60*24)

 if(dias>30){

  await descargarPDF()
  await procesarPDF()

  await db.collection("config")
   .doc("precios")
   .update({
    updated:new Date()
   })

 }

}

module.exports={
 actualizarSiNecesario
}