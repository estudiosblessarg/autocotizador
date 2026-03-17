/*
========================================================
CERRAR SESIÓN
========================================================
*/

function logout(){
 localStorage.removeItem("token")
 localStorage.removeItem("user")
 window.location.href = "login.html"
}

// ================= NORMALIZAR =================
function normalizar(str){
 return str.toLowerCase().trim()
}

// ================= API =================
const API = "/api/auth/cotizador" // ✅ ESTA BIEN

// ================= CACHE CONFIG =================
let CONFIG = null

// ================= FETCH CONFIG =================
async function cargarConfig(){

 try{

  const res = await fetch(`${API}/marcas`) // ✅ RUTA CORRECTA

  const contentType = res.headers.get("content-type")

  // 🔥 evita el error del HTML
  if(!contentType || !contentType.includes("application/json")){
   throw new Error("El backend devolvió HTML → ruta incorrecta")
  }

  const data = await res.json()

  if(!res.ok){
   console.error("❌ Backend error:", data)
   return
  }

  // 🔥 Si backend devuelve objeto en vez de array
  if (Array.isArray(data)) {
 CONFIG = {}
 data.forEach(m => CONFIG[m] = {})
}
else if (data.data && Array.isArray(data.data)) {
 CONFIG = {}
 data.data.forEach(m => CONFIG[m] = {})
}
else {
 console.error("❌ Formato inválido:", data)
}else{
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
async function cargarAnios(){

 const marca = normalizar(
  document.getElementById("marca").value
 )

 const modelo = normalizar(
  document.getElementById("modelo").value
 )

 const version = normalizar(
  document.getElementById("version").value
 )

 if(!marca || !modelo || !version) return

 limpiarSelect("anio")

 try{

  const res = await fetch(`${API}/anios/${marca}/${modelo}/${version}`) // ✅ RUTA CORRECTA

  const data = await res.json()

  const select = document.getElementById("anio")

  data.forEach(a=>{
   select.innerHTML += `<option value="${a}">${a}</option>`
  })

 }catch(err){
  console.error("❌ Error cargando años", err)
 }
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

  const res = await fetch(`${API}/cotizar`,{ // ✅ RUTA CORRECTA

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

  const contentType = res.headers.get("content-type")

  if(!contentType || !contentType.includes("application/json")){
   throw new Error("Respuesta inválida del servidor")
  }

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
  console.error("❌ Error cotizar:", err)
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
