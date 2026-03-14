loginBtn.addEventListener("click", async ()=>{

const email = document.getElementById("email").value
const password = document.getElementById("password").value
const msg = document.getElementById("mensaje")

try{

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

const data = await res.json()

if(res.ok){

if(data.role === "admin"){
window.location.href="admin.html"
}

if(data.role === "cotizador"){
window.location.href="cotizador.html"
}

}else{

msg.innerText = data.error

}

}catch(err){

msg.innerText="Error de conexión"

}

})