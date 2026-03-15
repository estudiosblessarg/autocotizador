const { db } = require("../config/firebase")

const fetch = (...args) =>
 import("node-fetch").then(({ default: fetch }) => fetch(...args))


/*
BUSCAR PRECIO VEHICULO EN INTERNET
Ejemplo usando API pública
*/

async function buscarPrecioVehiculo(marca, modelo, anio){

 try{

  const query = `${marca} ${modelo} ${anio}`

  const url = `https://api.api-ninjas.com/v1/cars?make=${marca}&model=${modelo}&year=${anio}`

  const res = await fetch(url,{
   headers:{
    "X-Api-Key":process.env.CAR_API_KEY
   }
  })

  if(!res.ok){
   throw new Error("API error")
  }

  const data = await res.json()

  if(!data.length){
   return null
  }

  /*
  Simulación precio promedio
  (muchas APIs no dan precio real)
  */

  const precioEstimado = 15000 + (Math.random()*10000)

  return Math.round(precioEstimado)

 }catch(err){

  console.log("Error buscando precio:",err)

  return null

 }

}


/*
OBTENER CONFIGURACION ADMIN
*/

async function obtenerConfigKM(){

 try{

  const doc = await db
   .collection("config")
   .doc("km")
   .get()

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
ENDPOINT COTIZAR
*/

exports.cotizar = async (req,res)=>{

 try{

  const {marca,modelo,anio} = req.body

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
  2 OBTENER CONFIG ADMIN
  */

  const config = await obtenerConfigKM()

  const descuento = config.descuento || 0

  /*
  3 CALCULAR PRECIO FINAL
  */

  const descuentoValor =
   precioInternet * (descuento/100)

  const precioFinal =
   Math.round(precioInternet - descuentoValor)

  /*
  4 GUARDAR COTIZACION
  */

  const cotizacion = {

   ...req.body,

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
