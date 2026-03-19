const { db } = require("../config/firebase")

// ================= CACHE SIMPLE =================
let cache = null
let lastFetch = 0
const CACHE_TTL = 1000 * 60 * 5

// ================= TRAER MARCAS =================
async function getConfig() {
 try {

  if (cache && (Date.now() - lastFetch < CACHE_TTL)) {
   return cache
  }

  const snapshot = await db.collection("marcas").get()

  if (snapshot.empty) {
   console.log("❌ colección marcas vacía")
   return null
  }

  let data = {}

  snapshot.forEach(doc => {
   data[doc.id] = true
  })

  cache = data
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
   return res.json([])
  }

  res.json(Object.keys(config).sort())

 } catch (err) {
  res.status(500).json({ error: err.message })
 }
}

// ================= MODELOS =================
exports.getModelos = async (req, res) => {
 try {

  const { marca } = req.params

  const snap = await db
   .collection("marcas")
   .doc(marcas)
   .collection("modelos")
   .get() // ✅ CORRECTO

  if (snap.empty) {
   return res.json([])
  }

  const modelos = snap.docs.map(d => d.id)

  res.json(modelos.sort())

 } catch (err) {
  console.error("ERROR MODELOS:", err)
  res.status(500).json({ error: err.message })
 }
}

// ================= VERSIONES =================
exports.getVersiones = async (req, res) => {
 try {

  const { marca, modelo } = req.params

  const snap = await db
   .collection("marcas")
   .doc(marcas)
   .collection("modelos")
   .doc(modelos)
   .collection("versiones")
   .get()

  if (snap.empty) {
   return res.json([])
  }

  const versiones = snap.docs.map(d => d.id)

  res.json(versiones.sort())

 } catch (err) {
  console.error("ERROR VERSIONES:", err)
  res.status(500).json({ error: err.message })
 }
}

// ================= AÑOS =================
exports.getAnios = async (req, res) => {
 try {

  const { marca, modelo, version } = req.params

  const doc = await db
   .collection("marcas")
   .doc(marca)
   .collection("modelos")
   .doc(modelo)
   .collection("versiones")
   .doc(version)
   .get()

  if (!doc.exists) {
   return res.json([])
  }

  const aniosObj = doc.data().anios || {}

  const lista = Object.keys(aniosObj)
   .map(a => Number(a))
   .sort((a, b) => b - a)

  res.json(lista)

 } catch (err) {
  console.error("ERROR ANIOS:", err)
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

  const doc = await db
   .collection("marcas")
   .doc(marca)
   .collection("modelos")
   .doc(modelo)
   .collection("versiones")
   .doc(version)
   .get()

  if (!doc.exists) {
   return res.status(404).json({
    error: "Versión no encontrada"
   })
  }

  const anios = doc.data().anios || {}

  const precioBase = anios[anio]

  if (!precioBase) {
   return res.status(404).json({
    error: "No se encontró precio"
   })
  }

  // ================= AJUSTE POR KM =================
  let ajusteKm = 0

  if (km > 100000) ajusteKm = 0.15
  else if (km > 70000) ajusteKm = 0.10
  else if (km > 40000) ajusteKm = 0.05

  const precioFinal = Math.round(precioBase - (precioBase * ajusteKm))

  res.json({
   precioBase,
   precioFinal,
   descuentoKM: ajusteKm * 100
  })

 } catch (err) {
  console.error("ERROR COTIZAR:", err)
  res.status(500).json({ error: err.message })
 }
}
