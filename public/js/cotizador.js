// ================= NORMALIZAR =================
function normalizar(str){
 return str.toLowerCase().trim()
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

/*
========================================================
CONFIG API
========================================================
*/
const API = "/api/auth/cotizador"

/*
========================================================
HELPER FETCH
========================================================
*/
async function fetchSafe(url){

 try{

  const res = await fetch(url)

  const data = await res.json()

  if(!res.ok){
   console.error("❌ Backend error:", data)
   return null
  }

  return data

 }catch(err){
  console.error("❌ Fetch error:", err)
  return null
 }
}

/*
========================================================
CARGAR MARCAS
========================================================
*/
async function cargarMarcas(){

 const marcas = await fetchSafe(`${API}/marcas`)

 if(!Array.isArray(marcas)){
  console.error("❌ marcas no es array", marcas)
  return
 }

 const select = document.getElementById("marca")

 select.innerHTML = `<option value="">Seleccione una marca</option>`

 marcas.forEach(m=>{
  select.innerHTML += `<option value="${m}">${m.toUpperCase()}</option>`
 })
}

/*
========================================================
CARGAR MODELOS
========================================================
*/
async function cargarModelos(){

 const marca = normalizar(
  document.getElementById("marca").value
 )

 if(!marca) return

 limpiarSelect("modelo")
 limpiarSelect("version")
 limpiarSelect("anio")

 const modelos =
  await fetchSafe(`${API}/modelos/${marca}`)

 if(!Array.isArray(modelos)) return

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
async function cargarVersiones(){

 const marca = normalizar(
  document.getElementById("marca").value
 )

 const modelo = normalizar(
  document.getElementById("modelo").value
 )

 if(!marca || !modelo) return

 limpiarSelect("version")
 limpiarSelect("anio")

 const versiones =
  await fetchSafe(`${API}/versiones/${marca}/${modelo}`)

 if(!Array.isArray(versiones)) return

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

 const anios =
  await fetchSafe(`${API}/anios/${marca}/${modelo}/${version}`)

 if(!Array.isArray(anios)) return

 const select = document.getElementById("anio")

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

 const data = await fetch(`${API}/cotizar`,{

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

 }).then(r=>r.json())
  .catch(err=>{
   console.error(err)
   return null
  })

 if(!data || data.error){
  console.error("❌ Error cotizar:", data)
  alert(data?.error || "Error cotizando")
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
}

/*
========================================================
HELPERS UI
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
window.onload = ()=>{
 cargarMarcas()
}
