const router = require("express").Router()

const {
 getMarcas,
 getModelos,
 getVersiones,
 getAnios,
 cotizar
} = require("../controllers/cotizar.controller")

router.get("/marcas", getMarcas)
router.get("/modelos/:marca", getModelos)
router.get("/versiones/:marca/:modelo", getVersiones)
router.get("/anios/:marca/:modelo/:version", getAnios)

router.post("/cotizar", cotizar)

module.exports = router