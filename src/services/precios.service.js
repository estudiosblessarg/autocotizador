const { db } = require("../config/firebase")
const fs = require("fs-extra")
const path = require("path")

const JSON_PATH = path.join(__dirname, "autos.json")

function normalizar(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
}

// 🔥 delay helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function cargarDesdeJSON() {

  const data = await fs.readJson(JSON_PATH)

  console.log("📦 Marcas en JSON:", Object.keys(data).length)

  let totalVersiones = 0

  for (const marcaData of Object.values(data)) {
    for (const modeloData of Object.values(marcaData.modelos || {})) {
      totalVersiones += Object.keys(modeloData.versiones || {}).length
    }
  }

  console.log("📊 Total versiones:", totalVersiones)

  let procesadas = 0
  let batch = db.batch()
  let operaciones = 0

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

        const anios = versionData.anios || {}

        batch.set(versionRef, {
          nombre: version,
          anios,
          updatedAt: new Date()
        })

        procesadas++
        operaciones++

        // 🔥 progreso
        if (procesadas % 50 === 0) {
          const porcentaje = ((procesadas / totalVersiones) * 100).toFixed(2)
          console.log(`🚀 ${procesadas}/${totalVersiones} (${porcentaje}%)`)
        }

        // 🔥 commit controlado
        if (operaciones >= 400) {

          try {
            console.log("💾 Commit...")

            console.time("⏱ commit")

            await batch.commit()

            console.timeEnd("⏱ commit")

            console.log("✅ OK")

            // 🔥 PAUSA PARA NO SATURAR FIRESTORE
            await sleep(200) // podés subir a 300–500 si sigue jodiendo

          } catch (err) {
            console.error("❌ ERROR EN COMMIT:", err)
            await sleep(1000) // retry cooldown
          }

          batch = db.batch()
          operaciones = 0
        }

      }
    }
  }

  // 🔥 último commit
  if (operaciones > 0) {
    console.log("💾 Último commit...")
    await batch.commit()
  }

  console.log("\n========================")
  console.log("✅ CARGA COMPLETA")
  console.log(`🚗 Total: ${procesadas}`)
  console.log("========================\n")
}

module.exports = {
  cargarDesdeJSON
}
