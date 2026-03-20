const express = require("express")
const cors = require("cors")
const admin = require("firebase-admin")

// ================= FIREBASE INIT =================
// 🔥 IMPORTANTE: en Render tenés que guardar FIREBASE_KEY como JSON string

let serviceAccount

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_KEY)
} catch (err) {
  console.error("❌ ERROR PARSE FIREBASE_KEY")
  console.error(err)
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

// ================= APP =================
const app = express()

app.use(cors())
app.use(express.json())

// ================= DEBUG GLOBAL =================
app.use((req, res, next) => {
  console.log("===================================")
  console.log("➡️ REQUEST:", req.method, req.url)
  console.log("PARAMS:", req.params)
  console.log("QUERY:", req.query)
  console.log("BODY:", req.body)
  next()
})

// ================= NORMALIZADOR =================
function normalizar(texto) {
  if (!texto) return ""
  return texto.toString().toLowerCase().trim()
}

// ======================================================
// ====================== COTIZADOR ======================
// ======================================================

// ================= MARCAS =================
app.get("/api/cotizador/marcas", async (req, res) => {
  try {
    console.log("📌 GET MARCAS")

    const snapshot = await db.collection("marcas").get()

    const marcas = []
    snapshot.forEach(doc => {
      marcas.push(doc.id)
    })

    console.log("✅ MARCAS:", marcas)

    res.json(marcas)
  } catch (error) {
    console.error("❌ ERROR MARCAS:", error)
    res.status(500).json({ error: "Error obteniendo marcas" })
  }
})

// ================= MODELOS =================
app.get("/api/cotizador/modelos/:marca", async (req, res) => {
  try {
    const marca = normalizar(req.params.marca)

    console.log("📌 GET MODELOS")
    console.log("👉 marca normalizada:", marca)

    const marcaRef = db.collection("marcas").doc(marca)
    const marcaDoc = await marcaRef.get()

    if (!marcaDoc.exists) {
      console.log("❌ LA MARCA NO EXISTE EN FIREBASE")
      return res.json([])
    }

    const snapshot = await marcaRef.collection("modelos").get()

    if (snapshot.empty) {
      console.log("⚠️ NO HAY MODELOS PARA ESTA MARCA")
    }

    const modelos = []
    snapshot.forEach(doc => {
      modelos.push(doc.id)
    })

    console.log("✅ MODELOS:", modelos)

    res.json(modelos)
  } catch (error) {
    console.error("❌ ERROR MODELOS:", error)
    res.status(500).json({ error: "Error obteniendo modelos" })
  }
})

// ================= VERSIONES =================
app.get("/api/cotizador/versiones/:marca/:modelo", async (req, res) => {
  try {
    const marca = normalizar(req.params.marca)
    const modelo = normalizar(req.params.modelo)

    console.log("📌 GET VERSIONES")
    console.log("👉 marca:", marca)
    console.log("👉 modelo:", modelo)

    const modeloRef = db
      .collection("marcas")
      .doc(marca)
      .collection("modelos")
      .doc(modelo)

    const modeloDoc = await modeloRef.get()

    if (!modeloDoc.exists) {
      console.log("❌ EL MODELO NO EXISTE")
      return res.json([])
    }

    const snapshot = await modeloRef.collection("versiones").get()

    if (snapshot.empty) {
      console.log("⚠️ NO HAY VERSIONES")
    }

    const versiones = []
    snapshot.forEach(doc => {
      versiones.push(doc.id)
    })

    console.log("✅ VERSIONES:", versiones)

    res.json(versiones)
  } catch (error) {
    console.error("❌ ERROR VERSIONES:", error)
    res.status(500).json({ error: "Error obteniendo versiones" })
  }
})

// ================= AÑOS =================
app.get("/api/cotizador/anios/:marca/:modelo/:version", async (req, res) => {
  try {
    const marca = normalizar(req.params.marca)
    const modelo = normalizar(req.params.modelo)
    const version = normalizar(req.params.version)

    console.log("📌 GET AÑOS")
    console.log("👉", { marca, modelo, version })

    const doc = await db
      .collection("marcas")
      .doc(marca)
      .collection("modelos")
      .doc(modelo)
      .collection("versiones")
      .doc(version)
      .get()

    if (!doc.exists) {
      console.log("❌ VERSION NO EXISTE")
      return res.json([])
    }

    const data = doc.data()

    console.log("📦 DATA VERSION:", data)

    const anios = Object.keys(data?.anios || {})

    console.log("✅ AÑOS:", anios)

    res.json(anios)
  } catch (error) {
    console.error("❌ ERROR AÑOS:", error)
    res.status(500).json({ error: "Error obteniendo años" })
  }
})

// ======================================================
// ====================== CONFIG =========================
// ======================================================

// ================= KM =================
app.get("/api/config/km", async (req, res) => {
  try {
    console.log("📌 GET KM")

    const doc = await db.collection("config").doc("km").get()

    if (!doc.exists) {
      console.log("⚠️ KM NO EXISTE")
      return res.json({})
    }

    console.log("✅ KM:", doc.data())

    res.json(doc.data())
  } catch (error) {
    console.error("❌ ERROR KM:", error)
    res.status(500).json({ error: "Error KM" })
  }
})

// ================= DOLAR =================
app.get("/api/config/dolar", async (req, res) => {
  try {
    console.log("📌 GET DOLAR")

    const doc = await db.collection("config").doc("dolar").get()

    if (!doc.exists) {
      console.log("⚠️ DOLAR NO EXISTE")
      return res.json({})
    }

    console.log("✅ DOLAR:", doc.data())

    res.json(doc.data())
  } catch (error) {
    console.error("❌ ERROR DOLAR:", error)
    res.status(500).json({ error: "Error dolar" })
  }
})

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("🚀 API FUNCIONANDO")
})

// ================= SERVER =================
const PORT = process.env.PORT || 10000

app.listen(PORT, () => {
  console.log("===================================")
  console.log(`🔥 SERVER RUNNING ON PORT ${PORT}`)
  console.log("===================================")
})
