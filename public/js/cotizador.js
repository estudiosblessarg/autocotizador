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

async function cargarDolar(){
 try{
  const res = await fetch(`${API}/dolar`)
  const data = await res.json()

  DOLAR = data.usd || 0

  console.log("💵 Dólar:", DOLAR)

 }catch(err){
  console.error("❌ Error dólar:", err)
 }
}

async function cargarReglasKM(){
 try{
  const res = await fetch(`${API}/km`)
  const data = await res.json()

  REGLAS_KM = data.reglas || []

  console.log("🚗 Reglas KM:", REGLAS_KM)

 }catch(err){
  console.error("❌ Error KM:", err)
 }
}

function obtenerDescuentoKM(km){
 for(const regla of REGLAS_KM){
  if(km >= regla.min && km <= regla.max){
   return regla.descuento
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
