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

router.post("/add-student", verifyToken, addStudent);
router.post("/add-grantee", verifyToken, addGrantee);

router.get("/students", verifyToken, listStudents);
router.put("/students/:id", verifyToken, updateStudent);
router.delete("/students/:id", verifyToken, deleteStudent);

module.exports = router;

