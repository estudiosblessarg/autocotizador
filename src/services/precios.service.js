const { db } = require("../config/firebase")
const fs = require("fs-extra")
const path = require("path")
const { PdfReader } = require("pdfreader")

const PDF_DIR = path.join(__dirname,"../pdfs")
const PDF_PATH = path.join(PDF_DIR,"acara_precios.pdf")

const USD_TO_ARS = 1500

const MARCAS_VALIDAS = [
 "ALFA","FORD","CHEVROLET","VOLKSWAGEN","TOYOTA","HONDA","NISSAN",
 "RENAULT","PEUGEOT","FIAT","CITROEN","JEEP","RAM",
 "KIA","HYUNDAI","MERCEDES","BMW","AUDI"
]

/*
CREAR CARPETA PDF SI NO EXISTE
*/
async function prepararCarpetas(){
 await fs.ensureDir(PDF_DIR)
}

/*
LIMPIAR PRECIO
*/
function limpiarPrecio(str){

 if(!str) return null

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
DETECTAR MARCA
*/
function detectarMarca(texto){

 for(const marca of MARCAS_VALIDAS){

  if(texto.startsWith(marca))
   return marca

 }

 return null

}

/*
EXTRAER PRECIO
*/
function extraerPrecio(linea){

 const match =
  linea.match(/\d{2,3}\.\d{3},\d{2}/)

 if(!match) return null

 return limpiarPrecio(match[0])

}

/*
DETECTAR AUTO
*/
function detectarAuto(linea){

 const precioUSD = extraerPrecio(linea)

 if(!precioUSD) return null

 const marca = detectarMarca(linea)

 if(!marca) return null

 const texto =
  linea.replace(marca,"")
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
  marca,
  modelo,
  version,
  precioUSD,
  precioARS
 }

}

/*
LEER PDF CON PDFREADER
*/
async function leerPDF(){

 return new Promise((resolve,reject)=>{

  const rows = {}

  new PdfReader().parseFileItems(PDF_PATH,(err,item)=>{

   if(err) return reject(err)

   if(!item){

    const lineas =
     Object.values(rows)
      .map(r => r.join(" "))
      .filter(Boolean)

    resolve(lineas)
    return

   }

   if(item.text){

    const y =
     Math.floor(item.y)

    if(!rows[y])
     rows[y] = []

    rows[y].push(item.text)

   }

  })

 })

}

/*
PROCESAR PDF
*/
async function procesarPDF(){

 if(!await fs.pathExists(PDF_PATH))
  throw new Error("No se encontró el PDF")

 console.log("Leyendo PDF ACARA...")

 const lineas = await leerPDF()

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
ACTUALIZAR CADA 30 DIAS
*/
async function actualizarSiNecesario(){

 try{

  await prepararCarpetas()

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
