const express = require("express")
const router = express.Router()

const authController = require("../controllers/auth.controller")
const cotizadorController = require("../controllers/cotizar.controller")
const userController = require("../controllers/user.controller")
const configController = require("../controllers/config.controller")
const dolarController = require("../controllers/dolar.controller")

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
// RUTA DE DOLAR
// ======================

router.get("/cotizador/dolar", dolarController.getDolar)

// ======================
// COTIZADOR
// ======================

router.post("/cotizador/cotizar",cotizadorController.cotizar)


// ======================
// CONFIG
// ======================

router.get("/cotizador/km",configController.getKM)
router.put("/config/km",configController.updateKM)

router.put("/admin/km",configController.deleteKM)


// ======================
// VEHICULOS
// ======================

router.get("/cotizador/marcas",cotizadorController.getMarcas)
router.get("/cotizador/modelos/:marca",cotizadorController.getModelos)
router.get("/cotizador/versiones/:marca/:modelo",cotizadorController.getVersiones)
router.get("/cotizador/anios/:marca/:modelo/:version",cotizadorController.getAnios)

module.exports = router
