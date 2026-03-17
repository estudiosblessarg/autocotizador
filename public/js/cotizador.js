/*
========================================================
CERRAR SESIÓN
========================================================
*/

function logout(){
 console.log("[LOGOUT] Eliminando token y usuario de localStorage")

 localStorage.removeItem("token")
 localStorage.removeItem("user")

 console.log("[LOGOUT] Redirigiendo a login.html")

 window.location.href = "login.html"
}


/*
========================================================
CONFIG API
========================================================
*/

const API = "/api/auth/cotizador"

console.log("[CONFIG] API base:", API)


/*
========================================================
CARGAR MARCAS
========================================================
*/

async function cargarMarcas(){

 console.log("[MARCAS] Iniciando carga de marcas")

 try{

  const url = `${API}/marcas`
  console.log("[MARCAS] Fetch URL:", url)

  const res = await fetch(url)

  console.log("[MARCAS] Response status:", res.status)

  if(!res.ok){
   console.error("[MARCAS] Error HTTP:", res.status)
   return
  }

  const marcas = await res.json()

  console.log("[MARCAS] Datos recibidos:", marcas)

  const select = document.getElementById("marca")

  if(!select){
   console.error("[MARCAS] No existe el select #marca en el HTML")
   return
  }

  select.innerHTML = `<option value="">Seleccione una marca</option>`

  if(!Array.isArray(marcas)){
   console.error("[MARCAS] El backend no devolvió un array:", marcas)
   return
  }

  marcas.forEach(m=>{
   console.log("[MARCAS] Agregando opción:", m)
   select.innerHTML += `<option value="${m}">${m}</option>`
  })

  console.log("[MARCAS] Total marcas cargadas:", marcas.length)

 }catch(err){

  console.error("[MARCAS] Error cargando marcas:", err)

 }

}


/*
========================================================
CARGAR MODELOS
========================================================
*/

async function cargarModelos(){

 const marca = document.getElementById("marca").value

 console.log("[MODELOS] Marca seleccionada:", marca)

 if(!marca){
  console.warn("[MODELOS] No hay marca seleccionada")
  return
 }

 try{

  const url = `${API}/modelos/${marca}`

  console.log("[MODELOS] Fetch URL:", url)

  const res = await fetch(url)

  console.log("[MODELOS] Response status:", res.status)

  if(!res.ok){
   console.error("[MODELOS] Error HTTP:", res.status)
   return
  }

  const modelos = await res.json()

  console.log("[MODELOS] Datos recibidos:", modelos)

  const select = document.getElementById("modelo")

  if(!select){
   console.error("[MODELOS] No existe el select #modelo")
   return
  }

  select.innerHTML = `<option value="">Seleccione un modelo</option>`

  if(!Array.isArray(modelos)){
   console.error("[MODELOS] El backend no devolvió un array:", modelos)
   return
  }

  modelos.forEach(m=>{
   console.log("[MODELOS] Agregando opción:", m)
   select.innerHTML += `<option value="${m}">${m}</option>`
  })

  console.log("[MODELOS] Total modelos cargados:", modelos.length)

 }catch(err){

  console.error("[MODELOS] Error cargando modelos:", err)

 }

}


/*
========================================================
CARGAR VERSIONES
========================================================
*/

async function cargarVersiones(){

 const marca = document.getElementById("marca").value
 const modelo = document.getElementById("modelo").value

 console.log("[VERSIONES] Marca:", marca)
 console.log("[VERSIONES] Modelo:", modelo)

 if(!marca || !modelo){
  console.warn("[VERSIONES] Faltan datos")
  return
 }

 try{

  const url = `${API}/versiones/${marca}/${modelo}`

  console.log("[VERSIONES] Fetch URL:", url)

  const res = await fetch(url)

  console.log("[VERSIONES] Response status:", res.status)

  if(!res.ok){
   console.error("[VERSIONES] Error HTTP:", res.status)
   return
  }

  const versiones = await res.json()

  console.log("[VERSIONES] Datos recibidos:", versiones)

  const select = document.getElementById("version")

  if(!select){
   console.error("[VERSIONES] No existe el select #version")
   return
  }

  select.innerHTML = `<option value="">Seleccione una versión</option>`

  if(!Array.isArray(versiones)){
   console.error("[VERSIONES] El backend no devolvió un array:", versiones)
   return
  }

  versiones.forEach(v=>{
   console.log("[VERSIONES] Agregando opción:", v)
   select.innerHTML += `<option value="${v}">${v}</option>`
  })

  console.log("[VERSIONES] Total versiones cargadas:", versiones.length)

 }catch(err){

  console.error("[VERSIONES] Error cargando versiones:", err)

 }

}


/*
========================================================
CARGAR AÑOS
========================================================
*/

async function cargarAnios(){

 const marca = document.getElementById("marca").value
 const modelo = document.getElementById("modelo").value
 const version = document.getElementById("version").value

 console.log("[AÑOS] Marca:", marca)
 console.log("[AÑOS] Modelo:", modelo)
 console.log("[AÑOS] Version:", version)

 if(!marca || !modelo || !version){
  console.warn("[AÑOS] Faltan datos")
  return
 }

 try{

  const url = `${API}/anios/${marca}/${modelo}/${version}`

  console.log("[AÑOS] Fetch URL:", url)

  const res = await fetch(url)

  console.log("[AÑOS] Response status:", res.status)

  if(!res.ok){
   console.error("[AÑOS] Error HTTP:", res.status)
   return
  }

  const anios = await res.json()

  console.log("[AÑOS] Datos recibidos:", anios)

  const select = document.getElementById("anio")

  if(!select){
   console.error("[AÑOS] No existe el select #anio")
   return
  }

  select.innerHTML = `<option value="">Seleccione un año</option>`

  if(!Array.isArray(anios)){
   console.error("[AÑOS] El backend no devolvió un array:", anios)
   return
  }

  anios.forEach(a=>{
   console.log("[AÑOS] Agregando opción:", a)
   select.innerHTML += `<option value="${a}">${a}</option>`
  })

  console.log("[AÑOS] Total años cargados:", anios.length)

 }catch(err){

  console.error("[AÑOS] Error cargando años:", err)

 }

}


/*
========================================================
COTIZAR VEHÍCULO
========================================================
*/

async function cotizar(){

 const marca = document.getElementById("marca").value
 const modelo = document.getElementById("modelo").value
 const version = document.getElementById("version").value
 const anio = document.getElementById("anio").value
 const km = document.getElementById("km").value

 console.log("[COTIZAR] Datos enviados:",{
  marca,modelo,version,anio,km
 })

 try{

  const url = `${API}/cotizar`

  console.log("[COTIZAR] Fetch URL:", url)

  const res = await fetch(url,{

   method:"POST",

   headers:{
    "Content-Type":"application/json",
    "Authorization":"Bearer "+localStorage.getItem("token")
   },

   body: JSON.stringify({
   marca: marca.toLowerCase(),
   modelo: modelo.toLowerCase(),
   version: version.toLowerCase(),
   anio,
   km
})

  })

  console.log("[COTIZAR] Response status:", res.status)

  const data = await res.json()

  console.log("[COTIZAR] Respuesta backend:", data)

  document.getElementById("resultado").innerHTML = `
  Precio mercado: $${data.precioBase.toLocaleString()}
  <br><br>
  Descuento por KM: ${data.descuentoKM} %
  <br><br>
  <strong>
  Precio sugerido: $${data.precioSugerido.toLocaleString()}
  </strong>
  `

 }catch(err){

  console.error("[COTIZAR] Error cotizando:", err)

 }

}


/*
========================================================
INIT
========================================================
*/

window.onload = ()=>{
 console.log("[INIT] Página cargada")
 cargarMarcas()
}
