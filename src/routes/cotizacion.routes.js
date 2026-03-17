const router = require("express").Router()
const {
 getCotizaciones,
 updateCotizacion,
 deleteCotizacion
} = require("../controllers/cotizacion.controller")

router.get("/", getCotizaciones)
router.put("/:id", updateCotizacion)
router.delete("/:id", deleteCotizacion)

module.exports = router