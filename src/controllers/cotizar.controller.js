const { db } = require("../config/firebase")

exports.cotizar = async (req, res) => {

 try {

  const { marca, modelo, km } = req.body

  // ================= TRAER CONFIG =================
  const configDoc = await db
   .collection("config")
   .doc("autos")
   .get()

  if (!configDoc.exists) {
   return res.status(400).json({
    error: "No existe config/autos"
   })
  }

  const config = configDoc.data().data || {}

  // ================= VALIDACIONES =================
  if (!marca || !config[marca]) {
   return res.status(400).json({
    error: "Marca no encontrada",
    marcas: Object.keys(config) // 🔥 array
   })
  }

  if (!modelo || !config[marca][modelo]) {
   return res.status(400).json({
    error: "Modelo no encontrado",
    modelos: Object.keys(config[marca]) // 🔥 array
   })
  }

  const versiones = config[marca][modelo] // 🔥 ARRAY

  // ================= TRAER PRECIOS =================
  let precios = []

  for (const version of versiones) {

   const snap = await db
    .collection("marcas")
    .doc(marca.toLowerCase())
    .collection("modelos")
    .doc(modelo.toLowerCase())
    .collection("versiones")
    .doc(version.toLowerCase())
    .get()

   if (snap.exists) {
    const data = snap.data()

    if (data.precio_usd) {
     precios.push(data.precio_usd)
    }
   }
  }

  // ================= FALLBACK =================
  if (precios.length === 0) {
   return res.status(400).json({
    error: "No hay precios",
    versiones // 🔥 array
   })
  }

  // ================= PROMEDIO =================
  const promedio =
   precios.reduce((a, b) => a + b, 0) / precios.length

  // ================= AJUSTE KM =================
  let ajusteKm = 0

  if (km > 100000) ajusteKm = 0.15
  else if (km > 70000) ajusteKm = 0.10
  else if (km > 40000) ajusteKm = 0.05

  const precioFinal =
   Math.round(promedio - (promedio * ajusteKm))

  // ================= RESPUESTA CORRECTA =================
  res.json({
   versiones, // 🔥 ARRAY (clave para frontend)
   precios,   // 🔥 ARRAY
   precioBase: Math.round(promedio),
   precioFinal
  })

 } catch (err) {

  console.error(err)

  res.status(500).json({
   error: err.message
  })

 }
}
