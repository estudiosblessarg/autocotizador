const { db } = require("../config/firebase")
const fs = require("fs-extra")
const path = require("path")

const JSON_PATH = path.join(__dirname, "autos_acara.json")

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

 console.log("📦 Autos en JSON:", data.length)

 let batch = db.batch()
 let operaciones = 0
 let total = 0

 // 🔥 NUEVO: estructura para config
 const configAutos = {}

 for (const auto of data) {

  try {

   const { modelo, version, precio } = auto

   if (!modelo || !version || !precio) continue

   const marca =
    detectarMarcaDesdeModelo(modelo)

   const marcaId = normalizar(marca)
   const modeloId = normalizar(modelo)
   const versionId = normalizar(version)

   // ================= REFERENCES =================

   const marcaRef =
    db.collection("marcas").doc(marcaId)

   const modeloRef =
    marcaRef.collection("modelos").doc(modeloId)

   const versionRef =
    modeloRef.collection("versiones").doc(versionId)

   // ================= DATA =================

   batch.set(marcaRef, {
    nombre: marca
   }, { merge: true })

   batch.set(modeloRef, {
    nombre: modelo,
    marca: marca
   }, { merge: true })

   batch.set(versionRef, {
    nombre: version,
    precio_usd: precio,
    precio_ars: Math.round(precio * USD_TO_ARS),
    updatedAt: new Date()
   })

   // ================= CONFIG (NUEVO) =================

   if (!configAutos[marca]) {
    configAutos[marca] = {}
   }

   if (!configAutos[marca][modelo]) {
    configAutos[marca][modelo] = []
   }

   if (!configAutos[marca][modelo].includes(version)) {
    configAutos[marca][modelo].push(version)
   }

   operaciones++
   total++

   console.log(
    `🚗 ${marca} | ${modelo} | ${version} | 💰 ${precio}`
   )

   if (operaciones >= 400) {

    await batch.commit()

    console.log("💾 Batch guardado...")

    batch = db.batch()
    operaciones = 0
   }

  } catch (err) {
   console.error("❌ Error:", err)
  }
 }

 // Guardar lo que queda
 if (operaciones > 0)
  await batch.commit()

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
