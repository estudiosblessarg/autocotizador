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

const res = await fetch("/api/auth/login",{

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

const data = await res.json()

console.log("📦 Response data:", data)

if(res.ok){

console.log("✅ Login correcto")

console.log("👤 Rol recibido:", data.role)

if(data.role === "admin"){

console.log("➡️ Redirigiendo a admin.html")

window.location.href="admin.html"

}

if(data.role === "cotizador"){

console.log("➡️ Redirigiendo a cotizador.html")

window.location.href="cotizador.html"

}

}else{

console.error("❌ Error en login:", data)

msg.innerText = data.error || "Error desconocido"

}

}catch(err){

console.error("🔥 Error de conexión:", err)

msg.innerText="Error de conexión"

}

})
