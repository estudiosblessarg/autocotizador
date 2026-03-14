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
CARGAR MARCAS
========================================================
*/

async function cargarMarcas(){

 try{

  const res = await fetch(`${API}/marcas`)
  const marcas = await res.json()

  const select = document.getElementById("marca")

  select.innerHTML = `<option value="">Seleccione una marca</option>`

  marcas.forEach(m=>{
   select.innerHTML += `<option value="${m}">${m}</option>`
  })

 }catch(err){
  console.error("Error cargando marcas",err)
 }

}


/*
========================================================
CARGAR MODELOS
========================================================
*/

async function cargarModelos(){

 const marca = document.getElementById("marca").value

 if(!marca) return

 try{

  const res = await fetch(`${API}/modelos/${marca}`)
  const modelos = await res.json()

  const select = document.getElementById("modelo")

  select.innerHTML = `<option value="">Seleccione un modelo</option>`

  modelos.forEach(m=>{
   select.innerHTML += `<option value="${m}">${m}</option>`
  })

 }catch(err){
  console.error("Error cargando modelos",err)
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

 if(!marca || !modelo) return

 try{

  const res = await fetch(`${API}/versiones/${marca}/${modelo}`)
  const versiones = await res.json()

  const select = document.getElementById("version")

  select.innerHTML = `<option value="">Seleccione una versión</option>`

  versiones.forEach(v=>{
   select.innerHTML += `<option value="${v}">${v}</option>`
  })

 }catch(err){
  console.error("Error cargando versiones",err)
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

 if(!marca || !modelo || !version) return

 try{

  const res = await fetch(`${API}/anios/${marca}/${modelo}/${version}`)
  const anios = await res.json()

  const select = document.getElementById("anio")

  select.innerHTML = `<option value="">Seleccione un año</option>`

  anios.forEach(a=>{
   select.innerHTML += `<option value="${a}">${a}</option>`
  })

 }catch(err){
  console.error("Error cargando años",err)
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

 try{

  const res = await fetch(`${API}/cotizar`,{

   method:"POST",

   headers:{
    "Content-Type":"application/json",
    "Authorization":"Bearer "+localStorage.getItem("token")
   },

   body:JSON.stringify({
    marca,
    modelo,
    version,
    anio,
    km
   })

  })

  const data = await res.json()

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
  console.error("Error cotizando",err)
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