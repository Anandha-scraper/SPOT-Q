import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpenCheck } from "lucide-react";
import {
  DatePicker,
  FilterButton,
  EditActionButton,
  DeleteActionButton,
} from "../../Components/Buttons";
import Loader from "../../Components/Loader";
import api from "../../utils/api.js";
import "@/styles/PageStyles/Process/ProcessReport.css";
import "@/styles/PageStyles/Impact/ImpactReport.css";

const ProcessReport = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit modal state
  const [editModal, setEditModal] = useState({ open: false, row: null });
  const [editForm, setEditForm] = useState({});
  const [saveConfirm, setSaveConfirm] = useState({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    row: null,
  });

  const navigate = useNavigate();

  const requestEdit = (row) => {
    if (!row) return;
    const mapped = {
      date: row.date ? new Date(row.date).toISOString().split("T")[0] : "",
      disa: row.disa || row.DISA || "",
      partName: row.partName || "",
      datecode: row.datecode || row.dateCode || "",
      heatcode: row.heatcode || row.heatCode || "",
      quantityOfMoulds: row.quantityOfMoulds ?? "",
      metalCompositionC: row.metalCompositionC ?? "",
      metalCompositionSi: row.metalCompositionSi ?? "",
      metalCompositionMn: row.metalCompositionMn ?? "",
      metalCompositionP: row.metalCompositionP ?? "",
      metalCompositionS: row.metalCompositionS ?? "",
      metalCompositionMgFL: row.metalCompositionMgFL ?? "",
      metalCompositionCr: row.metalCompositionCr ?? "",
      metalCompositionCu: row.metalCompositionCu ?? "",
      timeOfPouring: row.timeOfPouring || "",
      pouringTemperature: row.pouringTemperature ?? "",
      ppCode: row.ppCode || "",
      treatmentNo: row.treatmentNo || "",
      fcNo: row.fcNo || "",
      heatNo: row.heatNo || "",
      conNo: row.conNo || "",
      tappingTime: row.tappingTime || "",
      correctiveAdditionC: row.correctiveAdditionC ?? "",
      correctiveAdditionSi: row.correctiveAdditionSi ?? "",
      correctiveAdditionMn: row.correctiveAdditionMn ?? "",
      correctiveAdditionS: row.correctiveAdditionS ?? "",
      correctiveAdditionCr: row.correctiveAdditionCr ?? "",
      correctiveAdditionCu: row.correctiveAdditionCu ?? "",
      correctiveAdditionSn: row.correctiveAdditionSn ?? "",
      tappingWt: row.tappingWt ?? "",
      mg: row.mg ?? "",
      resMgConvertor: row.resMgConvertor ?? "",
      recOfMg: row.recOfMg ?? "",
      streamInoculant: row.streamInoculant ?? "",
      pTime: row.pTime ?? "",
      remarks: row.remarks || "",
    };
    setEditForm(mapped);
    setEditModal({ open: true, row });
  };

  const closeEditModal = () => setEditModal({ open: false, row: null });
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };
  const openSaveConfirm = () => setSaveConfirm({ open: true });
  const closeSaveConfirm = () => setSaveConfirm({ open: false });

  const performSave = async () => {
    const row = editModal.row;
    if (!row?._id) return;
    try {
      const payload = { ...editForm };
      const res = await api.put(`/v1/process-records/${row._id}`, payload);
      if (res?.success) {
        setItems((prev) =>
          prev.map((e) => (e._id === row._id ? { ...e, ...payload } : e))
        );
        setFilteredItems((prev) =>
          prev.map((e) => (e._id === row._id ? { ...e, ...payload } : e))
        );
        setEditModal({ open: false, row: null });
      }
    } catch (e) {
      alert(e.message || "Failed to update the record");
    } finally {
      setSaveConfirm({ open: false });
    }
  };

  const requestDelete = (row) => {
    if (!row?._id) return;
    setDeleteConfirm({ open: true, row });
  };

  const closeDeleteConfirm = () => setDeleteConfirm({ open: false, row: null });

  const performDelete = async () => {
    const row = deleteConfirm.row;
    if (!row?._id) return;
    try {
      const res = await api.delete(`/v1/process-records/${row._id}`);
      if (res.success) {
        setItems((prev) => prev.filter((it) => it._id !== row._id));
        setFilteredItems((prev) => prev.filter((it) => it._id !== row._id));
        alert("Record deleted successfully");
      } else {
        throw new Error(res.message || "Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting process record:", error);
      alert("Failed to delete record: " + error.message);
    } finally {
      closeDeleteConfirm();
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/v1/process-records`);

      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : [];
        const sorted = [...list].sort((a, b) => {
          const da = new Date(a.date || a.createdAt || 0).getTime();
          const db = new Date(b.date || b.createdAt || 0).getTime();
          return db - da;
        });
        setItems(sorted);
        setFilteredItems(sorted.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching process records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    if (!startDate) {
      setFilteredItems(items);
      return;
    }

    const filtered = items.filter((item) => {
      if (!item.date) return false;
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      // If end date is provided, filter by date range
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return itemDate >= start && itemDate <= end;
      } else {
        // If only start date is provided, show only records from that exact date
        return itemDate.getTime() === start.getTime();
      }
    });

    setFilteredItems(filtered);
  };

  return (
    <>
      <div className="process-report-header">
        <div className="process-report-header-text">
          <h2>
            <BookOpenCheck
              size={28}
              style={{
                color: "#5B9AA9",
                marginRight: "15px",
                marginTop: "5px",
              }}
            />
            Process Control - Report
          </h2>
        </div>
      </div>

      <div className="impact-filter-container">
        <div className="impact-filter-group">
          <label>Start Date</label>
          <DatePicker
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Select start date"
          />
        </div>
        <div className="impact-filter-group">
          <label>End Date</label>
          <DatePicker
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Select end date"
          />
        </div>
        <FilterButton onClick={handleFilter} disabled={!startDate}>
          Filter
        </FilterButton>
      </div>

      {loading ? (
        <div className="impact-loader-container">
          <Loader />
        </div>
      ) : (
        <div className="impact-details-card">
          <div className="impact-table-container">
            <table className="impact-table process-report-table">
              <colgroup>
                <col />
                <col />
                <col />
                <col style={{ minWidth: "120px", width: "120px" }} />
                <col style={{ minWidth: "120px", width: "120px" }} />
              </colgroup>
              <thead>
                <tr>
                  <th
                    rowSpan="2"
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    Date
                  </th>
                  <th
                    rowSpan="2"
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    DISA
                  </th>
                  <th
                    rowSpan="2"
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    Part Name
                  </th>
                  <th
                    rowSpan="2"
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    Date Code
                  </th>
                  <th
                    rowSpan="2"
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    Heat Code
                  </th>
                  <th rowSpan="2" style={{ minWidth: "140px", width: "140px" }}>
                    Qty. Of Moulds
                  </th>
                  <th colSpan="8" style={{ minWidth: "480px" }}>
                    Metal Composition (%)
                  </th>
                  <th colSpan="8">Pouring Details</th>
                  <th colSpan="7">Corrective Additions (Kgs)</th>
                  <th colSpan="6">Tapping Details</th>
                  <th rowSpan="2">Remarks</th>
                  <th rowSpan="2">Actions</th>
                </tr>
                <tr>
                  <th
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    C
                  </th>
                  <th
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    Si
                  </th>
                  <th
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    Mn
                  </th>
                  <th
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    P
                  </th>
                  <th
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    S
                  </th>
                  <th
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    Mg F/L
                  </th>
                  <th
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    Cu
                  </th>
                  <th
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    Cr
                  </th>
                  <th>Time of Pouring</th>
                  <th>Pouring Temp (°C)</th>
                  <th>PP Code</th>
                  <th>Treatment No</th>
                  <th>F/C No</th>
                  <th>Heat No</th>
                  <th>Con No</th>
                  <th>Tapping Time</th>
                  <th
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    C
                  </th>
                  <th
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    Si
                  </th>
                  <th
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    Mn
                  </th>
                  <th
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    S
                  </th>
                  <th
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    Cr
                  </th>
                  <th
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    Cu
                  </th>
                  <th
                    style={{
                      width: "60px",
                      minWidth: "60px",
                      height: "43.68px",
                      textAlign: "center",
                    }}
                  >
                    Sn
                  </th>
                  <th>Tapping Wt (Kgs)</th>
                  <th>Mg (Kgs)</th>
                  <th>Res. Mg Convertor (%)</th>
                  <th>Rec. Of Mg (%)</th>
                  <th>Stream Inoculant (gm/Sec)</th>
                  <th>P.Time (sec)</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="40" className="impact-no-records">
                      No records found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, index) => (
                    <tr key={item._id || index}>
                      <td>
                        {item.date
                          ? new Date(item.date).toLocaleDateString("en-GB")
                          : "-"}
                      </td>
                      <td>{item.disa || item.DISA || "-"}</td>
                      <td>{item.partName || "-"}</td>
                      <td>{item.datecode || item.dateCode || "-"}</td>
                      <td>{item.heatcode || item.heatCode || "-"}</td>
                      <td style={{ minWidth: "140px", width: "140px" }}>
                        {item.quantityOfMoulds ?? "-"}
                      </td>

                      <td
                        style={{
                          width: "60px",
                          minWidth: "60px",
                          textAlign: "center",
                        }}
                      >
                        {item.metalCompositionC ?? "-"}
                      </td>
                      <td
                        style={{
                          width: "60px",
                          minWidth: "60px",
                          textAlign: "center",
                        }}
                      >
                        {item.metalCompositionSi ?? "-"}
                      </td>
                      <td
                        style={{
                          width: "60px",
                          minWidth: "60px",
                          textAlign: "center",
                        }}
                      >
                        {item.metalCompositionMn ?? "-"}
                      </td>
                      <td
                        style={{
                          width: "60px",
                          minWidth: "60px",
                          textAlign: "center",
                        }}
                      >
                        {item.metalCompositionP ?? "-"}
                      </td>
                      <td
                        style={{
                          width: "60px",
                          minWidth: "60px",
                          textAlign: "center",
                        }}
                      >
                        {item.metalCompositionS ?? "-"}
                      </td>
                      <td
                        style={{
                          width: "60px",
                          minWidth: "60px",
                          textAlign: "center",
                        }}
                      >
                        {item.metalCompositionMgFL ?? "-"}
                      </td>
                      <td
                        style={{
                          width: "60px",
                          minWidth: "60px",
                          textAlign: "center",
                        }}
                      >
                        {item.metalCompositionCu ?? "-"}
                      </td>
                      <td
                        style={{
                          width: "60px",
                          minWidth: "60px",
                          textAlign: "center",
                        }}
                      >
                        {item.metalCompositionCr ?? "-"}
                      </td>
                      <td>{item.timeOfPouring || "-"}</td>
                      <td>{item.pouringTemperature ?? "-"}</td>
                      <td>{item.ppCode || "-"}</td>
                      <td>{item.treatmentNo || "-"}</td>
                      <td>{item.fcNo || "-"}</td>
                      <td>{item.heatNo || "-"}</td>
                      <td>{item.conNo || "-"}</td>
                      <td>{item.tappingTime || "-"}</td>
                      <td>{item.correctiveAdditionC ?? "-"}</td>
                      <td>{item.correctiveAdditionSi ?? "-"}</td>
                      <td>{item.correctiveAdditionMn ?? "-"}</td>
                      <td>{item.correctiveAdditionS ?? "-"}</td>
                      <td>{item.correctiveAdditionCr ?? "-"}</td>
                      <td>{item.correctiveAdditionCu ?? "-"}</td>
                      <td>{item.correctiveAdditionSn ?? "-"}</td>
                      <td>{item.tappingWt ?? "-"}</td>
                      <td>{item.mg ?? "-"}</td>
                      <td>{item.resMgConvertor ?? "-"}</td>
                      <td>{item.recOfMg ?? "-"}</td>
                      <td>{item.streamInoculant ?? "-"}</td>
                      <td>{item.pTime ?? "-"}</td>
                      <td>{item.remarks || "-"}</td>

                      <td>
                        <div className="process-actions-container">
                          <EditActionButton onClick={() => requestEdit(item)} />
                          <DeleteActionButton
                            onClick={() => requestDelete(item)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editModal.open && (
        <div
          onClick={closeEditModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: 12,
              padding: 20,
              width: "min(1000px, 95vw)",
              maxWidth: "95vw",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
                Edit Process Control Entry
              </div>
            </div>

            <div className="process-form-grid">
              <div className="process-form-group">
                <label>Date *</label>
                <DatePicker
                  name="date"
                  value={editForm.date || ""}
                  onChange={handleEditChange}
                />
              </div>

              <div className="process-form-group">
                <label>DISA *</label>
                <select
                  name="disa"
                  value={editForm.disa || ""}
                  onChange={handleEditChange}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    border: "2px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="">Select DISA</option>
                  <option value="DISA I">DISA I</option>
                  <option value="DISA II">DISA II</option>
                  <option value="DISA III">DISA III</option>
                  <option value="DISA IV">DISA IV</option>
                </select>
              </div>

              <div className="process-form-group">
                <label>Part Name</label>
                <input
                  type="text"
                  name="partName"
                  value={editForm.partName || ""}
                  onChange={handleEditChange}
                  placeholder="e.g., ABC-123"
                />
              </div>

              <div className="process-form-group">
                <label>Date Code</label>
                <input
                  type="text"
                  name="datecode"
                  value={editForm.datecode || ""}
                  onChange={handleEditChange}
                  placeholder="e.g., 29-10-2025"
                />
              </div>

              <div className="process-form-group">
                <label>Heat Code</label>
                <input
                  type="text"
                  name="heatcode"
                  value={editForm.heatcode || ""}
                  onChange={handleEditChange}
                  placeholder="e.g., HC-001"
                />
              </div>

              <div className="process-form-group">
                <label>Qty. Of Moulds</label>
                <input
                  type="number"
                  name="quantityOfMoulds"
                  value={editForm.quantityOfMoulds ?? ""}
                  onChange={handleEditChange}
                  placeholder="Enter quantity"
                />
              </div>

              {["C", "Si", "Mn", "P", "S", "MgFL", "Cu", "Cr"].map((el) => (
                <div
                  className="process-form-group metal-composition"
                  key={`mc-${el}`}
                >
                  <label>{el === "MgFL" ? "Mg F/L" : `Metal ${el} (%)`}</label>
                  <input
                    type="number"
                    step="0.001"
                    name={`metalComposition${el}`}
                    value={editForm[`metalComposition${el}`] ?? ""}
                    onChange={handleEditChange}
                    placeholder="%"
                    style={{ width: "100%" }}
                  />
                </div>
              ))}

              <div className="process-form-group">
                <label>Time of Pouring</label>
                <input
                  type="time"
                  name="timeOfPouring"
                  value={editForm.timeOfPouring || ""}
                  onChange={handleEditChange}
                />
              </div>

              <div className="process-form-group">
                <label>Pouring Temp (°C)</label>
                <input
                  type="number"
                  step="0.01"
                  name="pouringTemperature"
                  value={editForm.pouringTemperature ?? ""}
                  onChange={handleEditChange}
                  placeholder="e.g., 1450"
                />
              </div>

              <div className="process-form-group">
                <label>PP Code</label>
                <input
                  type="text"
                  name="ppCode"
                  value={editForm.ppCode || ""}
                  onChange={handleEditChange}
                  placeholder="Enter PP code"
                />
              </div>

              <div className="process-form-group">
                <label>Treatment No</label>
                <input
                  type="text"
                  name="treatmentNo"
                  value={editForm.treatmentNo || ""}
                  onChange={handleEditChange}
                  placeholder="Enter treatment no"
                />
              </div>

              <div className="process-form-group">
                <label>F/C No.</label>
                <input
                  type="text"
                  name="fcNo"
                  value={editForm.fcNo || ""}
                  onChange={handleEditChange}
                  placeholder="Enter F/C No."
                />
              </div>

              <div className="process-form-group">
                <label>Heat No</label>
                <input
                  type="text"
                  name="heatNo"
                  value={editForm.heatNo || ""}
                  onChange={handleEditChange}
                  placeholder="Enter Heat No"
                />
              </div>

              <div className="process-form-group">
                <label>Con No</label>
                <input
                  type="text"
                  name="conNo"
                  value={editForm.conNo || ""}
                  onChange={handleEditChange}
                  placeholder="Enter con no"
                />
              </div>

              <div className="process-form-group">
                <label>Tapping Time</label>
                <input
                  type="time"
                  name="tappingTime"
                  value={editForm.tappingTime || ""}
                  onChange={handleEditChange}
                />
              </div>

              {["C", "Si", "Mn", "S", "Cr", "Cu", "Sn"].map((el) => (
                <div className="process-form-group" key={`ca-${el}`}>
                  <label>Corr. Add {el} (Kgs)</label>
                  <input
                    type="number"
                    step="0.01"
                    name={`correctiveAddition${el}`}
                    value={editForm[`correctiveAddition${el}`] ?? ""}
                    onChange={handleEditChange}
                    placeholder="Kgs"
                  />
                </div>
              ))}

              <div className="process-form-group">
                <label>Tapping Wt (Kgs)</label>
                <input
                  type="number"
                  step="0.01"
                  name="tappingWt"
                  value={editForm.tappingWt ?? ""}
                  onChange={handleEditChange}
                  placeholder="Enter weight"
                />
              </div>

              <div className="process-form-group">
                <label>Mg (Kgs)</label>
                <input
                  type="number"
                  step="0.01"
                  name="mg"
                  value={editForm.mg ?? ""}
                  onChange={handleEditChange}
                  placeholder="Enter Mg"
                />
              </div>

              <div className="process-form-group">
                <label>Res. Mg. Convertor (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="resMgConvertor"
                  value={editForm.resMgConvertor ?? ""}
                  onChange={handleEditChange}
                  placeholder="Enter %"
                />
              </div>

              <div className="process-form-group">
                <label>Rec. Of Mg (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="recOfMg"
                  value={editForm.recOfMg ?? ""}
                  onChange={handleEditChange}
                  placeholder="Enter %"
                />
              </div>

              <div className="process-form-group">
                <label>Stream Inoculant (gm/Sec)</label>
                <input
                  type="number"
                  step="0.1"
                  name="streamInoculant"
                  value={editForm.streamInoculant ?? ""}
                  onChange={handleEditChange}
                  placeholder="e.g., 5.5"
                />
              </div>

              <div className="process-form-group">
                <label>P.Time (sec)</label>
                <input
                  type="number"
                  step="0.1"
                  name="pTime"
                  value={editForm.pTime ?? ""}
                  onChange={handleEditChange}
                  placeholder="e.g., 120"
                />
              </div>

              <div
                className="process-form-group"
                style={{ gridColumn: "1 / -1" }}
              >
                <label>Remarks</label>
                <input
                  type="text"
                  name="remarks"
                  value={editForm.remarks || ""}
                  onChange={handleEditChange}
                  placeholder="Enter any additional notes..."
                  maxLength={80}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 16,
              }}
            >
              <button
                onClick={closeEditModal}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={openSaveConfirm}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid #bbf7d0",
                  background: "#dcfce7",
                  color: "#166534",
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {saveConfirm.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 70,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 8,
              padding: 20,
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: 8,
              }}
            >
              Confirm Save
            </div>
            <div style={{ color: "#334155" }}>
              Do you want to save the changes?
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 16,
              }}
            >
              <button
                onClick={closeSaveConfirm}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  cursor: "pointer",
                }}
              >
                No
              </button>
              <button
                onClick={performSave}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid #bbf7d0",
                  background: "#dcfce7",
                  color: "#166534",
                  cursor: "pointer",
                }}
              >
                Yes, Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 70,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 8,
              padding: 20,
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: 8,
              }}
            >
              Confirm Deletion
            </div>
            <div style={{ color: "#334155" }}>
              Are you sure you want to delete this record?
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 16,
              }}
            >
              <button
                onClick={closeDeleteConfirm}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={performDelete}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid #fecaca",
                  background: "#fee2e2",
                  color: "#b91c1c",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProcessReport;
