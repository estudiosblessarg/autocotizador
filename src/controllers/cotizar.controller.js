const { db } = require("../config/firebase")

// ================= NORMALIZAR =================
function normalizar(str) {
 return str
  .toLowerCase()
  .trim()
}

// ================= TRAER CONFIG =================
async function getConfig() {
 const doc = await db.collection("config").doc("autos").get()

 if (!doc.exists) return null

 return doc.data().data || {}
}

// ================= MARCAS =================
exports.getMarcas = async (req, res) => {
 try {
  const config = await getConfig()

  if (!config) {
   return res.status(400).json({ error: "No config/autos" })
  }

  const marcas = Object.keys(config)

  res.json(marcas) // ✅ ARRAY
 } catch (err) {
  res.status(500).json({ error: err.message })
 }
}

// ================= MODELOS =================
exports.getModelos = async (req, res) => {
 try {
  const { marca } = req.params

  const config = await getConfig()

  if (!config[marca]) {
   return res.status(400).json({ error: "Marca no encontrada" })
  }

  const modelos = Object.keys(config[marca])

  res.json(modelos) // ✅ ARRAY
 } catch (err) {
  res.status(500).json({ error: err.message })
 }
}

// ================= VERSIONES =================
exports.getVersiones = async (req, res) => {
 try {
  const { marca, modelo } = req.params

  const config = await getConfig()

  if (!config[marca]?.[modelo]) {
   return res.status(400).json({ error: "Modelo no encontrado" })
  }

  const versiones = config[marca][modelo]

  res.json(versiones) // ✅ ARRAY
 } catch (err) {
  res.status(500).json({ error: err.message })
 }
}

// ================= AÑOS (SIMULADO) =================
exports.getAnios = async (req, res) => {
 try {
  // 🔥 opcional si no tenés años en DB
  res.json([2024, 2023, 2022, 2021, 2020])
 } catch (err) {
  res.status(500).json({ error: err.message })
 }
}

// ================= COTIZAR =================
exports.cotizar = async (req, res) => {
 try {

  const { marca, modelo, km } = req.body

  const config = await getConfig()

  if (!config || !config[marca]) {
   return res.status(400).json({
    error: "Marca no encontrada",
    marcas: Object.keys(config || {})
   })
  }

  if (!config[marca][modelo]) {
   return res.status(400).json({
    error: "Modelo no encontrado",
    modelos: Object.keys(config[marca])
   })
  }

  const versiones = config[marca][modelo]

  let precios = []

  for (const version of versiones) {

   const doc = await db
    .collection("marcas")
    .doc(normalizar(marca))
    .collection("modelos")
    .doc(normalizar(modelo))
    .collection("versiones")
    .doc(normalizar(version))
    .get()

   if (doc.exists) {
    const data = doc.data()
    if (data.precio_usd) precios.push(data.precio_usd)
   }
  }

  if (precios.length === 0) {
   return res.status(400).json({
    error: "No hay precios",
    versiones
   })
  }

  const promedio =
   precios.reduce((a, b) => a + b, 0) / precios.length

  let ajusteKm = 0

  if (km > 100000) ajusteKm = 0.15
  else if (km > 70000) ajusteKm = 0.10
  else if (km > 40000) ajusteKm = 0.05

  const precioFinal =
   Math.round(promedio - (promedio * ajusteKm))

  res.json({
   versiones,
   precios,
   precioBase: Math.round(promedio),
   precioFinal,
   descuentoKM: ajusteKm * 100
  })

 } catch (err) {
  res.status(500).json({ error: err.message })
 }
}
