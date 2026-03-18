/*
========================================================
CONFIG DEBUG
========================================================
*/
const DEBUG = true

function log(...args){
 if(DEBUG) console.log(...args)
}

function warn(...args){
 if(DEBUG) console.warn(...args)
}

function errorLog(...args){
 console.error(...args)
}

function group(label){
 if(DEBUG) console.group(label)
}

function groupEnd(){
 if(DEBUG) console.groupEnd()
}

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

/*
========================================================
FETCH PRO NIVEL EMPRESA
========================================================
*/
async function fetchPro(url, options = {}){

 const start = performance.now()

 group(`🌐 REQUEST → ${url}`)
 log("Options:", options)

 try{

  const res = await fetch(url, options)

  const contentType = res.headers.get("content-type") || ""
  const status = res.status

  let raw = await res.text()

  const end = performance.now()

  log("⏱ Tiempo:", (end - start).toFixed(2), "ms")
  log("📊 Status:", status)
  log("📦 Content-Type:", contentType)
  log("📄 Raw:", raw)

  // 🔥 HTML = ERROR BACKEND
  if(contentType.includes("text/html")){
   warn("⚠️ Backend devolvió HTML → probablemente error 404/500")
   return { ok:false, status, raw }
  }

  // 🔥 JSON
  if(contentType.includes("application/json")){
   try{
    const json = JSON.parse(raw)
    return { ok: res.ok, status, data: json }
   }catch(e){
    errorLog("❌ JSON inválido:", raw)
    return { ok:false, status, raw }
   }
  }

  // 🔥 Texto plano
  return { ok: res.ok, status, data: raw }

 }catch(err){

  errorLog("❌ FETCH CRASH:", err)

  return {
   ok:false,
   error: err.message
  }

 }finally{
  groupEnd()
 }
}

/*
========================================================
DÓLAR
========================================================
*/
async function cargarDolar(){

 const res = await fetchPro(`${API}/dolar`)

 if(!res.ok){
  warn("⚠️ No se pudo cargar dólar")
  return
 }

 const data = res.data

 if(typeof data !== "object"){
  warn("⚠️ Dólar inválido:", data)
  return
 }

 const parsed = Number(data.usd)

 if(isNaN(parsed)){
  warn("⚠️ USD inválido:", data.usd)
  return
 }

 DOLAR = parsed

 log("💵 DÓLAR FINAL:", DOLAR)
}

/*
========================================================
KM
========================================================
*/
async function cargarReglasKM(){

 const res = await fetchPro(`${API}/km`)

 if(!res.ok){
  warn("⚠️ No se pudo cargar KM")
  return
 }

 const data = res.data

 if(typeof data !== "object"){
  warn("⚠️ KM inválido:", data)
  return
 }

 if(!Array.isArray(data.reglas)){
  warn("⚠️ reglas no es array:", data.reglas)
  return
 }

 // 🔥 validación fuerte
 REGLAS_KM = data.reglas.filter(r =>
  r &&
  typeof r.min === "number" &&
  typeof r.max === "number"
 )

 log("🚗 REGLAS KM:", REGLAS_KM)
}

/*
========================================================
DESCUENTO KM
========================================================
*/
function obtenerDescuentoKM(km){

 if(!Array.isArray(REGLAS_KM)){
  warn("⚠️ REGLAS_KM corrupto")
  return 0
 }

 for(const regla of REGLAS_KM){

  if(km >= regla.min && km <= regla.max){
   log(`📉 Descuento aplicado: ${regla.descuento}%`)
   return Number(regla.descuento) || 0
  }
 }

 log("📉 Sin descuento aplicado")
 return 0
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

function cargarOpciones(selectId, lista){

 const select = document.getElementById(selectId)

 if(!select){
  warn("⚠️ Select no encontrado:", selectId)
  return
 }

 select.innerHTML = `<option value="">Seleccione</option>`

 let array = []

 if (Array.isArray(lista)) {
  array = lista
 }
 else if (typeof lista === "object" && lista !== null) {
  array = Object.keys(lista)
 }
 else {
  errorLog("❌ Datos inválidos:", lista)
  return
 }

 const unicos = [...new Set(array)]

 log(`📊 Opciones (${selectId}):`, unicos)

 unicos.forEach(item=>{
  const option = document.createElement("option")
  option.value = item
  option.textContent = String(item).toUpperCase()
  select.appendChild(option)
 })
}

/*
========================================================
MARCAS / MODELOS / VERSIONES / AÑOS
========================================================
*/
async function cargarMarcas(){

 const res = await fetchPro(`${API}/marcas`)

 if(!res.ok){
  errorLog("❌ Error marcas")
  return
 }

 cargarOpciones("marca", res.data?.data || res.data)
}

async function cargarModelos(){

 const marca = normalizar(document.getElementById("marca").value)

 limpiarSelect("modelo")
 limpiarSelect("version")
 limpiarSelect("anio")

 if(!marca) return

 const res = await fetchPro(`${API}/modelos/${marca}`)

 if(!res.ok){
  errorLog("❌ Error modelos")
  return
 }

 cargarOpciones("modelo", res.data?.data || res.data)
}

async function cargarVersiones(){

 const marca = normalizar(document.getElementById("marca").value)
 const modelo = normalizar(document.getElementById("modelo").value)

 limpiarSelect("version")
 limpiarSelect("anio")

 if(!marca || !modelo) return

 const res = await fetchPro(`${API}/versiones/${marca}/${modelo}`)

 if(!res.ok){
  errorLog("❌ Error versiones")
  return
 }

 cargarOpciones("version", res.data?.data || res.data)
}

async function cargarAnios(){

 const marca = normalizar(document.getElementById("marca").value)
 const modelo = normalizar(document.getElementById("modelo").value)
 const version = normalizar(document.getElementById("version").value)

 limpiarSelect("anio")

 if(!marca || !modelo || !version) return

 const res = await fetchPro(`${API}/anios/${marca}/${modelo}/${version}`)

 if(!res.ok){
  errorLog("❌ Error años")
  return
 }

 cargarOpciones("anio", res.data?.data || res.data)
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

 if(!marca || !modelo || !version || !anio){
  alert("Completar todos los campos")
  return
 }

 const res = await fetchPro(`${API}/cotizar`,{
  method:"POST",
  headers:{
   "Content-Type":"application/json",
   "Authorization":"Bearer "+localStorage.getItem("token")
  },
  body: JSON.stringify({ marca, modelo, version, anio, km })
 })

 if(!res.ok){
  errorLog("❌ Error cotizar:", res)
  alert("Error en cotización")
  return
 }

 const data = res.data

 const precioUSD = Number(data.precioBase) || 0
 const descuento = obtenerDescuentoKM(km)

 const precioFinalUSD =
  Math.round(precioUSD - (precioUSD * descuento / 100))

 const precioARS =
  Math.round(precioFinalUSD * DOLAR)

 log("💰 RESULTADO:", {
  precioUSD,
  descuento,
  precioFinalUSD,
  precioARS
 })

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
}

/*
========================================================
EVENTOS
========================================================
*/
function initEventos(){
 document.getElementById("marca").addEventListener("change", cargarModelos)
 document.getElementById("modelo").addEventListener("change", cargarVersiones)
 document.getElementById("version").addEventListener("change", cargarAnios)
}

/*
========================================================
INIT
========================================================
*/
window.onload = async ()=>{
 log("🚀 INIT APP")

 await cargarDolar()
 await cargarReglasKM()

 await cargarMarcas()

 initEventos()

 log("✅ APP READY")
}
