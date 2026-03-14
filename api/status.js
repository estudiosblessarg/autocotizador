export default function handler(req, res) {
  console.log("STATUS FUNCTION HIT")

  res.status(200).json({
    ok: true,
    message: "API funcionando correctamente"
  })
}
