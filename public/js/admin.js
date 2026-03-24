/*
========================================================
CONFIGURACIÓN GENERAL
========================================================
*/

const API = "/api"

/*
========================================================
OBTENER TOKEN
========================================================
*/

function getToken(){
 return localStorage.getItem("token")
}

/*
========================================================
CERRAR SESIÓN
========================================================
*/

function logout(){

 console.log("Cerrando sesión")

 localStorage.removeItem("token")
 localStorage.removeItem("user")

 window.location.href = "login.html"

}

/*
========================================================
FUNCIÓN BASE PARA API
========================================================
*/

async function api(url,method="GET",body=null){

 try{

  const token = getToken()

  const headers={
   "Content-Type":"application/json"
  }

  if(token){
   headers["Authorization"]="Bearer "+token
  }

  const res = await fetch(API+url,{
   method,
   headers,
   body: body ? JSON.stringify(body):null
  })

  if(!res.ok){

   console.warn("API error:",res.status)

   if(res.status === 401){
    console.warn("Sesión inválida")
   }

   throw new Error("Error API: "+res.status)

  }

  const text = await res.text()

  return text ? JSON.parse(text) : {}

 }catch(err){

  console.error("Error fetch:",err)
  throw err

 }

}

/*
========================================================
VERIFICAR SESIÓN ADMIN
========================================================
*/

async function verificarRolAdmin(){

 const token = getToken()

 if(!token){
  console.warn("No hay token, sesión no iniciada")
  return
 }

 try{

  const res = await fetch(API+"/auth/me",{
   headers:{
    "Authorization":"Bearer "+token
   }
  })

  if(!res.ok){
   console.warn("No se pudo validar sesión")
   return
  }

  const data = await res.json()

  if(!data.role){
   console.warn("Usuario sin rol")
   return
  }

  if(data.role !== "admin"){
   console.warn("Usuario no es admin")
   return
  }

 }catch(error){

  console.error("Error verificando sesión:",error)

 }

}

/*
========================================================
COTIZACIONES
========================================================
*/

async function cargarCotizaciones(){

 try{

  const data = await api("/cotizaciones")

  const tabla = document.getElementById("tabla")

  if(!tabla) return

  tabla.innerHTML=""

  data.forEach(c=>{

   tabla.innerHTML+=`
   <tr>
   <td>${c.marca}</td>
   <td>${c.modelo}</td>
   <td>${c.version}</td>
   <td>${c.anio}</td>
   <td>${c.km}</td>
   <td>${c.estado}</td>
   <td>${c.precio}</td>
   <td>${new Date(c.fecha).toLocaleDateString()}</td>
   <td>${c.usuario}</td>
   <td>

   <button onclick="editar('${c.id}')">
   Editar
   </button>

   <button onclick="eliminar('${c.id}')">
   Eliminar
   </button>

   </td>
   </tr>
   `
  })

 }catch(err){

  console.error("Error cargando cotizaciones",err)

 }

}

function editar(id){

 document.getElementById("editorCotizacion").style.display="block"
 document.getElementById("editId").value=id

}

function cancelarEdicion(){

 document.getElementById("editorCotizacion").style.display="none"

}

async function guardarEdicion(){

 const id = document.getElementById("editId").value
 const km = document.getElementById("editKm").value
 const descuento = document.getElementById("editDescuento").value

 await api("/cotizaciones/"+id,"PUT",{
  km,
  descuento
 })

 cancelarEdicion()
 cargarCotizaciones()

}

async function eliminar(id){

 if(!confirm("Eliminar cotización?")) return

 await api("/cotizaciones/"+id,"DELETE")

 cargarCotizaciones()

}

/*
========================================================
USUARIOS
========================================================
*/

async function cargarUsuarios(){

 try{

  const users = await api("/users")

  const cont = document.getElementById("tablaUsuarios")

  if(!cont) return

  cont.innerHTML=""

  users.forEach(u=>{

   cont.innerHTML+=`
   <tr>

   <td>${u.email}</td>

   <td>
   <select onchange="cambiarRol('${u.id}',this.value)">

   <option value="admin" ${u.role=="admin"?"selected":""}>
   admin
   </option>

   <option value="cotizador" ${u.role=="cotizador"?"selected":""}>
   cotizador
   </option>

   </select>

   </td>

   </tr>
   `
  })

 }catch(err){

  console.error("Error cargando usuarios",err)

 }

}

async function cambiarRol(id,role){

 await api("/users/"+id,"PUT",{role})

}

/*
========================================================
CONFIGURACIÓN KM
========================================================
*/

async function cargarConfigKM(){

 try{

  const config = await api("/auth/cotizador/km")

  const tabla = document.getElementById("tablaKM")

  if(!tabla) return

  tabla.innerHTML=""

  config.tabla.forEach(r=>{

   tabla.innerHTML+=`
   <tr>

   <td>${r.km}</td>

   <td>${r.descuento}</td>

   <td>

   <button onclick="eliminarFilaKM(${r.km})">
   eliminar
   </button>

   </td>

   </tr>
   `
  })

 }catch(err){

  console.error("Error cargando KM",err)

 }

}

async function agregarKM(){

 const km = document.getElementById("kmValor").value
 const descuento = document.getElementById("kmDesc").value

 const config = await api("/auth/config/km")

 config.tabla.push({
  km:Number(km),
  descuento:Number(descuento)
 })

 await api("/km","PUT",{tabla:config.tabla})

 cargarConfigKM()

}

async function eliminarFilaKM(km){

 const config = await api("/auth/km")

 config.tabla = config.tabla.filter(r=>r.km!=km)

 await api("/km","PUT",{tabla:config.tabla})

 cargarConfigKM()

}

/*
========================================================
INICIO PANEL
========================================================
*/

window.onload=()=>{

 console.log("Panel cargado")

 verificarRolAdmin()

 cargarCotizaciones()
 cargarUsuarios()
 cargarConfigKM()

 setInterval(verificarRolAdmin,30000)

}
