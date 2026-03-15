const express = require("express")
const router = express.Router()

const authController = require("../controllers/auth.controller")
const cotizadorController = require("../controllers/cotizar.controller")
const cotizacionController = require("../controllers/cotizacion.controller")
const userController = require("../controllers/user.controller")
const vehiculoController = require("../controllers/vehiculo.controller")
const configController = require("../controllers/config.controller")

// ======================
// =================
// AUTH
// ======================
// =================

router.post("/login",authController.login)
router.post("/register",authController.register)
router.get("/users",userController.getUsers)
router.put("/users/:id",userController.updateRole)


// ======================
// COTIZADOR
// ======================

router.post("/cotizador/cotizar",cotizadorController.cotizar)


// ======================
// COTIZACIONES ADMIN
// ======================

router.get("/cotizaciones",cotizacionController.getAll)
router.put("/cotizaciones/:id",cotizacionController.update)
router.delete("/cotizaciones/:id",cotizacionController.delete)


// ======================
// CONFIG
// ======================

router.get("/km",configController.getKM)
router.put("/km",configController.updateKM)


// ======================
// VEHICULOS
// ======================

router.get("/cotizador/marcas",vehiculoController.marcas)
router.get("/cotizador/modelos/:marca",vehiculoController.modelos)
router.get("/cotizador/versiones/:marca/:modelo",vehiculoController.versiones)
router.get("/cotizador/anios/:marca/:modelo/:version",vehiculoController.anios)

module.exports = router
