const { db } = require("../config/firebase")

/**
 * Trae toda la config (UNA sola lectura 🔥)
 */
async function getConfig() {
 try {
  const doc = await db
   .collection("marcas")
   //.doc("autos")
   .get()

  if (!doc.exists) return null

  return doc.data().data || null

 } catch (error) {
  console.error("ERROR GET CONFIG:", error)
  return null
 }
}

/*
MARCAS
*/
exports.marcas = async (req, res) => {
 try {

  const config = await getConfig()

  if (!config) {
   return res.json({ success: true, data: [] })
  }

  const marcas = Object.keys(config)

  res.json({
   success: true,
   data: marcas.sort()
  })

 } catch (error) {
  console.error("ERROR MARCAS:", error)

  res.status(500).json({
   success: false,
   error: error.message
  })
 }
}


/*
MODELOS
*/
exports.modelos = async (req, res) => {
 try {

  const { marca } = req.params

  if (!marca) {
   return res.status(400).json({
    success: false,
    error: "marca requerida"
   })
  }

  const config = await getConfig()

  if (!config || !config[marca]) {
   return res.json({ success: true, data: [] })
  }

  const modelos = Object.keys(config[marca].modelos || {})

  res.json({
   success: true,
   data: modelos.sort()
  })

 } catch (error) {
  console.error("ERROR MODELOS:", error)

  res.status(500).json({
   success: false,
   error: error.message
  })
 }
}


/*
VERSIONES
*/
exports.versiones = async (req, res) => {
 try {

  const { marca, modelo } = req.params

  if (!marca || !modelo) {
   return res.status(400).json({
    success: false,
    error: "marca y modelo requeridos"
   })
  }

  const config = await getConfig()

  if (
   !config ||
   !config[marca] ||
   !config[marca].modelos ||
   !config[marca].modelos[modelo]
  ) {
   return res.json({ success: true, data: [] })
  }

  const versiones = Object.keys(
   config[marca].modelos[modelo].versiones || {}
  )

  res.json({
   success: true,
   data: versiones.sort()
  })

 } catch (error) {
  console.error("ERROR VERSIONES:", error)

  res.status(500).json({
   success: false,
   error: error.message
  })
 }
}


/*
AÑOS
*/
exports.anios = async (req, res) => {
 try {

  const { marca, modelo, version } = req.params

  if (!marca || !modelo || !version) {
   return res.status(400).json({
    success: false,
    error: "marca modelo y version requeridos"
   })
  }

  const config = await getConfig()

  const versiones =
   config?.[marca]?.modelos?.[modelo]?.versiones

  if (!versiones || !versiones[version]) {
   return res.json({ success: true, data: [] })
  }

  const aniosObj = versiones[version].anios || {}

  const anios = Object.keys(aniosObj)
   .map(a => Number(a))
   .sort((a, b) => b - a)

  res.json({
   success: true,
   data: anios
  })

 } catch (error) {
  console.error("ERROR AÑOS:", error)

  res.status(500).json({
   success: false,
   error: error.message
  })
 }
}
