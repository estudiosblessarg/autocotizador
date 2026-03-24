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



exports.updateKM = async(req,res)=>{
 try{ await db.collection("config").doc("km").set(req.body)
  res.json({success:true})
    }catch(error){
  res.status(500).json({ error:error.message }) 
 } 
}

exports.deleteKM = async (req, res) => {
  try {

    const km = Number(req.params.km)

    if (!km) {
      return res.status(400).json({
        error: "KM inválido"
      })
    }

    const ref = db.collection("config").doc("km")
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({
        error: "Config KM no existe"
      })
    }

    const data = doc.data()

    let tabla = Array.isArray(data.tabla) ? data.tabla : []

    // 🔥 filtrar
    const nuevaTabla = tabla.filter(r => Number(r.km) !== km)

    // 🔥 guardar
    await ref.set({ tabla: nuevaTabla })

    res.json({
      success: true,
      tabla: nuevaTabla
    })

  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}
