import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { FilterButton, ClearButton, CustomPagination } from "../Components/Buttons";
import CustomDatePicker from "../Components/CustomDatePicker";
import { API_ENDPOINTS } from "../config/api";
import { formatDateTime } from "../utils/formatDateTime";
import "../styles/ComponentStyles/Table.css";
import "../styles/PageStyles/Admin/DownloadLogsReport.css";

const formatDateLocal = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

const getTodayLocal = () => formatDateLocal(new Date());

const DownloadLogsMine = () => {
  const todayStr = getTodayLocal();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState(todayStr);
  const [allLogs, setAllLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 15;

  const isFilterEnabled =
    toDate &&
    toDate.trim() !== "" &&
    !(fromDate && fromDate.trim() !== "" && toDate <= fromDate);

  const applyFilters = (logs, from, to) =>
    logs.filter((l) => {
      if (!l.createdAt) return false;
      const logDate = formatDateLocal(l.createdAt);
      if (from) {
        return logDate >= from && logDate <= to;
      }
      return logDate === to;
    });

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        // Own logs only — server already caps this at the newest 100/DLOG rows.
        const res = await fetch(API_ENDPOINTS.downloadLogs, {
          credentials: "include",
        });
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setAllLogs(result.data);
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

  const handleFilter = () => {
    if (!toDate) {
      setFilteredLogs([]);
      setCurrentPage(1);
      return;
    }
    setFilteredLogs(applyFilters(allLogs, fromDate, toDate));
    setCurrentPage(1);
  };

  const handleClear = () => {
    setFromDate("");
    setToDate(todayStr);
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
            My Download Logs
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
        <FilterButton onClick={handleFilter} disabled={!isFilterEnabled} />
        <ClearButton onClick={handleClear} />
      </div>

      {loading ? (
        <div className="dlr-loader-container">
          <div>Loading download logs…</div>
        </div>
      ) : (
        <div className="reusable-table-container">
          <table className="reusable-table">
            <colgroup>
              <col style={{ width: "6%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>#</th>
                <th>Report</th>
                <th>Date</th>
                <th>Range Downloaded</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="reusable-table-no-records">
                    No records found
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, index) => {
                  const { date, time } = formatDateTime(log.createdAt);
                  return (
                    <tr key={log._id || index}>
                      <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
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

export default DownloadLogsMine;
