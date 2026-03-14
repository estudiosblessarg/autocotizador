const loginBtn = document.getElementById("loginBtn")

loginBtn.addEventListener("click", async () => {

console.log("🔹 Click en botón LOGIN")

const email = document.getElementById("email").value
const password = document.getElementById("password").value
const msg = document.getElementById("mensaje")

console.log("📧 Email ingresado:", email)
console.log("🔑 Password length:", password.length)

try{

console.log("🚀 Enviando request a /api/auth/login")

const res = await fetch("/login",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
email,
password
})
})

console.log("📡 Response status:", res.status)


// ========================================
// CAPTURA UNIVERSAL DE RESPUESTA
// ========================================

const raw = await res.text()

console.log("📨 Raw response:", raw)

let data

try{

data = JSON.parse(raw)

}catch(parseError){

console.warn("⚠️ La respuesta no es JSON, creando objeto manual")

data = {
success:false,
error:"Respuesta no JSON del servidor",
raw:raw
}

}

console.log("📦 JSON interpretado:", data)


// ========================================
// MANEJO DE RESPUESTA
// ========================================

if(res.ok){

console.log("✅ Login correcto")

if(!data.role){

console.warn("⚠️ No se recibió role")

msg.innerText = "Usuario sin rol"

return
}

console.log("👤 Rol recibido:", data.role)

if(data.role === "admin"){

console.log("➡️ Redirigiendo a admin.html")

window.location.href="admin.html"

return
}

if(data.role === "cotizador"){

console.log("➡️ Redirigiendo a cotizador.html")

window.location.href="cotizador.html"

return
}

console.warn("⚠️ Rol desconocido:", data.role)

msg.innerText = "Rol inválido"

}else{

console.error("❌ Login fallido")
console.error("📄 Error devuelto:", data)

msg.innerText = data.error || "Error desconocido"

}

}catch(err){

console.error("🔥 ERROR FETCH:", err)

const errorJSON = {
success:false,
error:"Error de conexión",
message:err.message,
stack:err.stack
}

console.log("📦 ERROR JSON:", errorJSON)

msg.innerText = errorJSON.error

}

})

