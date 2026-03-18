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
 return String(str || "").toLowerCase().trim()
}

// ================= API =================
const API = "/api/auth/cotizador"

// ================= CONFIG EXTERNA =================
let DOLAR = 0
let REGLAS_KM = []

// ================= LOGGER PRO =================
function logRequest(label, url, options){
 console.group(`🌐 ${label}`)
 console.log("➡️ URL:", url)
 console.log("⚙️ Options:", options || {})
 console.groupEnd()
}

function logResponse(label, res, raw){
 console.group(`📥 ${label}`)
 console.log("✅ Status:", res.status, res.statusText)
 console.log("📦 Content-Type:", res.headers.get("content-type"))
 console.log("📄 Raw Response:", raw)
 console.groupEnd()
}

function logError(label, err){
 console.group(`❌ ${label}`)
 console.error(err)
 console.groupEnd()
}

// ================= FETCH PRO =================
async function fetchPro(url, options = {}){

 logRequest("REQUEST", url, options)

 try{
  const res = await fetch(url, options)

  const contentType = res.headers.get("content-type") || ""

  let raw = await res.text()

  logResponse("RESPONSE", res, raw)

  // 🔥 Intentar parsear JSON si corresponde
  if(contentType.includes("application/json")){
   try{
    const json = JSON.parse(raw)
    return { ok: res.ok, data: json, status: res.status }
   }catch(parseError){
    throw new Error("Respuesta JSON inválida")
   }
  }

  // 🔥 HTML (error típico backend)
  if(contentType.includes("text/html")){
   console.warn("⚠️ El servidor devolvió HTML (posible error 404 o backend caído)")
   return { ok: false, data: raw, status: res.status }
  }

  // 🔥 Texto plano u otro formato
  return { ok: res.ok, data: raw, status: res.status }

 }catch(err){
  logError("FETCH ERROR", err)
  return { ok: false, error: err.message }
 }
}

// ================= DÓLAR =================
async function cargarDolar(){
 try{

  const res = await fetchPro(`${API}/dolar`)

  if(!res.ok){
   console.warn("⚠️ No se pudo obtener dólar")
   return
  }

  const data = res.data

  if(typeof data !== "object"){
   console.warn("⚠️ Dólar no es objeto válido:", data)
   return
  }

  DOLAR = Number(data.usd) || 0

  console.log("💵 Dólar cargado:", DOLAR)

 }catch(err){
  logError("ERROR DÓLAR", err)
 }
}

// ================= KM =================
async function cargarReglasKM(){
 try{

  const res = await fetchPro(`${API}/km`)

  if(!res.ok){
   console.warn("⚠️ No se pudo obtener reglas KM")
   return
  }

  const data = res.data

  if(typeof data !== "object"){
   console.warn("⚠️ KM inválido:", data)
   return
  }

  if(!Array.isArray(data.reglas)){
   console.warn("⚠️ reglas no es array:", data.reglas)
   REGLAS_KM = []
   return
  }

  REGLAS_KM = data.reglas

  console.log("🚗 Reglas KM cargadas:", REGLAS_KM)

 }catch(err){
  logError("ERROR KM", err)
 }
}

// ================= LÓGICA KM =================
function obtenerDescuentoKM(km){

 if(!Array.isArray(REGLAS_KM)){
  console.warn("⚠️ REGLAS_KM corrupto:", REGLAS_KM)
  return 0
 }

 for(const regla of REGLAS_KM){

  if(
   typeof regla !== "object" ||
   regla.min === undefined ||
   regla.max === undefined
  ){
   console.warn("⚠️ Regla inválida:", regla)
   continue
  }

  if(km >= regla.min && km <= regla.max){
   return Number(regla.descuento) || 0
  }
 }

 return 0
}

// ================= HELPERS =================
function limpiarSelect(id){
 const select = document.getElementById(id)
 if(select){
  select.innerHTML = `<option value="">Seleccione</option>`
 }
}

function cargarOpciones(selectId, lista){

 const select = document.getElementById(selectId)

 if(!select){
  console.warn("⚠️ Select no encontrado:", selectId)
  return
 }

 // limpiar siempre
 select.innerHTML = `<option value="">Seleccione</option>`

 let array = []

 // 🔥 detección inteligente
 if (Array.isArray(lista)) {
  array = lista
 }
 else if (typeof lista === "object" && lista !== null) {
  array = Object.keys(lista)
 }
 else if (typeof lista === "string") {
  console.warn("⚠️ Recibí string (posible HTML o error):", lista)
  return
 }
 else {
  console.error("❌ Tipo no soportado:", lista)
  return
 }

 // eliminar duplicados
 const unicos = [...new Set(array)]

 console.log(`📊 Opciones (${selectId}):`, unicos)

 unicos.forEach(item=>{
  select.innerHTML += `
   <option value="${item}">
    ${String(item).toUpperCase()}
   </option>`
 })
} const select = document.getElementById(id)
 if(select){
  select.innerHTML = `<option value="">Seleccione</option>`
 }
}

function cargarOpciones(selectId, lista){

 const select = document.getElementById(selectId)

 // 🔥 limpiar SIEMPRE para evitar duplicados
 select.innerHTML = `<option value="">Seleccione</option>`

 let array = []

 if (Array.isArray(lista)) {
  array = lista
 }
 else if (typeof lista === "object" && lista !== null) {
  array = Object.keys(lista)
 }
 else {
  console.error("❌ Datos inválidos:", lista)
  return
 }

 // 🔥 eliminar duplicados reales
 const unicos = [...new Set(array)]

 unicos.forEach(item=>{
  select.innerHTML += `
   <option value="${item}">
    ${String(item).toUpperCase()}
   </option>`
 })
}

// ================= MARCAS =================
async function cargarMarcas(){
 try{

  limpiarSelect("marca")

  const res = await fetch(`${API}/marcas`)
  const data = await res.json()

  if(!res.ok) throw new Error(data.error)

  cargarOpciones("marca", data.data || data)

 }catch(err){
  console.error("❌ Error marcas:", err)
 }
}

// ================= MODELOS =================
async function cargarModelos(){

 const marca = normalizar(
  document.getElementById("marca").value
 )

 limpiarSelect("modelo")
 limpiarSelect("version")
 limpiarSelect("anio")

 if(!marca) return

 try{

  const res = await fetch(`${API}/modelos/${marca}`)
  const data = await res.json()

  if(!res.ok) throw new Error(data.error)

  cargarOpciones("modelo", data.data || data)

 }catch(err){
  console.error("❌ Error modelos:", err)
 }
}

// ================= VERSIONES =================
async function cargarVersiones(){

 const marca = normalizar(
  document.getElementById("marca").value
 )

 const modelo = normalizar(
  document.getElementById("modelo").value
 )

 limpiarSelect("version")
 limpiarSelect("anio")

 if(!marca || !modelo) return

 try{

  const res = await fetch(`${API}/versiones/${marca}/${modelo}`)
  const data = await res.json()

  if(!res.ok) throw new Error(data.error)

  cargarOpciones("version", data.data || data)

 }catch(err){
  console.error("❌ Error versiones:", err)
 }
}

// ================= AÑOS =================
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

 limpiarSelect("anio")

 if(!marca || !modelo || !version) return

 try{

  const res = await fetch(`${API}/anios/${marca}/${modelo}/${version}`)
  const data = await res.json()

  if(!res.ok) throw new Error(data.error)

  cargarOpciones("anio", data.data || data)

 }catch(err){
  console.error("❌ Error años:", err)
 }
}

// ================= COTIZAR =================
async function cotizar(){

 const marca = normalizar(document.getElementById("marca").value)
 const modelo = normalizar(document.getElementById("modelo").value)
 const version = normalizar(document.getElementById("version").value)
 const anio = document.getElementById("anio").value
 const km = Number(document.getElementById("km").value)

 if(!marca || !modelo || !version || !anio){
  alert("Completar todos los campos")
  return
 }

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
   alert(data.error || "Error en cotización")
   return
  }

  // 🔥 NUEVA LÓGICA
  const precioUSD = data.precioBase
  const descuento = obtenerDescuentoKM(km)

  const precioFinalUSD =
   Math.round(precioUSD - (precioUSD * descuento / 100))

  const precioARS =
   Math.round(precioFinalUSD * DOLAR)

  document.getElementById("resultado").innerHTML = `
   Precio base USD: $${precioUSD.toLocaleString()}
   <br><br>
   Dólar actual: $${DOLAR}
   <br><br>
   Descuento por KM: ${descuento} %
   <br><br>
   <strong>
   Precio final USD: $${precioFinalUSD.toLocaleString()}
   </strong>
   <br><br>
   <strong style="color:lime;">
   Precio final ARS: $${precioARS.toLocaleString()}
   </strong>
  `

 }catch(err){
  console.error("❌ Error cotizar:", err)
 }

}

// ================= EVENTOS =================
function initEventos(){

 document.getElementById("marca")
  .addEventListener("change", cargarModelos)

 document.getElementById("modelo")
  .addEventListener("change", cargarVersiones)

 document.getElementById("version")
  .addEventListener("change", cargarAnios)
}

// ================= INIT =================
window.onload = async ()=>{
 await cargarDolar()
 await cargarReglasKM()
 cargarMarcas()
 initEventos()
}
