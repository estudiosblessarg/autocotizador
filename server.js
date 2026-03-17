const express = require("express")
const cors = require("cors")
const path = require("path")

const authRoutes = require("./src/routes/auth.routes")

const { cargarDesdeJson } = require("./src/services/precios.service")

const app = express()

async function iniciarSistema(){

 try{

  console.log("Inicializando precios ACARA...")

  await actualizarSiNecesario()

  console.log("Precios cargados")

 }catch(err){

  console.error("Error cargando precios:",err)

 }

}

iniciarSistema()

// ======================
// MIDDLEWARE
// ======================

app.use(cors())
app.use(express.json())

// ======================
// STATIC FILES
// ======================

app.use(express.static(path.join(__dirname,"public")))

// ======================
// STATUS TEST
// ======================

app.get("/api/status",(req,res)=>{
 console.log("STATUS OK")
 res.status(200).json({ok:true})
})

// ======================
// API ROUTES
// ======================

app.use("/api/auth",authRoutes)

// ======================
// FRONTEND ROUTES
// ======================

app.get("/",(req,res)=>{
 res.sendFile(path.join(__dirname,"public","index.html"))
})

// ======================
// SERVER START
// ======================

const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{
 console.log("SERVER RUNNING ON PORT",PORT)
})
