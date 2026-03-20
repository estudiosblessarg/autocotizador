const { db } = require("../config/firebase")
const fs = require("fs-extra")
const path = require("path")

// ================= JSON LOCAL =================
const JSON_PATH = path.join(__dirname, "../services/autos.json")

let autosJSON = null

async function getJSON() {
  if (!autosJSON) {
    console.log("📂 cargando JSON local...")
    autosJSON = await fs.readJson(JSON_PATH)
  }
  return autosJSON
}

// ================= NORMALIZADOR PRO =================
function normalizar(texto) {
  if (!texto) return ""

  return texto
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
}

// ================= BUSQUEDA LOCAL =================
function buscarEnJSON(data, marca, modelo, version) {
  try {
    const marcaData = data[marca]
    if (!marcaData) return null

    const modeloData = marcaData.modelos?.[modelo]
    if (!modeloData) return null

    const versionData = modeloData.versiones?.[version]
    if (!versionData) return null

    return versionData.anios || null

  } catch (e) {
    return null
  }
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
      console.log("⚠️ Firebase vacío, usando JSON fallback")

      const json = await getJSON()
      const data = {}

      Object.keys(json).forEach(marca => {
        data[normalizar(marca)] = true
      })

      cache = data
      lastFetch = Date.now()

      return cache
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

    console.log("📂 fallback JSON marcas")
    const json = await getJSON()

    const data = {}
    Object.keys(json).forEach(marca => {
      data[normalizar(marca)] = true
    })

    return data
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

    let modelos = []

    try {
      const snap = await db
        .collection("marcas")
        .doc(marca)
        .collection("modelos")
        .get()

      if (!snap.empty) {
        modelos = snap.docs.map(d => d.id)
        console.log("🔥 modelos desde Firebase")
      } else {
        console.log("⚠️ Firebase vacío")
      }

    } catch (err) {
      console.log("❌ error Firebase")
    }

    // 🔥 fallback JSON
    if (!modelos.length) {
      const json = await getJSON()
      const marcaData = json[marca]

      if (marcaData?.modelos) {
        modelos = Object.keys(marcaData.modelos).map(normalizar)
        console.log("📂 modelos desde JSON")
      }
    }

    res.json(modelos.sort())

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

    let versiones = []

    try {
      const snap = await db
        .collection("marcas")
        .doc(marca)
        .collection("modelos")
        .doc(modelo)
        .collection("versiones")
        .get()

      if (!snap.empty) {
        versiones = snap.docs.map(d => d.id)
        console.log("🔥 versiones desde Firebase")
      } else {
        console.log("⚠️ Firebase vacío")
      }

    } catch (err) {
      console.log("❌ error Firebase")
    }

    // 🔥 fallback JSON
    if (!versiones.length) {
      const json = await getJSON()
      const marcaData = json[marca]

      const modeloData = marcaData?.modelos?.[modelo]

      if (modeloData?.versiones) {
        versiones = Object.keys(modeloData.versiones).map(normalizar)
        console.log("📂 versiones desde JSON")
      }
    }

    res.json(versiones.sort())

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

    let aniosObj = null

    // ================= FIREBASE =================
    try {
      const doc = await db
        .collection("marcas")
        .doc(marca)
        .collection("modelos")
        .doc(modelo)
        .collection("versiones")
        .doc(version)
        .get()

      if (doc.exists) {
        const data = doc.data()

        if (data && data.anios && Object.keys(data.anios).length > 0) {
          console.log("🔥 datos desde FIREBASE")
          aniosObj = data.anios
        } else {
          console.log("⚠️ Firebase devolvió vacío")
        }
      }

    } catch (err) {
      console.log("❌ error Firebase, usando JSON")
    }

    // ================= JSON =================
    if (!aniosObj) {
      const json = await getJSON()
      const resultado = buscarEnJSON(json, marca, modelo, version)

      if (resultado && Object.keys(resultado).length > 0) {
        console.log("📂 datos desde JSON")
        aniosObj = resultado
      }
    }

    if (!aniosObj) return res.json([])

    const lista = Object.keys(aniosObj)
      .map(a => Number(a))
      .sort((a, b) => b - a)

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

    let anios = null

    // ================= FIREBASE =================
    try {
      const doc = await db
        .collection("marcas")
        .doc(marca)
        .collection("modelos")
        .doc(modelo)
        .collection("versiones")
        .doc(version)
        .get()

      if (doc.exists) {
        const data = doc.data()

        if (data && data.anios && Object.keys(data.anios).length > 0) {
          console.log("🔥 cotizando desde FIREBASE")
          anios = data.anios
        } else {
          console.log("⚠️ Firebase vacío")
        }
      }

    } catch (err) {
      console.log("❌ Firebase error, fallback JSON")
    }

    // ================= JSON =================
    if (!anios) {
      const json = await getJSON()
      const resultado = buscarEnJSON(json, marca, modelo, version)

      if (resultado) {
        console.log("📂 cotizando desde JSON")
        anios = resultado
      }
    }

    if (!anios) {
      return res.status(404).json({
        error: "Versión no encontrada"
      })
    }

    const precioBase = anios[anio]

    if (!precioBase) {
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