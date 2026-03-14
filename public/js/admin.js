/*
========================================================
CERRAR SESIÓN
Elimina el token guardado y redirige al login
========================================================
*/

function logout(){

 // eliminar token almacenado
 localStorage.removeItem("token")

 // opcional: limpiar otros datos
 localStorage.removeItem("user")

 // redirigir al login
 window.location.href = "login.html"

}





/*
========================================================
CONFIGURACIÓN GENERAL DE API
========================================================
*/

const API = "/api/auth"



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
FUNCIÓN BASE PARA API
========================================================
*/

async function api(url,method="GET",body=null){

 try{

  const res = await fetch(API+url,{
   method,
   headers:{
    "Content-Type":"application/json",
    "Authorization":"Bearer "+getToken()
   },
   body: body ? JSON.stringify(body):null
  })

  if(!res.ok){
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

 try{

  const res = await fetch(API+"/me",{
   headers:{
    "Authorization":"Bearer "+getToken()
   }
  })

  if(!res.ok){
   window.location.href="login.html"
   return
  }

  const data = await res.json()

  if(!data.role || data.role !== "admin"){
   window.location.href="login.html"
  }

 }catch(error){

  console.error("Error verificando sesión:",error)
  window.location.href="login.html"

 }

}



/*
========================================================
COTIZACIONES
========================================================
GET /api/auth/
PUT /api/auth/:id
DELETE /api/auth/:id
*/

async function cargarCotizaciones(){

 const data = await api("/cotizaciones")

 const tabla = document.getElementById("tabla")

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

 await api("/"+id,"PUT",{
  km,
  descuento
 })

 cancelarEdicion()
 cargarCotizaciones()

}



async function eliminar(id){

 if(!confirm("Eliminar cotización?")) return

 await api("/"+id,"DELETE")

 cargarCotizaciones()

}



/*
========================================================
USUARIOS
========================================================
GET /api/auth/users
PUT /api/auth/users/:id
*/

async function cargarUsuarios(){

 const users = await api("/users")

 const cont = document.getElementById("tablaUsuarios")

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

}



async function cambiarRol(id,role){

 await api("/users/"+id,"PUT",{role})

}



/*
========================================================
CONFIGURACIÓN KM
========================================================
GET /api/auth/km
PUT /api/auth/km
*/

async function cargarConfigKM(){

 const config = await api("/km")

 const tabla = document.getElementById("tablaKM")

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

}



async function agregarKM(){

 const km = document.getElementById("kmValor").value
 const descuento = document.getElementById("kmDesc").value

 const config = await api("/km")

 config.tabla.push({
  km:Number(km),
  descuento:Number(descuento)
 })

 await api("/km","PUT",{tabla:config.tabla})

 cargarConfigKM()

}



async function eliminarFilaKM(km){

 const config = await api("/km")

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

 verificarRolAdmin()

 cargarCotizaciones()
 cargarUsuarios()
 cargarConfigKM()

 setInterval(verificarRolAdmin,30000)

}