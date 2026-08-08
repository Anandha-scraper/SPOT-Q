import React, { useState, useEffect, useMemo, useContext } from "react";
import { Navigate } from "react-router-dom";
import { Download } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import {
  FilterButton,
  ClearButton,
  DeptTrendDropdown,
  CustomPagination,
} from "../../Components/Buttons";
import CustomDatePicker from "../../Components/CustomDatePicker";
import { API_ENDPOINTS } from "../../config/api";
import { formatDateTime } from "../../utils/formatDateTime";
import "../../styles/ComponentStyles/Table.css";
import "../../styles/PageStyles/Admin/DownloadLogsReport.css";

const formatDateLocal = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

const getTodayLocal = () => formatDateLocal(new Date());

const DownloadLogsReport = () => {
  const { isAdmin } = useContext(AuthContext);

  const todayStr = getTodayLocal();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState(todayStr);
  const [selectedDept, setSelectedDept] = useState("");
  const [allLogs, setAllLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 12;

  const isFilterEnabled =
    toDate &&
    toDate.trim() !== "" &&
    !(fromDate && fromDate.trim() !== "" && toDate <= fromDate);

  const deptOptions = useMemo(
    () =>
      Array.from(new Set(allLogs.map((l) => l.department).filter(Boolean))).sort(),
    [allLogs],
  );

  const applyFilters = (logs, from, to, dept) => {
    let filtered = logs.filter((l) => {
      if (!l.createdAt) return false;
      const logDate = formatDateLocal(l.createdAt);
      if (from) {
        return logDate >= from && logDate <= to;
      }
      return logDate === to;
    });
    if (dept) {
      filtered = filtered.filter((l) => l.department === dept);
    }
    return filtered;
  };

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        // Backend has no query params yet — filters below apply client-side to
        // this capped (max 500, most-recent-first) response.
        const res = await fetch(API_ENDPOINTS.downloadLogsAll, {
          credentials: "include",
        });
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setAllLogs(result.data);
          // Show everything on first load — the To Date field is pre-filled with
          // today only as a starting point for the Filter button, it doesn't
          // restrict the initial view (logs from every department/day should
          // be visible until the user explicitly filters).
          setFilteredLogs(result.data);
        } else {
          setAllLogs([]);
          setFilteredLogs([]);
        }
      } catch (error) {
        console.error("Error fetching download logs:", error);
        setAllLogs([]);
        setFilteredLogs([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleFilter = () => {
    if (!toDate) {
      setFilteredLogs([]);
      setCurrentPage(1);
      return;
    }
    setFilteredLogs(applyFilters(allLogs, fromDate, toDate, selectedDept));
    setCurrentPage(1);
  };

  const handleClear = () => {
    setFromDate("");
    setToDate(todayStr);
    setSelectedDept("");
    setFilteredLogs(allLogs);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <>
      <div className="dlr-header">
        <div className="dlr-header-text">
          <h2>
            <Download size={28} style={{ color: "#5B9AA9" }} />
            Download Logs — Report
          </h2>
        </div>
      </div>

      <div className="dlr-filter-wrapper">
        <div className="dlr-filter-group">
          <label className="dlr-filter-label">From Date</label>
          <CustomDatePicker
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            max={toDate || todayStr}
            placeholder="From date"
          />
        </div>
        <div className="dlr-filter-group">
          <label className="dlr-filter-label">To Date</label>
          <CustomDatePicker
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            max={todayStr}
            placeholder="To date"
          />
        </div>
        <div className="dlr-filter-group">
          <label className="dlr-filter-label">Department (Optional)</label>
          <DeptTrendDropdown
            value={selectedDept}
            onChange={setSelectedDept}
            options={deptOptions}
            style={{
              width: "100%",
              maxWidth: "100%",
              padding: "0.625rem 0.875rem",
              fontSize: "0.875rem",
              borderRadius: "8px",
              boxSizing: "border-box",
            }}
          />
        </div>
        <FilterButton onClick={handleFilter} disabled={!isFilterEnabled} />
        <ClearButton onClick={handleClear} />
      </div>

      {loading ? (
        <div className="dlr-loader-container">
          <div>Loading download logs…</div>
        </div>
      ) : (
        <div className="reusable-table-container">
          <table className="reusable-table dlr-table">
            <colgroup>
              <col style={{ width: "4%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>#</th>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Report</th>
                <th>Date</th>
                <th>Range Downloaded</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="reusable-table-no-records">
                    No records found
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, index) => {
                  const { date, time } = formatDateTime(log.createdAt);
                  return (
                    <tr key={log._id || index}>
                      <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td>{log.employeeId || "—"}</td>
                      <td>{log.name || "—"}</td>
                      <td>{log.department || "—"}</td>
                      <td>{log.reportType || "—"}</td>
                      <td>{date}</td>
                      <td>{log.rangeLabel || "—"}</td>
                      <td>{time}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </>
  );
};

export default DownloadLogsReport;
