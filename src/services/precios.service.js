const { db } = require("../config/firebase")

/**
 * Guarda toda la config de autos en:
 * config/autos → { data: {...}, updatedAt }
 */
async function guardarConfigAutos(configAutos) {
  try {
    if (!configAutos || typeof configAutos !== "object") {
      throw new Error("❌ configAutos inválido")
    }

    await db.collection("config").doc("autos").set({
      data: configAutos,
      updatedAt: new Date()
    })

    console.log("✅ Configuración de autos guardada correctamente")

  } catch (error) {
    console.error("❌ Error guardando configAutos:", error)
    throw error
  }
}

module.exports = {
  guardarConfigAutos
}
