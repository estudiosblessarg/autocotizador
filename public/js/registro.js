const registerBtn = document.getElementById("registerBtn")

registerBtn.addEventListener("click", async ()=>{

const email = document.getElementById("email").value
const password = document.getElementById("password").value
const role = document.getElementById("role").value

const msg = document.getElementById("mensaje")

try{

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

const data = await res.json()

if(res.ok){

msg.innerText = "Usuario creado"

setTimeout(()=>{
window.location.href="login.html"
},1200)

}else{

msg.innerText = data.error

}

}catch(err){

msg.innerText = "Error de conexión"

}

})