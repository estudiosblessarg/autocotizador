const router = require("express").Router()
const {
 getKM,
 updateKM
} = require("../controllers/config.controller")

router.get("/", getKM)
router.put("/", updateKM)
router.delete("/", deleteKM)

module.exports = router
