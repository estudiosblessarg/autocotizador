const { db } = require("../config/firebase")

// ================= NORMALIZADOR PRO =================
function normalizar(texto) {
  if (!texto) return ""

  return texto
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
}

// ================= CACHE SIMPLE =================
let cache = null
let lastFetch = 0
const CACHE_TTL = 1000 * 60 * 5 // 5 min

// ================= TRAER MARCAS =================
async function getConfig() {
  try {
    if (cache && Date.now() - lastFetch < CACHE_TTL) {
      console.log("⚡ usando cache marcas")
      return cache
    }

    console.log("📡 consultando Firebase marcas...")

    const snapshot = await db.collection("marcas").get()

    if (snapshot.empty) {
      console.log("❌ colección marcas vacía")
      return null
    }

    const data = {}

    snapshot.forEach(doc => {
      data[doc.id] = true
    })

    cache = data
    lastFetch = Date.now()

    console.log("✅ marcas cargadas:", Object.keys(data))

    return cache

  } catch (error) {
    console.error("❌ ERROR GET CONFIG:", error)
    return null
  }
}

// ================= MARCAS =================
exports.getMarcas = async (req, res) => {
  try {
    console.log("📌 GET MARCAS")

    const config = await getConfig()

    if (!config) return res.json([])

    const marcas = Object.keys(config).sort()

    console.log("✅ marcas:", marcas)

    res.json(marcas)

  } catch (err) {
    console.error("❌ ERROR MARCAS:", err)
    res.status(500).json({ error: err.message })
  }
}

// ================= MODELOS =================
exports.getModelos = async (req, res) => {
  try {
    let { marca } = req.params

    marca = normalizar(marca)

    console.log("📌 GET MODELOS:", marca)

    const snap = await db
      .collection("marcas")
      .doc(marca)
      .collection("modelos")
      .get()

    if (snap.empty) {
      console.log("⚠️ sin modelos para:", marca)
      return res.json([])
    }

    const modelos = snap.docs.map(d => d.id).sort()

    console.log("✅ modelos:", modelos)

    res.json(modelos)

  } catch (err) {
    console.error("❌ ERROR MODELOS:", err)
    res.status(500).json({ error: err.message })
  }
}

// ================= VERSIONES =================
exports.getVersiones = async (req, res) => {
  try {
    let { marca, modelo } = req.params

    marca = normalizar(marca)
    modelo = normalizar(modelo)

    console.log("📌 GET VERSIONES:", { marca, modelo })

    const snap = await db
      .collection("marcas")
      .doc(marca)
      .collection("modelos")
      .doc(modelo)
      .collection("versiones")
      .get()

    if (snap.empty) {
      console.log("⚠️ sin versiones:", { marca, modelo })
      return res.json([])
    }

    const versiones = snap.docs.map(d => d.id).sort()

    console.log("✅ versiones:", versiones)

    res.json(versiones)

  } catch (err) {
    console.error("❌ ERROR VERSIONES:", err)
    res.status(500).json({ error: err.message })
  }
}

// ================= AÑOS =================
exports.getAnios = async (req, res) => {
  try {
    let { marca, modelo, version } = req.params

    marca = normalizar(marca)
    modelo = normalizar(modelo)
    version = normalizar(version)

    console.log("📌 GET AÑOS:", { marca, modelo, version })

    const doc = await db
      .collection("marcas")
      .doc(marca)
      .collection("modelos")
      .doc(modelo)
      .collection("versiones")
      .doc(version)
      .get()

    if (!doc.exists) {
      console.log("❌ versión no existe")
      return res.json([])
    }

    const aniosObj = doc.data().anios || {}

    const lista = Object.keys(aniosObj)
      .map(a => Number(a))
      .sort((a, b) => b - a)

    console.log("✅ años:", lista)

    res.json(lista)

  } catch (err) {
    console.error("❌ ERROR AÑOS:", err)
    res.status(500).json({ error: err.message })
  }
}

// ================= COTIZAR =================
exports.cotizar = async (req, res) => {
  try {
    let { marca, modelo, version, anio, km } = req.body

    marca = normalizar(marca)
    modelo = normalizar(modelo)
    version = normalizar(version)

    console.log("📌 COTIZAR:", { marca, modelo, version, anio, km })

    if (!marca || !modelo || !version || !anio) {
      return res.status(400).json({
        error: "marca, modelo, version y anio requeridos"
      })
    }

    const doc = await db
      .collection("marcas")
      .doc(marca)
      .collection("modelos")
      .doc(modelo)
      .collection("versiones")
      .doc(version)
      .get()

    if (!doc.exists) {
      console.log("❌ versión no encontrada")
      return res.status(404).json({
        error: "Versión no encontrada"
      })
    }

    const anios = doc.data().anios || {}

    const precioBase = anios[anio]

    if (!precioBase) {
      console.log("❌ precio no encontrado para año:", anio)
      return res.status(404).json({
        error: "No se encontró precio"
      })
    }

    // ================= AJUSTE KM =================
    let ajusteKm = 0

    if (km > 100000) ajusteKm = 0.15
    else if (km > 70000) ajusteKm = 0.10
    else if (km > 40000) ajusteKm = 0.05

    const precioFinal = Math.round(precioBase - (precioBase * ajusteKm))

    console.log("💰 resultado:", {
      precioBase,
      precioFinal,
      ajusteKm
    })

    res.json({
      precioBase,
      precioFinal,
      descuentoKM: ajusteKm * 100
    })

  } catch (err) {
    console.error("❌ ERROR COTIZAR:", err)
    res.status(500).json({ error: err.message })
  }
}
