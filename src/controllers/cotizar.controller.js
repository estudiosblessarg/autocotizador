const { db } = require("../config/firebase")

const fetch = (...args) =>
 import("node-fetch").then(({ default: fetch }) => fetch(...args))


/*
BUSCAR PRECIO EN INTERNET
(MercadoLibre)
*/

async function buscarPrecioVehiculo(marca,modelo,anio){

 try{

  const query =
   `${marca} ${modelo} ${anio}`.replace(/\s/g,"-")

  const url =
   `https://api.mercadolibre.com/sites/MLA/search?q=${query}&category=MLA1744&limit=10`

  const res = await fetch(url)

  if(!res.ok){
   throw new Error("Error API MercadoLibre")
  }

  const data = await res.json()

  if(!data.results || data.results.length === 0){
   return null
  }

  const precios =
   data.results
    .map(a => a.price)
    .filter(Boolean)

  if(precios.length === 0){
   return null
  }

  const promedio =
   precios.reduce((a,b)=>a+b,0) / precios.length

  return Math.round(promedio)

 }catch(err){

  console.log("Error buscando precio:",err)

  return null

 }

}


/*
OBTENER CONFIG ADMIN
*/

async function obtenerConfigKM(){

 try{

  const doc =
   await db.collection("config").doc("km").get()

  if(!doc.exists){
   return {descuento:0}
  }

  return doc.data()

 }catch(err){

  console.log("Error config km:",err)

  return {descuento:0}

 }

}


/*
COTIZAR
*/

exports.cotizar = async (req,res)=>{

 try{

  const {marca,modelo,version,anio,km} = req.body

  if(!marca || !modelo || !anio){

   return res.status(400).json({
    success:false,
    error:"Datos incompletos"
   })

  }

  /*
  1 BUSCAR PRECIO
  */

  const precioInternet =
   await buscarPrecioVehiculo(marca,modelo,anio)

  if(!precioInternet){

   return res.status(400).json({
    success:false,
    error:"No se pudo obtener precio del vehiculo"
   })

  }

  /*
  2 CONFIG ADMIN
  */

  const config = await obtenerConfigKM()

  const descuento =
   Number(config.descuento || 0)

  /*
  3 AJUSTE POR KM
  */

  let ajusteKm = 0

  if(km){

   const kmNumero = Number(km)

   if(kmNumero > 100000){
    ajusteKm = 0.15
   }

   else if(kmNumero > 70000){
    ajusteKm = 0.10
   }

   else if(kmNumero > 40000){
    ajusteKm = 0.05
   }

  }

  const precioKm =
   precioInternet - (precioInternet * ajusteKm)

  /*
  4 APLICAR DESCUENTO ADMIN
  */

  const descuentoValor =
   precioKm * (descuento / 100)

  const precioFinal =
   Math.round(precioKm - descuentoValor)

  /*
  5 GUARDAR COTIZACION
  */

  const cotizacion = {

   marca,
   modelo,
   version,
   anio,
   km,

   precioBase:precioInternet,
   descuentoPorcentaje:descuento,
   precioFinal,

   createdAt:new Date()

  }

  const ref =
   await db.collection("cotizaciones").add(cotizacion)

  res.json({

   success:true,
   id:ref.id,

   precioBase:precioInternet,
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
