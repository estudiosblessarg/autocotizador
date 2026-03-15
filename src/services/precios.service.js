const { db } = require("../config/firebase")
const fs = require("fs-extra")
const path = require("path")
const Tabula = require("tabula-js")
const csv = require("csv-parser")

const PDF_DIR = path.join(__dirname, "../pdfs")
const DATA_DIR = path.join(__dirname, "../data")

const PDF_PATH = path.join(PDF_DIR, "acara_precios.pdf")
const CSV_PATH = path.join(DATA_DIR, "acara_autos.csv")

const USD_TO_ARS = 1500

const MARCAS_VALIDAS = [
 "ALFA","FORD","CHEVROLET","VOLKSWAGEN","TOYOTA","HONDA","NISSAN",
 "RENAULT","PEUGEOT","FIAT","CITROEN","JEEP","RAM",
 "KIA","HYUNDAI","MERCEDES","BMW","AUDI"
]

/*
CREAR DIRECTORIOS
*/
async function prepararCarpetas(){

 await fs.ensureDir(PDF_DIR)
 await fs.ensureDir(DATA_DIR)

}

/*
CONVERTIR PDF A CSV CON TABULA
*/
async function convertirPDFaCSV(){

 console.log("Convirtiendo PDF a CSV con Tabula...")

 return new Promise((resolve,reject)=>{

  const tabula = new Tabula(PDF_PATH,{
   pages:"all",
   guess:true
  })

  const stream =
   fs.createWriteStream(CSV_PATH)

  tabula.streamCsv()
   .pipe(stream)

  stream.on("finish",()=>{
   console.log("CSV generado")
   resolve()
  })

  stream.on("error",reject)

 })

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
PARSEAR CSV
*/
async function procesarCSV(){

 return new Promise((resolve,reject)=>{

  let batch = db.batch()
  let operaciones = 0
  let total = 0

  fs.createReadStream(CSV_PATH)
   .pipe(csv({ separator: "," }))
   .on("data", async (row)=>{

    try{

     const valores =
      Object.values(row)

     const linea =
      valores.join(" ")

     const marca =
      detectarMarca(linea)

     if(!marca) return

     const precioMatch =
      linea.match(/\d{2,3}\.\d{3},\d{2}/)

     if(!precioMatch) return

     const precioUSD =
      limpiarPrecio(precioMatch[0])

     if(!precioUSD) return

     const texto =
      linea.replace(marca,"")
           .replace(precioMatch[0],"")
           .trim()

     const partes =
      texto.split(/\s+/)

     const modelo =
      partes[0]

     const version =
      partes.slice(1).join(" ")

     const precioARS =
      Math.round(precioUSD * USD_TO_ARS)

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

    }catch(err){
     console.error(err)
    }

   })
   .on("end", async ()=>{

    if(operaciones > 0)
     await batch.commit()

    console.log("Autos cargados:",total)

    resolve()

   })
   .on("error",reject)

 })

}

/*
PIPELINE COMPLETO
*/
async function procesarPDF(){

 if(!await fs.pathExists(PDF_PATH))
  throw new Error("No se encontró el PDF en /pdfs")

 await prepararCarpetas()

 await convertirPDFaCSV()

 await procesarCSV()

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
