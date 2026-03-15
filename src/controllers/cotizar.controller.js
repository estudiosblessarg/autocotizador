const { db } = require("../config/firebase")
const fs = require("fs-extra")
const path = require("path")

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

/*
PDF PARSER SEGURO
*/
async function parsePDF(buffer){

 const module = await import("pdf-parse")

 const parser =
  module.default?.default ||
  module.default ||
  module

 return parser(buffer)

}

/*
DESCARGAR PDF
*/

async function descargarPDF(){

 await fs.ensureDir(PDF_DIR)

 const res = await fetch(PDF_URL)

 if(!res.ok)
  throw new Error("Error descargando PDF")

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
   createdAt:new Date()
  })

  operaciones++

  if(operaciones === 450){

   await batch.commit()

   batch = db.batch()
   operaciones = 0

  }

 }

 if(operaciones>0)
  await batch.commit()

 await fs.remove(PDF_PATH)

 console.log("PDF procesado correctamente")

}

/*
VERIFICAR ACTUALIZACION
*/

async function verificarActualizarPrecios(){

 const snapshot =
  await db.collection("precios")
  .limit(1)
  .get()

 if(snapshot.empty){

  console.log("DB vacia → cargando PDF")

  await descargarPDF()
  await procesarPDF()

 }

}

/*
GENERAR COLECCIONES DERIVADAS
*/

async function generarColecciones(){

 const snap =
  await db.collection("precios").get()

 const marcas = new Set()
 const modelos = {}
 const versiones = {}
 const anios = {}

 snap.forEach(doc=>{

  const d = doc.data()

  marcas.add(d.marca)

  if(!modelos[d.marca])
   modelos[d.marca] = new Set()

  modelos[d.marca].add(d.modelo)

  const keyModelo =
   `${d.marca}_${d.modelo}`

  if(!versiones[keyModelo])
   versiones[keyModelo] = new Set()

  versiones[keyModelo].add(d.version)

  const keyVersion =
   `${d.marca}_${d.modelo}_${d.version}`

  if(!anios[keyVersion])
   anios[keyVersion] = new Set()

  anios[keyVersion].add(d.anio)

 })

 /*
 GUARDAR MARCAS
 */

 const batch = db.batch()

 marcas.forEach(m=>{

  const ref =
   db.collection("marcas").doc(m)

  batch.set(ref,{nombre:m})

 })

 await batch.commit()

}

/*
ENDPOINT MARCAS
*/

exports.obtenerMarcas = async(req,res)=>{

 await verificarActualizarPrecios()

 const snap =
  await db.collection("precios")
  .select("marca")
  .get()

 const marcas = new Set()

 snap.forEach(doc=>{
  marcas.add(doc.data().marca)
 })

 res.json([...marcas].sort())

}

/*
ENDPOINT MODELOS
*/

exports.obtenerModelos = async(req,res)=>{

 const {marca} = req.params

 const snap =
  await db.collection("precios")
   .where("marca","==",marca)
   .select("modelo")
   .get()

 const modelos = new Set()

 snap.forEach(doc=>{
  modelos.add(doc.data().modelo)
 })

 res.json([...modelos].sort())

}

/*
ENDPOINT VERSIONES
*/

exports.obtenerVersiones = async(req,res)=>{

 const {marca,modelo} = req.params

 const snap =
  await db.collection("precios")
   .where("marca","==",marca)
   .where("modelo","==",modelo)
   .select("version")
   .get()

 const versiones = new Set()

 snap.forEach(doc=>{
  versiones.add(doc.data().version)
 })

 res.json([...versiones].sort())

}

/*
ENDPOINT AÑOS
*/

exports.obtenerAnios = async(req,res)=>{

 const {marca,modelo,version} = req.params

 const snap =
  await db.collection("precios")
   .where("marca","==",marca)
   .where("modelo","==",modelo)
   .where("version","==",version)
   .select("anio")
   .get()

 const anios = new Set()

 snap.forEach(doc=>{
  anios.add(doc.data().anio)
 })

 res.json([...anios].sort((a,b)=>b-a))

}

/*
COTIZAR
*/

exports.cotizar = async(req,res)=>{

 try{

  const {marca,modelo,anio,km} = req.body

  const snap =
   await db.collection("precios")
    .where("marca","==",marca)
    .where("modelo","==",modelo)
    .where("anio","==",Number(anio))
    .get()

  if(snap.empty)
   return res.status(400).json({
    success:false,
    error:"Modelo no encontrado"
   })

  const precios=[]

  snap.forEach(doc=>{
   precios.push(doc.data().precio)
  })

  const promedio =
   precios.reduce((a,b)=>a+b,0)/precios.length

  let ajusteKm=0

  if(km>100000) ajusteKm=0.15
  else if(km>70000) ajusteKm=0.10
  else if(km>40000) ajusteKm=0.05

  const precioFinal =
   Math.round(promedio - (promedio*ajusteKm))

  console.log("COTIZACION:",marca,modelo,anio,precioFinal)

  res.json({
   success:true,
   precioBase:promedio,
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
