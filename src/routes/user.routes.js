const router = require("express").Router()
const { getUsers, updateRole } = require("../controllers/user.controller")

router.get("/", getUsers)
router.put("/:id", updateRole)

module.exports = router