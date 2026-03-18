const express = require("express")
const cors = require("cors")
const path = require("path")

const authRoutes = require("./src/routes/auth.routes")

// 🔥 NUEVAS RUTAS
const userRoutes = require("./src/routes/user.routes")
const cotizacionRoutes = require("./src/routes/cotizacion.routes")
const configRoutes = require("./src/routes/config.routes")
const cotizadorRoutes = require("./src/routes/cotizador.routes")

const { cargarDesdeJSON } = require("./src/services/precios.service")

const app = express()

app.use(cors())
app.use(express.json())

app.use(express.static(path.join(__dirname,"public")))

// ================= API =================

app.get("/api/status",(req,res)=>{
 res.json({ok:true})
})

// 🔥 RUTAS REALES
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/cotizaciones", cotizacionRoutes)
app.use("/km", configRoutes)
app.use("/api/auth/cotizador", cotizadorRoutes)

// ================= FRONT =================

app.get("/",(req,res)=>{
 res.sendFile(path.join(__dirname,"public","index.html"))
})

// ================= START =================

const PORT = process.env.PORT || 3000

app.listen(PORT, async ()=>{
 console.log("🚀 SERVER ON", PORT)

 cargarDesdeJSON()
  .then(()=> console.log("✅ precios cargados"))
  .catch(err=> console.error(err))
})
