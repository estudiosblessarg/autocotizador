const router = require("express").Router()
const {
 getKM,
 updateKM,
 deleteKM
} = require("../controllers/config.controller")

router.get("/", getKM)
router.put("/", updateKM)
router.delete("/", deleteKM)

module.exports = router
