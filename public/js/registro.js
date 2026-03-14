const registerBtn = document.getElementById("registerBtn")

registerBtn.addEventListener("click", async ()=>{

console.log("🔹 Click en botón REGISTER")

const email = document.getElementById("email").value
const password = document.getElementById("password").value
const role = document.getElementById("role").value

const msg = document.getElementById("mensaje")

console.log("📧 Email:", email)
console.log("🔑 Password length:", password.length)
console.log("👤 Role:", role)

try{

console.log("🚀 Enviando request a /api/auth/register")

const res = await fetch("/api/auth/register",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
email,
password,
role
})

})

console.log("📡 Response status:", res.status)

const data = await res.json()

console.log("📦 Response data:", data)

if(res.ok){

console.log("✅ Usuario creado correctamente")

msg.innerText = "Usuario creado"

setTimeout(()=>{

console.log("➡️ Redirigiendo a login.html")

window.location.href="login.html"

},1200)

}else{

console.error("❌ Error al crear usuario:", data)

msg.innerText = data.error || "Error al crear usuario"

}

}catch(err){

console.error("🔥 Error de conexión:", err)

msg.innerText = "Error de conexión"

}

})
