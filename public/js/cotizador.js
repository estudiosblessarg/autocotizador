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
FETCH PRO
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

  if(contentType.includes("text/html")){
   warn("⚠️ Backend devolvió HTML")
   return { ok:false, status, raw }
  }

  if(contentType.includes("application/json")){
   try{
    const json = JSON.parse(raw)
    return { ok: res.ok, status, data: json }
   }catch(e){
    errorLog("❌ JSON inválido:", raw)
    return { ok:false, status, raw }
   }
  }

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

 const parsed = Number(data.usd)

 if(isNaN(parsed) || parsed <= 0){
  warn("⚠️ USD inválido:", data)
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

 const data = res.data.tabla

 if(!Array.isArray(data)){
  warn("⚠️ tabla inválida")
  return
 }

 // 🔥 ahora guardás directo
 REGLAS_KM = data.filter(r =>
  r &&
  typeof r.km === "number" &&
  typeof r.descuento === "number"
 )

 log("🚗 REGLAS KM:", REGLAS_KM)
}

/*
========================================================
DESCUENTO KM
========================================================
*/
function obtenerDescuentoKM(km){

 let descuento = 0

 for(const regla of REGLAS_KM){

  if(km >= regla.km){
   descuento = regla.descuento
  }

 }

 log(`📉 Descuento aplicado: ${descuento}%`)
 return Number(descuento) || 0
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
 if(!select) return

 select.innerHTML = `<option value="">Seleccione</option>`

 let array = []

 if (Array.isArray(lista)) array = lista
 else if (typeof lista === "object") array = Object.keys(lista)
 else return

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
DATOS
========================================================
*/
async function cargarMarcas(){
 const res = await fetchPro(`${API}/marcas`)
 if(res.ok) cargarOpciones("marca", res.data?.data || res.data)
}

async function cargarModelos(){

 const marca = normalizar(document.getElementById("marca").value)

 limpiarSelect("modelo")
 limpiarSelect("version")
 limpiarSelect("anio")

 if(!marca) return

 const res = await fetchPro(`${API}/modelos/${marca}`)
 if(res.ok) cargarOpciones("modelo", res.data?.data || res.data)
}

async function cargarVersiones(){

 const marca = normalizar(document.getElementById("marca").value)
 const modelo = normalizar(document.getElementById("modelo").value)

 limpiarSelect("version")
 limpiarSelect("anio")

 if(!marca || !modelo) return

 const res = await fetchPro(`${API}/versiones/${marca}/${modelo}`)
 if(res.ok) cargarOpciones("version", res.data?.data || res.data)
}

async function cargarAnios(){

 const marca = normalizar(document.getElementById("marca").value)
 const modelo = normalizar(document.getElementById("modelo").value)
 const version = normalizar(document.getElementById("version").value)

 limpiarSelect("anio")

 if(!marca || !modelo || !version) return

 const res = await fetchPro(`${API}/anios/${marca}/${modelo}/${version}`)
 if(res.ok) cargarOpciones("anio", res.data?.data || res.data)
}

/*
========================================================
COTIZAR (🔥 FIX MONEDA)
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

 if(DOLAR <= 0){
  alert("Error: dólar no cargado")
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
  alert("Error en cotización")
  return
 }

 const data = res.data

 // 🔥 AHORA ES USD DIRECTO
 const precioUSDBase = Number(data.precioBase) || 0

 // 🔥 aplicar descuento (pero NO mostrarlo)
 const descuento = obtenerDescuentoKM(km)

 const precioFinalUSD =
  Math.round(precioUSDBase - (precioUSDBase * descuento / 100))

 // 🔥 convertir a ARS
 const precioFinalARS =
  Math.round(precioFinalUSD * DOLAR)

 log("💰 RESULTADO:", {
  precioUSDBase,
  descuento,
  precioFinalUSD,
  precioFinalARS
 })

 document.getElementById("resultado").innerHTML = `
   Buscando en la base de datos
   <br><br>
   Datos encontrados
   <br><br>
   <strong>Calculando kilometrajes</strong>
   <br><br>
   <strong>Resultado final:</strong>
   <strong style="color:lime;">ARS final: $${precioFinalUSD.toLocaleString()}.000</strong>
 `
}

/*
========================================================
INIT
========================================================
*/
function initEventos(){
 document.getElementById("marca").addEventListener("change", cargarModelos)
 document.getElementById("modelo").addEventListener("change", cargarVersiones)
 document.getElementById("version").addEventListener("change", cargarAnios)
}

window.onload = async ()=>{
 log("🚀 INIT APP")

 await cargarDolar()
 await cargarReglasKM()
 await cargarMarcas()

 initEventos()

 log("✅ APP READY")
}
