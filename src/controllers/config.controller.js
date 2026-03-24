const {db} = require("../config/firebase")

exports.getKM = async(req,res)=>{

 try{

  const doc = await db.collection("config").doc("km").get()

  res.json(doc.data())

 }catch(error){

  res.status(500).json({
   error:error.message
  })

 }

}



async function updateKM(){

  const km = document.getElementById("kmValor").value
  const descuento = document.getElementById("kmDesc").value

  if (!km || !descuento || isNaN(km) || isNaN(descuento)) {
    alert("Datos inválidos")
    return
  }

  const config = await api("/auth/cotizador/km") || {}

  // 🔥 asegurar array
  let tabla = Array.isArray(config.tabla) ? config.tabla : []

  // 🔥 evitar duplicados (por km)
  const existe = tabla.find(e => Number(e.km) === Number(km))

  if (existe) {
    if (!confirm("Ese KM ya existe. ¿Querés reemplazarlo?")) return

    existe.descuento = Number(descuento)
  } else {
    tabla.push({
      km: Number(km),
      descuento: Number(descuento)
    })
  }

  // 🔥 ordenar por km
  tabla.sort((a, b) => a.km - b.km)

  // 🔥 guardar
  await api("/auth/config/km", "PUT", { tabla })

  cargarConfigKM()
}
