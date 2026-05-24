const { Router } = require("express");
const { verifyToken } = require("../middleware/auth.js");
const {
  addStudent,
  addGrantee,
  listStudents,
  updateStudent,
  deleteStudent,
} = require("../controllers/students.controller.js");

const router = Router();

router.post("/", verifyToken, addGrantee);

router.get("/", verifyToken, listStudents);
router.put("/:id", verifyToken, updateStudent);
router.delete("/:id", verifyToken, deleteStudent);

module.exports = router;

