const fs = require("fs")
const path = require("path")

const dataPath = path.join(__dirname,"../../public/data/vehiculos.json")

function load(){

 return JSON.parse(fs.readFileSync(dataPath))

}


exports.getMarcas = (req,res)=>{

 const data = load()

 res.json(Object.keys(data))

}


exports.getModelos = (req,res)=>{

 const data = load()

 res.json(Object.keys(data[req.params.marca] || {}))

}


exports.getVersiones = (req,res)=>{

 const data = load()

 const {marca,modelo} = req.params

 res.json(Object.keys(data[marca][modelo] || {}))

}


exports.getAnios = (req,res)=>{

 const data = load()

 const {marca,modelo,version} = req.params

 res.json(data[marca][modelo][version] || [])

}
