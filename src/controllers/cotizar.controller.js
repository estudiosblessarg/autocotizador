const { db } = require("../config/firebase")

// ================= NORMALIZAR =================
function normalizar(str) {
 return String(str || "")
  .toLowerCase()
  .trim()
}

// ================= CACHE SIMPLE (🔥 evita leer siempre Firebase) =================
let cache = null
let lastFetch = 0
const CACHE_TTL = 1000 * 60 * 5 // 5 minutos

// ================= TRAER CONFIG =================
async function getConfig() {
 try {

  // 🔥 usar cache
  if (cache && (Date.now() - lastFetch < CACHE_TTL)) {
   return cache
  }

  const doc = await db
   .collection("marcas")
   
   .get()

  if (!doc.exists) {
   console.log("❌ No existe config/autos")
   return null
  }

  const data = doc.data()

  if (!data.data) {
   console.log("❌ El documento no tiene 'data'")
   return null
  }

  cache = data.data
  lastFetch = Date.now()

  return cache

 } catch (error) {
  console.error("ERROR GET CONFIG:", error)
  return null
 }
}

// ================= MARCAS =================
exports.getMarcas = async (req, res) => {
 try {

  const config = await getConfig()

  if (!config) {
   return res.status(500).json({ error: "Config vacía" })
  }

  const marcas = Object.keys(config)

  res.json(marcas.sort())

 } catch (err) {
  res.status(500).json({ error: err.message })
 }
}

// ================= MODELOS =================
exports.getModelos = async (req, res) => {
 try {

  const { marca } = req.params

  const config = await getConfig()

  if (!config?.[marca]) {
   return res.status(404).json({ error: "Marca no encontrada" })
  }

  const modelos = Object.keys(config[marca].modelos || {})

  res.json(modelos.sort())

 } catch (err) {
  res.status(500).json({ error: err.message })
 }
}

// ================= VERSIONES =================
exports.getVersiones = async (req, res) => {
 try {

  const { marca, modelo } = req.params

  const versiones =
   (await getConfig())
   ?.[marca]
   ?.modelos
   ?.[modelo]
   ?.versiones

  if (!versiones) {
   return res.status(404).json({ error: "Modelo no encontrado" })
  }

  res.json(Object.keys(versiones).sort())

 } catch (err) {
  res.status(500).json({ error: err.message })
 }
}

// ================= AÑOS =================
exports.getAnios = async (req, res) => {
 try {

  const { marca, modelo, version } = req.params

  const anios =
   (await getConfig())
   ?.[marca]
   ?.modelos
   ?.[modelo]
   ?.versiones
   ?.[version]
   ?.anios

  if (!anios) {
   return res.status(404).json({ error: "Versión no encontrada" })
  }

  const lista = Object.keys(anios)
   .map(a => Number(a))
   .sort((a, b) => b - a)

  res.json(lista)

 } catch (err) {
  res.status(500).json({ error: err.message })
 }
}

// ================= COTIZAR =================
exports.cotizar = async (req, res) => {
 try {

  const { marca, modelo, version, anio, km } = req.body

  if (!marca || !modelo || !version || !anio) {
   return res.status(400).json({
    error: "marca, modelo, version y anio requeridos"
   })
  }

  const config = await getConfig()

  const precioBase =
   config?.[marca]
   ?.modelos
   ?.[modelo]
   ?.versiones
   ?.[version]
   ?.anios
   ?.[anio]

  if (!precioBase) {
   return res.status(404).json({
    error: "No se encontró precio",
   })
  }

  // ================= AJUSTE POR KM =================
  let ajusteKm = 0

  if (km > 100000) ajusteKm = 0.15
  else if (km > 70000) ajusteKm = 0.10
  else if (km > 40000) ajusteKm = 0.05

  const precioFinal =
   Math.round(precioBase - (precioBase * ajusteKm))

  res.json({
   precioBase,
   precioFinal,
   descuentoKM: ajusteKm * 100
  })

 } catch (err) {
  res.status(500).json({ error: err.message })
 }
}
