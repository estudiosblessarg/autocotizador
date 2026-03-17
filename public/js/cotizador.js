// ================= NORMALIZAR =================
function normalizar(str){
 return str.toLowerCase().trim()
}

// ================= API =================
const API = "/api/auth/cotizador"

// ================= CACHE CONFIG =================
let CONFIG = null

// ================= FETCH CONFIG =================
async function cargarConfig(){

 try{

  const res = await fetch(`${API}/marcas`)
  const data = await res.json()

  // 🔥 Si backend devuelve objeto en vez de array
  if(typeof data === "object" && !Array.isArray(data)){
   CONFIG = data
  }else{
   // si sigue devolviendo array lo convertimos
   CONFIG = {}
   data.forEach(m => CONFIG[m] = {})
  }

  console.log("✅ CONFIG:", CONFIG)

 }catch(err){
  console.error("❌ Error cargando config", err)
 }
}

/*
========================================================
CARGAR MARCAS
========================================================
*/
function cargarMarcas(){

 const select = document.getElementById("marca")

 select.innerHTML = `<option value="">Seleccione una marca</option>`

 const marcas = Object.keys(CONFIG || {})

 marcas.forEach(m=>{
  select.innerHTML += `<option value="${m}">${m.toUpperCase()}</option>`
 })
}

/*
========================================================
CARGAR MODELOS
========================================================
*/
function cargarModelos(){

 const marca = normalizar(
  document.getElementById("marca").value
 )

 limpiarSelect("modelo")
 limpiarSelect("version")
 limpiarSelect("anio")

 if(!marca || !CONFIG[marca]) return

 const modelos = Object.keys(CONFIG[marca])

 const select = document.getElementById("modelo")

 modelos.forEach(m=>{
  select.innerHTML += `<option value="${m}">${m.toUpperCase()}</option>`
 })
}

/*
========================================================
CARGAR VERSIONES
========================================================
*/
function cargarVersiones(){

 const marca = normalizar(
  document.getElementById("marca").value
 )

 const modelo = normalizar(
  document.getElementById("modelo").value
 )

 limpiarSelect("version")
 limpiarSelect("anio")

 if(!marca || !modelo) return

 const versiones = CONFIG[marca]?.[modelo] || []

 const select = document.getElementById("version")

 versiones.forEach(v=>{
  select.innerHTML += `<option value="${v}">${v.toUpperCase()}</option>`
 })
}

/*
========================================================
CARGAR AÑOS
========================================================
*/
function cargarAnios(){

 limpiarSelect("anio")

 const select = document.getElementById("anio")

 // 🔥 hardcode por ahora
 const anios = [2024,2023,2022,2021,2020]

 anios.forEach(a=>{
  select.innerHTML += `<option value="${a}">${a}</option>`
 })
}

/*
========================================================
COTIZAR
========================================================
*/
async function cotizar(){

 const marca = normalizar(document.getElementById("marca").value)
 const modelo = normalizar(document.getElementById("modelo").value)
 const version = normalizar(document.getElementById("version").value)
 const anio = document.getElementById("anio").value
 const km = Number(document.getElementById("km").value)

 try{

  const res = await fetch(`${API}/cotizar`,{

   method:"POST",

   headers:{
    "Content-Type":"application/json",
    "Authorization":"Bearer "+localStorage.getItem("token")
   },

   body: JSON.stringify({
    marca,
    modelo,
    version,
    anio,
    km
   })

  })

  const data = await res.json()

  if(!res.ok){
   console.error("❌ Error:", data)
   alert(data.error)
   return
  }

  document.getElementById("resultado").innerHTML = `
   Precio mercado: $${data.precioBase.toLocaleString()}
   <br><br>
   Descuento por KM: ${data.descuentoKM} %
   <br><br>
   <strong>
   Precio sugerido: $${data.precioFinal.toLocaleString()}
   </strong>
  `

 }catch(err){
  console.error(err)
 }
}

/*
========================================================
HELPERS
========================================================
*/
function limpiarSelect(id){
 const select = document.getElementById(id)
 if(select){
  select.innerHTML = `<option value="">Seleccione</option>`
 }
}

/*
========================================================
INIT
========================================================
*/
window.onload = async ()=>{
 await cargarConfig()
 cargarMarcas()
}
