import { useState } from "react";
import axios from "axios";

function AddStudent() {
  const [student_id, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [year_level, setYearLevel] = useState("");

  const handleAdd = async () => {
    const res = await axios.post("http://localhost:5000/add-student", {
      student_id,
      name,
      course,
      year_level,
    });

    alert(res.data.message);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Add Scholar</h2>

      <input placeholder="Student ID" onChange={(e) => setStudentId(e.target.value)} />
      <br /><br />

      <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
      <br /><br />

      <input placeholder="Course" onChange={(e) => setCourse(e.target.value)} />
      <br /><br />

      <input placeholder="Year Level" onChange={(e) => setYearLevel(e.target.value)} />
      <br /><br />

      <button onClick={handleAdd}>Add Student</button>
    </div>
  );
}

export default AddStudent;