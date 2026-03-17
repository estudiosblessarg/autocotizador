const { db } = require("../config/firebase")

exports.cotizar = async (req, res) => {

 try {

  const { marca, modelo, anio, km } = req.body

  let query = db.collectionGroup("versiones")

  // ================= FILTROS OPCIONALES =================
  if (marca) {
   query = query.where("marca", "==", marca)
  }

  if (modelo) {
   query = query.where("modelo", "==", modelo)
  }

  // ⚠️ anio no existe en tu data actual → lo dejo opcional
  if (anio) {
   query = query.where("anio", "==", Number(anio))
  }

  let snap = await query.get()

  // ================= FALLBACK: TRAER TODO =================
  if (snap.empty) {

   console.log("⚠️ Sin resultados filtrados → trayendo todo")

   snap = await db.collectionGroup("versiones").get()
  }

  if (snap.empty) {
   return res.status(400).json({
    error: "No hay datos en la base"
   })
  }

  const precios = []

  snap.forEach(doc => {
   const data = doc.data()

   // 🔥 validación fuerte
   if (data.precio_usd || data.precio) {
    precios.push(
     data.precio_usd || data.precio
    )
   }
  })

  if (precios.length === 0) {
   return res.status(400).json({
    error: "No hay precios válidos"
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

  res.json({
   usados: precios.length,
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
