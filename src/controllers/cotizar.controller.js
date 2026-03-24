const fs = require("fs-extra")
const path = require("path")
const {db} = require("../config/firebase")

// 📁 carpeta donde están los JSON
// 📁 carpeta services (CORREGIDO)
const DATA_DIR = path.join(__dirname, "../services")

let DB = null
let CARGANDO = false // 🔥 FALTABA ESTO

// ================= NORMALIZADOR =================
function normalizar(str, fallback = "undefined") {
  if (!str) return fallback

  const limpio = str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")

  return limpio === "" ? fallback : limpio
}

// ================= CARGAR TODOS LOS JSON =================
// ================= CARGAR TODOS LOS JSON =================
async function cargarDB() {

  if (DB) return DB

  if (CARGANDO) {
    console.log("⏳ Esperando carga existente...")
    while (!DB) {
      await new Promise(r => setTimeout(r, 200))
    }
    return DB
  }

  CARGANDO = true

  console.log("📂 Cargando JSON como DB desde services...")

  try {

    const files = await fs.readdir(DATA_DIR)

    const jsonFiles = files.filter(f => f.endsWith(".json"))

    let data = {}

    for (const file of jsonFiles) {

      const filePath = path.join(DATA_DIR, file)

      try {
        const contenido = await fs.readJson(filePath)

        console.log("📄 cargado:", file)

        for (const marca in contenido) {

          const marcaKey = normalizar(marca)

          if (!data[marcaKey]) {
            data[marcaKey] = { modelos: {} }
          }

          const modelos = contenido[marca]?.modelos || {}

          for (const modelo in modelos) {

            const modeloKey = normalizar(modelo)

            if (!data[marcaKey].modelos[modeloKey]) {
              data[marcaKey].modelos[modeloKey] = { versiones: {} }
            }

            const versiones = modelos[modelo]?.versiones || {}

            for (const version in versiones) {

              const versionKey = normalizar(version)

              data[marcaKey].modelos[modeloKey].versiones[versionKey] =
                versiones[version]
            }
          }
        }

      } catch (err) {
        console.error("❌ Error leyendo:", file, err.message)
      }
    }

    DB = data

    console.log("✅ DB lista:", Object.keys(DB).length, "marcas")

    return DB

  } catch (err) {
    console.error("💀 ERROR CRÍTICO DB:", err)
    throw err
  }
}

// ================= MARCAS =================
exports.getMarcas = async (req, res) => {
  try {
    const db = await cargarDB()
    res.json(Object.keys(db).sort())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ================= MODELOS =================
exports.getModelos = async (req, res) => {
  try {
    const db = await cargarDB()

    const marca = normalizar(req.params.marca)

    const modelos = Object.keys(
      db[marca]?.modelos || {}
    )

    res.json(modelos.sort())

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ================= VERSIONES =================
exports.getVersiones = async (req, res) => {
  try {
    const db = await cargarDB()

    const marca = normalizar(req.params.marca)
    const modelo = normalizar(req.params.modelo)

    const versiones = Object.keys(
      db[marca]?.modelos?.[modelo]?.versiones || {}
    )

    res.json(versiones.sort())

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ================= AÑOS =================
exports.getAnios = async (req, res) => {
  try {
    const db = await cargarDB()

    const marca = normalizar(req.params.marca)
    const modelo = normalizar(req.params.modelo)
    const version = normalizar(req.params.version)

    const anios =
      db[marca]?.modelos?.[modelo]?.versiones?.[version]?.anios

    if (!anios) return res.json([])

    const lista = Object.keys(anios)
      .map(Number)
      .sort((a, b) => b - a)

    res.json(lista)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

//====================
//OBETENER DESCUENTO DB
//====================
async function obtenerDescuentoDesdeDB(km) {
  try {
    const doc = await db.collection("config").doc("km").get()

    if (!doc.exists) {
      console.warn("⚠️ config/km no existe")
      return 0
    }

    const data = doc.data()

    // 🔥 usar tabla en vez de reglas
    if (!Array.isArray(data.tabla)) {
      console.warn("⚠️ tabla inválida en config/km")
      return 0
    }

    // 🔥 normalizar y ordenar
    const tabla = data.tabla
      .map(r => ({
        km: Number(r.km),
        descuento: Number(r.descuento)
      }))
      .sort((a, b) => a.km - b.km)

    let descuento = 0

    // 🔥 lógica por umbral
    for (const regla of tabla) {
      if (km >= regla.km) {
        descuento = regla.descuento
      }
    }

    return descuento

  } catch (err) {
    console.error("❌ Error leyendo KM desde Firebase:", err.message)
    return 0
  }
}

// ================= COTIZAR =================
exports.cotizar = async (req, res) => {
  try {
    const dbLocal = await cargarDB()

    const marca = normalizar(req.body.marca)
    const modelo = normalizar(req.body.modelo)
    const version = normalizar(req.body.version)
    const anio = req.body.anio
    const km = Number(req.body.km)

    const anios =
      dbLocal[marca]?.modelos?.[modelo]?.versiones?.[version]?.anios

    if (!anios) {
      return res.status(404).json({ error: "No encontrado" })
    }

    const precioBase = anios[anio]

    if (!precioBase) {
      return res.status(404).json({ error: "Sin precio" })
    }

    // 🔥 DESCUENTO DINÁMICO DESDE FIREBASE
    const descuento = await obtenerDescuentoDesdeDB(km)

    const precioFinal = Math.round(precioBase * (1 - descuento / 100))

    res.json({
      precioBase,
      precioFinal,
      descuentoKM: descuento
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
