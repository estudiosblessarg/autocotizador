const { db } = require("../config/firebase")

/*
MARCAS
*/

exports.marcas = async (req, res) => {

 try {

  const snap = await db
   .collection("precios")
   .select("marca")
   .get()

  if (snap.empty) {
   return res.json({
    success: true,
    data: []
   })
  }

  const marcas = new Set()

  snap.forEach(doc => {
   const data = doc.data()
   if (data.marca) marcas.add(data.marca)
  })

  res.json({
   success: true,
   data: [...marcas].sort()
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
    success:false,
    error:"marca requerida"
   })
  }

  const snap = await db
   .collection("precios")
   .where("marca","==",marca)
   .select("modelo")
   .get()

  const modelos = new Set()

  snap.forEach(doc=>{
   const data = doc.data()
   if(data.modelo) modelos.add(data.modelo)
  })

  res.json({
   success:true,
   data:[...modelos].sort()
  })

 } catch (error) {

  console.error("ERROR MODELOS:", error)

  res.status(500).json({
   success:false,
   error:error.message
  })

 }

}


/*
VERSIONES
*/

exports.versiones = async (req,res)=>{

 try{

  const {marca,modelo}=req.params

  if(!marca || !modelo){
   return res.status(400).json({
    success:false,
    error:"marca y modelo requeridos"
   })
  }

  const snap =
   await db.collection("precios")
    .where("marca","==",marca)
    .where("modelo","==",modelo)
    .select("version")
    .get()

  const versiones = new Set()

  snap.forEach(doc=>{
   const data = doc.data()
   if(data.version) versiones.add(data.version)
  })

  res.json({
   success:true,
   data:[...versiones].sort()
  })

 }catch(error){

  console.error("ERROR VERSIONES:",error)

  res.status(500).json({
   success:false,
   error:error.message
  })

 }

}


/*
AÑOS
*/

exports.anios = async (req,res)=>{

 try{

  const {marca,modelo,version}=req.params

  if(!marca || !modelo || !version){
   return res.status(400).json({
    success:false,
    error:"marca modelo y version requeridos"
   })
  }

  const snap =
   await db.collection("precios")
    .where("marca","==",marca)
    .where("modelo","==",modelo)
    .where("version","==",version)
    .select("anio")
    .get()

  const anios = new Set()

  snap.forEach(doc=>{
   const data = doc.data()
   if(data.anio) anios.add(data.anio)
  })

  res.json({
   success:true,
   data:[...anios].sort((a,b)=>b-a)
  })

 }catch(error){

  console.error("ERROR AÑOS:",error)

  res.status(500).json({
   success:false,
   error:error.message
  })

 }

}
