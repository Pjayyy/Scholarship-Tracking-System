import { useEffect, useMemo, useState } from "react";
import API from "./api";
import { toast } from "react-toastify";

// NOTE: Axios base URL + JWT interceptor handled in ./api.js
function StudentList() {


  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formMessage, setFormMessage] = useState("");




  const [search, setSearch] = useState("");
  // Unused legacy filters (kept for now to avoid larger refactor)
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [status, setStatus] = useState("");


  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    student_id: "",
    name: "",
    course: "",
    year_level: "",
  });

  // Provide derived/placeholder values so the admin 

  // =========================
  // FETCH STUDENTS
  // =========================
  const fetchStudents = async () => {

    setLoading(true);
    setError(null);

    try {

      const res = await API.get("/students");

      setStudents(res.data);

    } catch (e) {

      console.error(e);

      setError(
        e?.response?.data?.message ||
        e.message ||
        "Failed to load students"
      );

    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // =========================
  // EDIT
  // =========================
  const startEdit = (s) => {

    setEditingId(s.id);

    setForm({
      student_id: s.student_id || "",
      name: s.name || "",
      course: s.course || "",
      year_level: s.year_level || "",
    });
  };

  const cancelEdit = () => {

    setEditingId(null);

    setForm({
      student_id: "",
      name: "",
      course: "",
      year_level: "",
    });
  };

  // =========================
  // UPDATE
  // =========================
  const handleUpdate = async () => {

    if (!editingId) return;
    if (isSaving) return;

    setFormMessage("");

    if (
      !form.student_id ||
      !form.name ||
      !form.course ||
      !form.year_level
    ) {
      const msg = "Please fill in all fields.";
      setFormMessage(msg);
      toast.error(msg);
      return;
    }

    try {
      setIsSaving(true);

      await API.put(
        `/students/${editingId}`,
        {
          student_id: form.student_id,
          name: form.name,
          course: form.course,
          year_level: form.year_level,
        }
      );

      toast.success("Student updated");

      cancelEdit();
      fetchStudents();

    } catch (e) {

      console.error(e);

      const msg =
        e?.response?.data?.message ||
        e.message ||
        "Update failed";

      setFormMessage(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };


  // =========================
  // DELETE
  // =========================
  const handleDelete = async (id) => {

    if (isDeleting) return;

    const ok = window.confirm(
      "Delete this student?"
    );

    if (!ok) return;

    try {
      setIsDeleting(true);

      // ✅ FIXED JWT REQUEST
      await API.delete(`/students/${id}`);

      toast.success("Student deleted");

      fetchStudents();

    } catch (e) {

      console.error(e);

      const msg =
        e?.response?.data?.message ||
        e.message ||
        "Delete failed";

      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };


  // =========================
  // FILTER
  // =========================
  const filteredStudents = useMemo(() => {

    const q = search.toLowerCase();

    return students.filter((s) => {

      const name =
        (s.name || "").toLowerCase();

      const sid =
        String(s.student_id || "").toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        sid.includes(q);

      return matchesSearch;
    });

  }, [students, search]);

  // =========================
  // STYLES
  // =========================
  const thStyle = {
    background: "#f6f7fb",
    padding: "10px",
    textAlign: "left",
    borderBottom: "1px solid #ddd",
  };

  const tdStyle = {
    padding: "10px",
    borderBottom: "1px solid #eee",
  };

  const inputStyle = {
    width: "100%",
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  };

  const buttonStyle = {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: 20 }}>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >

        <h2>🎓 Scholar List</h2>

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            ...inputStyle,
            width: 250,
          }}
        />

      </div>

      {loading && <p>Loading...</p>}

      {formMessage && (
        <p style={{ color: "#dc2626", fontWeight: 800 }}>
          {formMessage}
        </p>
      )}

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}


      <div
        style={{
          overflowX: "auto",
          background: "#fff",
          borderRadius: 12,
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.05)",
          opacity: isSaving || isDeleting ? 0.9 : 1,
          pointerEvents: isSaving || isDeleting ? "none" : "auto",
        }}
      >


        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >

          <thead>

            <tr>

              <th style={thStyle}>
                Award Number
              </th>

              <th style={thStyle}>
                Student Name
              </th>

              <th style={thStyle}>
                Degree Program
              </th>

              <th style={thStyle}>
                Year Level
              </th>

              <th style={thStyle}>
                Attendance %
              </th>

              <th style={thStyle}>
                Beneficiary Status
              </th>

              <th style={thStyle}>
                Last QR Scan
              </th>

              <th style={thStyle}>
                QR Status
              </th>

              <th style={thStyle}>
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredStudents.map((s) => (

              <tr key={s.id}>

                <td style={tdStyle}>
                  {editingId === s.id ? (
                    <input
                      style={inputStyle}
                      value={form.student_id}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          student_id:
                            e.target.value,
                        })
                      }
                    />
                  ) : (
                    s.student_id
                  )}
                </td>

                <td style={tdStyle}>
                  {editingId === s.id ? (
                    <input
                      style={inputStyle}
                      value={form.name}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          name: e.target.value,
                        })
                      }
                    />
                  ) : (
                    s.name
                  )}
                </td>

                <td style={tdStyle}>
                  {editingId === s.id ? (
                    <input
                      style={inputStyle}
                      value={form.course}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          course: e.target.value,
                        })
                      }
                    />
                  ) : (
                    s.course
                  )}
                </td>

                <td style={tdStyle}>
                  {editingId === s.id ? (
                    <input
                      style={inputStyle}
                      value={form.year_level}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          year_level:
                            e.target.value,
                        })
                      }
                    />
                  ) : (
                    s.year_level
                  )}
                </td>

                {/* Derived columns (not editable in this simple admin table) */}
                <td style={tdStyle}>
                  {(() => {
                    // Backend /students does not include attendance_rate or attendance_logs stats.
                    // Show what we can reliably compute from what backend returns.
                    return "—";
                  })()}
                </td>

                <td style={tdStyle}>
                  {String(s.scholarship_type ?? "")
                    ? String(s.scholarship_type ?? "").toUpperCase()
                    : "—"}
                </td>

                <td style={tdStyle}>
                  {s.qr_code ? "Available" : "—"}
                </td>

                <td style={tdStyle}>
                  {s.qr_code ? "Generated" : "Not Generated"}
                </td>

                <td style={tdStyle}>

                  {editingId === s.id ? (


                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                      }}
                    >

                      <button
                        style={{
                          ...buttonStyle,
                          background: "#2563eb",
                          color: "#fff",
                          opacity: isSaving ? 0.7 : 1,
                          cursor: isSaving ? "not-allowed" : "pointer",
                        }}
                        onClick={handleUpdate}
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>


                      <button
                        style={{
                          ...buttonStyle,
                          background: "#ddd",
                          opacity: isSaving ? 0.7 : 1,
                          cursor: isSaving ? "not-allowed" : "pointer",
                        }}
                        onClick={cancelEdit}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>


                    </div>

                  ) : (

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                      }}
                    >

                      <button
                        style={{
                          ...buttonStyle,
                          background: "#facc15",
                        }}
                        onClick={() =>
                          startEdit(s)
                        }
                      >
                        Edit
                      </button>

                      <button
                        style={{
                          ...buttonStyle,
                          background: "#ef4444",
                          color: "#fff",
                          opacity: isDeleting ? 0.7 : 1,
                          cursor: isDeleting ? "not-allowed" : "pointer",
                        }}
                        onClick={() =>
                          handleDelete(s.id)
                        }
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>


                    </div>

                  )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default StudentList;