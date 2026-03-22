const fs = require("fs-extra")
const path = require("path")

const DATA_DIR = __dirname

let DB = null

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

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// 🔥 leer TODOS los JSON
async function leerJSONs() {
  const files = await fs.readdir(DATA_DIR)
  const jsonFiles = files.filter(f => f.endsWith(".json"))

  let data = {}

  for (const file of jsonFiles) {
    try {
      const filePath = path.join(DATA_DIR, file)
      const contenido = await fs.readJson(filePath)

      console.log("📄 JSON cargado:", file)

      // 🔥 merge profundo
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

  return data
}

// ================= MAIN =================
async function cargarDesdeJSON() {

  console.log("📦 Cargando precios desde JSON (modo local)...")

  const data = await leerJSONs()

  let total = 0
  let procesadas = 0

  // 🔥 contar versiones
  for (const marcaData of Object.values(data)) {
    for (const modeloData of Object.values(marcaData.modelos || {})) {
      total += Object.keys(modeloData.versiones || {}).length
    }
  }

  console.log("📊 Total versiones:", total)

  // 🔥 recorrer para debug (no guardar nada)
  for (const [marca, marcaData] of Object.entries(data)) {

    for (const [modelo, modeloData] of Object.entries(marcaData.modelos || {})) {

      for (const [version, versionData] of Object.entries(modeloData.versiones || {})) {

        procesadas++

        // progreso real
        if (procesadas % 50 === 0) {
          const pct = ((procesadas / total) * 100).toFixed(2)
          console.log(`🚀 ${procesadas}/${total} (${pct}%)`)
        }
      }
    }
  }

  DB = data

  console.log("================================")
  console.log("✅ DB LOCAL LISTA")
  console.log("🚗 Marcas:", Object.keys(DB).length)
  console.log("================================")

  return DB
}

// 🔥 getter para usar como DB
function getDB() {
  return DB
}

module.exports = {
  cargarDesdeJSON,
  getDB
}