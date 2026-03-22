const express = require("express")
const cors = require("cors")
const path = require("path")

// ================= ROUTES =================
const authRoutes = require("./src/routes/auth.routes")
const userRoutes = require("./src/routes/user.routes")
const cotizacionRoutes = require("./src/routes/cotizacion.routes")
const configRoutes = require("./src/routes/config.routes")
const cotizadorRoutes = require("./src/routes/cotizador.routes")

const { cargarDesdeJSON } = require("./src/services/precios.service")

const app = express()

// ================= MIDDLEWARE =================
app.use(cors())
app.use(express.json())

app.use(express.static(path.join(__dirname, "public")))

// ================= DEBUG GLOBAL =================
app.use((req, res, next) => {
  console.log("========================================")
  console.log("➡️ REQUEST:", req.method, req.originalUrl)
  console.log("PARAMS:", req.params)
  console.log("QUERY:", req.query)
  console.log("BODY:", req.body)
  console.log("========================================")
  next()
})

// ================= API =================

// 🔍 health check
app.get("/api/status", async (req, res) => {
  console.log("📌 STATUS CHECK\n")

  const rutas = []

  function getRoutes(stack, basePath = "") {
    stack.forEach(middleware => {

      if (middleware.route) {
        // rutas directas
        const path = basePath + middleware.route.path
        const methods = Object.keys(middleware.route.methods)

        methods.forEach(method => {
          rutas.push({
            method: method.toUpperCase(),
            path
          })
        })

      } else if (middleware.name === "router" && middleware.handle.stack) {
        // rutas dentro de routers
        const newBase = middleware.regexp
          .toString()
          .replace("/^\\", "")
          .replace("\\/?(?=\\/|$)/i", "")
          .replace(/\\\//g, "/")

        getRoutes(middleware.handle.stack, basePath + "/" + newBase)
      }

    })
  }

  getRoutes(app._router.stack)

  // 🔥 LOG BONITO EN CONSOLA
  console.log("========================================")
  console.log("📡 RUTAS REGISTRADAS:")
  console.log("========================================")

  rutas.forEach(r => {
    console.log(`${r.method.padEnd(6)} ${r.path}`)
  })

  console.log("========================================\n")

  res.json({
    ok: true,
    total: rutas.length,
    rutas
  })
})

// ================= RUTAS =================

// 🔐 AUTH
app.use("/api/auth", authRoutes)

// 👤 USERS
app.use("/api/users", userRoutes)

// 💰 COTIZACIONES GUARDADAS
app.use("/api/cotizaciones", cotizacionRoutes)

// ⚠️ CONFIG (ANTES MAL)
app.use("/api/config", configRoutes)

// 🔥 COTIZADOR (ANTES MAL TAMBIÉN)
app.use("/api/cotizador", cotizadorRoutes)

// ================= DEBUG DE RUTAS =================
app.use((req, res) => {
  console.log("❌ RUTA NO ENCONTRADA:", req.originalUrl)
  res.status(404).json({
    error: "Ruta no encontrada",
    url: req.originalUrl
  })
})

// ================= FRONT =================
app.get("/", (req, res) => {
  console.log("📄 SERVING INDEX.HTML")
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

// ================= START =================
const PORT = process.env.PORT || 3000

app.listen(PORT, async () => {
  console.log("========================================")
  console.log("🚀 SERVER ON", PORT)
  console.log("🌐 http://localhost:" + PORT)
  console.log("========================================")

  try {
    console.log("📦 Cargando precios desde JSON...")
    
    await cargarDesdeJSON()

    console.log("✅ PRECIOS CARGADOS OK")
  } catch (err) {
    console.error("❌ ERROR CARGANDO PRECIOS")
    console.error(err)
  }
})
