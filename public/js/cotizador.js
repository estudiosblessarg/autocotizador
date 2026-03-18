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

// ================= HELPERS =================
function limpiarSelect(id){
 const select = document.getElementById(id)
 if(select){
  select.innerHTML = `<option value="">Seleccione</option>`
 }
}

function cargarOpciones(selectId, lista){
 const select = document.getElementById(selectId)

 lista.forEach(item=>{
  select.innerHTML += `<option value="${item}">${item.toUpperCase()}</option>`
 })
}

// ================= MARCAS =================
async function cargarMarcas(){
 try{

  limpiarSelect("marca")

  const res = await fetch(`${API}/marcas`)
  const data = await res.json()

  if(!res.ok) throw new Error(data.error)

  cargarOpciones("marca", data)

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

  cargarOpciones("modelo", data)

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

  cargarOpciones("version", data)

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

  cargarOpciones("anio", data)

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

// ================= INIT =================
window.onload = ()=>{
 cargarMarcas()
}