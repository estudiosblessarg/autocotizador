const { db } = require("../config/firebase")
const fs = require("fs-extra")
const path = require("path")

const JSON_PATH = path.join(__dirname, "autos.json")

const USD_TO_ARS = 1500

// ================= DETECTAR MARCA =================
function detectarMarcaDesdeModelo(modelo) {

 const mapa = {
  "SENTRA": "NISSAN",
  "VERSA": "NISSAN",
  "COROLLA": "TOYOTA",
  "HILUX": "TOYOTA",
  "AMAROK": "VOLKSWAGEN",
  "GOL": "VOLKSWAGEN",
  "CRONOS": "FIAT",
  "208": "PEUGEOT",
  "2008": "PEUGEOT",
  "3008": "PEUGEOT"
 }

 return mapa[modelo] || "OTRA"
}

// ================= NORMALIZAR ID =================
function normalizar(str) {
 return str
  .toLowerCase()
  .replace(/\s+/g, "_")
  .replace(/[^a-z0-9_]/g, "")
}

// ================= CARGAR JSON =================
async function cargarDesdeJSON() {

 const data = await fs.readJson(JSON_PATH)

 console.log("📦 Marcas en JSON:", Object.keys(data).length)

 let batch = db.batch()
 let operaciones = 0
 let total = 0

 // 🔥 ahora el JSON YA es config
 const configAutos = data

 for (const [marca, marcaData] of Object.entries(data)) {

  const marcaId = normalizar(marca)
  const marcaRef = db.collection("marcas").doc(marcaId)

  batch.set(marcaRef, { nombre: marca }, { merge: true })

  for (const [modelo, modeloData] of Object.entries(marcaData.modelos || {})) {

   const modeloId = normalizar(modelo)
   const modeloRef = marcaRef.collection("modelos").doc(modeloId)

   batch.set(modeloRef, {
    nombre: modelo,
    marca: marca
   }, { merge: true })

   for (const [version, versionData] of Object.entries(modeloData.versiones || {})) {

    const versionId = normalizar(version)
    const versionRef = modeloRef.collection("versiones").doc(versionId)

    // 🔥 Tomamos el primer año como referencia de precio
    const anios = versionData.anios || {}
    const primerAnio = Object.keys(anios)[0]
    const precio = anios[primerAnio]

    batch.set(versionRef, {
     nombre: version,
     precio_usd: precio || 0,
     precio_ars: precio ? Math.round(precio * USD_TO_ARS) : 0,
     updatedAt: new Date()
    })

    total++
    operaciones++

    console.log(`🚗 ${marca} | ${modelo} | ${version} | 💰 ${precio}`)

    if (operaciones >= 400) {
     await batch.commit()
     console.log("💾 Batch guardado...")
     batch = db.batch()
     operaciones = 0
    }

   }
  }
 }

 // guardar resto
 if (operaciones > 0) {
  await batch.commit()
 }

 // 🔥 guardamos config directo (ya viene perfecto)
 await db.collection("config").doc("autos").set({
  data: configAutos,
  updatedAt: new Date()
 })

 console.log("\n========================")
 console.log("✅ CARGA COMPLETA")
 console.log("========================")
 console.log("🚗 Total versiones:", total)
 console.log("🧠 Config guardada en config/autos")
 console.log("========================\n")
}
 // ================= GUARDAR CONFIG =================

 await db.collection("config").doc("autos").set({
  data: configAutos,
  updatedAt: new Date()
 })

 console.log("\n========================")
 console.log("✅ CARGA COMPLETA")
 console.log("========================")
 console.log("🚗 Total autos:", total)
 console.log("🧠 Config guardada en config/autos")
 console.log("========================\n")

}

module.exports = {
 cargarDesdeJSON
}
