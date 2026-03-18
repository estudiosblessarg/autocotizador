// ================= DOLAR CONTROLLER =================
const fetch = (...args) =>
 import("node-fetch").then(({ default: fetch }) => fetch(...args))

exports.getDolar = async (req, res) => {
 try {

  // 🔥 API confiable en Argentina
  const response = await fetch("https://api.bluelytics.com.ar/v2/latest")

  const data = await response.json()

  // podés usar "blue" o "oficial"
  const dolar = data.blue?.value_sell || data.oficial?.value_sell

  if (!dolar) {
   return res.status(500).json({
    error: "No se pudo obtener el dólar"
   })
  }

  res.json({
   usd: Math.round(dolar)
  })

 } catch (err) {
  console.error("❌ Error dólar:", err)

  res.status(500).json({
   error: "Error obteniendo dólar"
  })
 }
}