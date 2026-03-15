const { db } = require("../config/firebase")
const fs = require("fs-extra")
const path = require("path")
const csv = require("csv-parser")

const PDF_DIR = path.join(__dirname,"../pdfs")

const USD_TO_ARS = 1500

const MARCAS_VALIDAS = [
"ALFA","FORD","CHEVROLET","VOLKSWAGEN","TOYOTA","HONDA","NISSAN",
"RENAULT","PEUGEOT","FIAT","CITROEN","JEEP","RAM",
"KIA","HYUNDAI","MERCEDES","BMW","AUDI"
]

/*
CREAR CARPETA
*/
async function prepararCarpetas(){
 await fs.ensureDir(PDF_DIR)
}

/*
UNIR CSV POR PREFIJO
*/
async function unirCSVs(){

 const archivos = await fs.readdir(PDF_DIR)

 const csvFiles =
  archivos.filter(f => f.endsWith(".csv"))

 const grupos = {}

 for(const file of csvFiles){

  const prefijo =
   file.split("_")[0]

  if(!grupos[prefijo])
   grupos[prefijo] = []

  grupos[prefijo].push(file)

 }

 const archivosFinales = []

 for(const prefijo in grupos){

  const lista = grupos[prefijo]

  if(lista.length === 1){

   archivosFinales.push(
    path.join(PDF_DIR,lista[0])
   )

   continue

  }

  const merged =
   path.join(PDF_DIR,`_merged_${prefijo}.csv`)

  const write =
   fs.createWriteStream(merged)

  for(const file of lista){

   const data =
    await fs.readFile(
     path.join(PDF_DIR,file)
    )

   write.write(data)

  }

  write.end()

  archivosFinales.push(merged)

 }

 return archivosFinales

}

/*
LIMPIAR PRECIO
*/
function limpiarPrecio(str){

 if(!str) return null

 const limpio =
  str.toString()
     .replace(/\./g,"")
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

 texto = texto.toUpperCase()

 for(const marca of MARCAS_VALIDAS){

  if(texto.startsWith(marca))
   return marca

 }

 return null

}

/*
DETECTAR AUTO
*/
function detectarAuto(linea){

 const precioMatch =
  linea.match(/\d{2,3}\.\d{3},\d{2}/)

 if(!precioMatch)
  return null

 const precioUSD =
  limpiarPrecio(precioMatch[0])

 if(!precioUSD)
  return null

 const marca =
  detectarMarca(linea)

 if(!marca)
  return null

 const texto =
  linea.replace(marca,"")
       .replace(precioMatch[0],"")
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
PROCESAR CSV
*/
async function procesarCSV(csvPath){

 console.log("Procesando:",csvPath)

 return new Promise((resolve,reject)=>{

  let batch = db.batch()
  let operaciones = 0
  let total = 0

  fs.createReadStream(csvPath)
   .pipe(csv())
   .on("data", async (row)=>{

    try{

     const linea =
      Object.values(row).join(" ")

     const auto =
      detectarAuto(linea)

     if(!auto)
      return

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
PROCESAR ARCHIVOS
*/
async function procesarArchivo(){

 await prepararCarpetas()

 const archivos =
  await unirCSVs()

 console.log("Archivos a procesar:",archivos.length)

 for(const archivo of archivos){

  await procesarCSV(archivo)

 }

}

/*
ACTUALIZAR CADA 30 DIAS
*/
async function actualizarSiNecesario(){

 try{

  const doc =
   await db.collection("config")
    .doc("precios")
    .get()

  if(!doc.exists){

   console.log("Base vacía, procesando CSV")

   await procesarArchivo()

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

   await procesarArchivo()

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
