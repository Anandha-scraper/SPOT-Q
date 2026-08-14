import React, { useState, useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  User,
  LogIn,
  Calendar,
  Clock,
  UserRoundPen,
  Shield,
  Building2,
  IdCard,
  Download,
  BarChart3,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import "../styles/ComponentStyles/PopUp.css";
import { EyeButton, CustomPagination } from "./Buttons";
import { API_ENDPOINTS } from "../config/api";
import { formatDateTime } from "../utils/formatDateTime";
import "../styles/ComponentStyles/UserProfile.css";

// Register the Chart.js pieces used by the employee bar chart + admin line chart.
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
);

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Admin Entry Trends graph departments — Sand Lab/Moulding DISA excluded (table-based; DISA gets its own line only on the Moulding user's mouldingChart below, not here).
const ADMIN_DEPARTMENTS = [
  "Melting · Log Sheet",
  "Melting · Cupola Holder",
  "Moulding · DMM",
  "Process",
  "Tensile",
  "Impact",
  "Micro Tensile",
  "Micro Structure",
  "QC - Production",
];

const DEPT_COLORS = [
  "#5B9AA9",
  "#e11d48",
  "#2563eb",
  "#f59e0b",
  "#16a34a",
  "#9333ea",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#ea580c",
  "#4f46e5",
  "#0d9488",
];

// Moulding's own two-line chart (see mouldingChart below) — DMM's color matches
// its line in the admin chart (DEPT_COLORS[2]) for visual continuity.
const MOULDING_LINE_COLORS = { Disamatic: "#0d9488", DMM: "#2563eb" };

// Convert a #rrggbb color to an rgba() string with the given alpha.
const transparentize = (hex, alpha) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const EditCard = ({
  isOpen,
  onClose,
  onSave,
  onCancel,
  departmentName,
  saveText = "Save",
  loading = false,
  error = "",
  children,
}) => {
  if (!isOpen) return null;
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && (onClose || onCancel))
      (onClose || onCancel)();
  };
  return (
    <div className="editcard-overlay" onClick={handleBackdropClick}>
      <div className="editcard-container" onClick={(e) => e.stopPropagation()}>
        <div className="editcard-header">
          <h2 className="editcard-title">Change {departmentName}</h2>
        </div>
        <div className="editcard-body">{children}</div>
        <div className="editcard-footer">
          {error && <span className="editcard-error">{error}</span>}
          <button
            className="editcard-btn editcard-btn-save"
            onClick={onSave}
            disabled={loading}
          >
            {loading ? "Saving..." : saveText}
          </button>
        </div>
      </div>
    </div>
  );
};

const UserProfile = () => {
  // ---- Auth ----
  const { user, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  const userData = user || {
    name: "Unknown",
    role: "",
    department: "",
    employeeId: "",
  };

  // ---- Password modal ----
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // ---- Login history ----
  const [loginHistory, setLoginHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // ---- Download logs ----
  const [downloadLogs, setDownloadLogs] = useState([]);
  const [downloadLoading, setDownloadLoading] = useState(true);
  const [downloadPage, setDownloadPage] = useState(1);
  const downloadLogsPerPage = 5;

  // ---- Entry stats (activity chart) ----
  const [entryStats, setEntryStats] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ---- Admin dept trend filter (multi-checkbox) ----
  const [checkedDepts, setCheckedDepts] = useState(
    () => new Set(ADMIN_DEPARTMENTS),
  );
  const toggleDept = (dept) =>
    setCheckedDepts((prev) => {
      const next = new Set(prev);
      next.has(dept) ? next.delete(dept) : next.add(dept);
      return next;
    });

  // Fetch login history for the current user
  useEffect(() => {
    async function fetchLoginHistory() {
      try {
        setHistoryLoading(true);
        const res = await fetch(API_ENDPOINTS.loginHistory, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const formatted = data.data.map((login) => {
            const { date, time } = formatDateTime(login.loginAt);
            return {
              id: login._id,
              date,
              time,
              loginAt: login.loginAt,
              ip: login.ip,
            };
          });
          setLoginHistory(formatted);
        } else {
          setLoginHistory([]);
        }
      } catch (error) {
        console.error("Error fetching login history:", error);
        setLoginHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    }
    if (user) fetchLoginHistory();
  }, [user]);

  // Fetch download logs — admin sees all employees; non-admin sees own logs only.
  useEffect(() => {
    async function fetchDownloadLogs() {
      try {
        setDownloadLoading(true);
        const endpoint = isAdmin
          ? API_ENDPOINTS.downloadLogsAll
          : API_ENDPOINTS.downloadLogs;
        const res = await fetch(endpoint, { credentials: "include" });
        const data = await res.json();
        setDownloadLogs(
          data.success && Array.isArray(data.data) ? data.data : [],
        );
        setDownloadPage(1);
      } catch (error) {
        console.error("Error fetching download logs:", error);
        setDownloadLogs([]);
        setDownloadPage(1);
      } finally {
        setDownloadLoading(false);
      }
    }
    if (user) fetchDownloadLogs();
  }, [user, isAdmin]);

  // ---- Download logs pagination (derived) ----
  // Non-admin: flat last-5, no pager — the rest is only reachable via the
  // dedicated "my downloads" report page (mirrors admin's "view full logs").
  const totalDownloadPages = Math.ceil(
    downloadLogs.length / downloadLogsPerPage,
  );
  const paginatedDownloadLogs = isAdmin
    ? downloadLogs.slice(
        (downloadPage - 1) * downloadLogsPerPage,
        downloadPage * downloadLogsPerPage,
      )
    : downloadLogs.slice(0, downloadLogsPerPage);

  // Fetch per-day entry stats for the current month (non-admin only)
  const fetchEntryStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch(API_ENDPOINTS.entryStats, {
        credentials: "include",
      });
      const data = await res.json();
      setEntryStats(data.success ? data.data : null);
    } catch (error) {
      console.error("Error fetching entry stats:", error);
      setEntryStats(null);
    } finally {
      setStatsLoading(false);
    }
  };
  // Fetch per-day counts across all departments (admin only)
  const fetchAdminStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch(API_ENDPOINTS.entryStatsAdmin, {
        credentials: "include",
      });
      const data = await res.json();
      setAdminStats(data.success ? data.data : null);
    } catch (error) {
      console.error("Error fetching admin entry stats:", error);
      setAdminStats(null);
    } finally {
      setStatsLoading(false);
    }
  };
  useEffect(() => {
    if (!user) {
      setStatsLoading(false);
      return;
    }
    if (isAdmin) fetchAdminStats();
    else fetchEntryStats();
  }, [user, isAdmin]);

  // ---- Activity chart data ----
  const chart = useMemo(() => {
    const nowDate = new Date();
    const year = entryStats?.year || nowDate.getFullYear();
    const month = entryStats?.month || nowDate.getMonth() + 1; // 1-based
    const daysInMonth =
      entryStats?.daysInMonth || new Date(year, month, 0).getDate();

    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const countByDay = {};
    (entryStats?.counts || []).forEach((c) => {
      countByDay[c.day] = c.count;
    });
    const values = labels.map((day) => countByDay[day] || 0);

    const data = {
      labels,
      datasets: [
        {
          label: "Entries",
          data: values,
          backgroundColor: "rgba(91, 154, 169, 0.55)",
          hoverBackgroundColor: "rgba(91, 154, 169, 0.9)",
          borderColor: "#5B9AA9",
          borderWidth: 1,
          borderRadius: 4,
          maxBarThickness: 22,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) =>
              `Day ${items[0].label} · ${MONTH_NAMES[month - 1]}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#64748b", font: { size: 10 } },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#64748b", precision: 0, stepSize: 1 },
          grid: { color: "#eef2f6" },
        },
      },
    };

    return { data, options, title: `${MONTH_NAMES[month - 1]} ${year}` };
  }, [entryStats]);

  // ---- Derived department flags (non-admin) ----
  const isSandLab = !isAdmin && userData.department === "Sand Lab";
  const isMoulding = !isAdmin && userData.department === "Moulding";

  // ---- Admin all-department line chart ----
  // Built from the real /entry-stats/admin response. Follows the Chart.js config:
  // smooth lines (tension), animated hover radius, yellow hover point, tooltip off.
  const adminChart = useMemo(() => {
    const nowDate = new Date();
    const year = adminStats?.year || nowDate.getFullYear();
    const month = adminStats?.month || nowDate.getMonth() + 1; // 1-based
    // Day-of-month range for the returned month, matching the per-day charts
    // used across the departments.
    const daysInMonth =
      adminStats?.daysInMonth || new Date(year, month, 0).getDate();
    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Index the response by label -> { day: count } for quick lookup.
    const countsByLabel = {};
    (adminStats?.departments || []).forEach((d) => {
      const map = {};
      (d.counts || []).forEach((c) => {
        map[c.day] = c.count;
      });
      countsByLabel[d.label] = map;
    });

    const datasets = ADMIN_DEPARTMENTS.map((dept, i) => {
      const color = DEPT_COLORS[i % DEPT_COLORS.length];
      const map = countsByLabel[dept] || {};
      return {
        label: dept,
        data: labels.map((day) => map[day] || 0),
        borderColor: color,
        backgroundColor: transparentize(color, 0.5),
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 2,
      };
    });

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      animations: {
        radius: {
          duration: 400,
          easing: "linear",
          loop: (context) => context.active,
        },
      },
      elements: {
        point: { hoverRadius: 12, hoverBackgroundColor: "yellow" },
      },
      interaction: { mode: "nearest", intersect: true },
      plugins: {
        tooltip: {
          callbacks: {
            title: (items) =>
              `Day ${items[0].label} · ${MONTH_NAMES[month - 1]}`,
            label: (item) => `${item.dataset.label}: ${item.formattedValue}`,
          },
        },
        legend: {
          position: "top",
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            font: { size: 10 },
            padding: 8,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#64748b", font: { size: 10 } },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#64748b", precision: 0 },
          grid: { color: "#eef2f6" },
        },
      },
    };

    return {
      data: { labels, datasets },
      options,
      title: `${MONTH_NAMES[month - 1]} ${year}`,
    };
  }, [adminStats]);

  // ---- Moulding's own two-line (Disamatic/DMM) chart ----
  // Same visual pattern as adminChart, but scoped to Moulding's own two
  // sub-departments and with a per-shift breakdown in the tooltip instead of
  // admin's per-department one — see entryStats.series (statsService.js's
  // Moulding special-case in getPersonalStats).
  const mouldingChart = useMemo(() => {
    const nowDate = new Date();
    const year = entryStats?.year || nowDate.getFullYear();
    const month = entryStats?.month || nowDate.getMonth() + 1; // 1-based
    const daysInMonth =
      entryStats?.daysInMonth || new Date(year, month, 0).getDate();
    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const seriesByLabel = {};
    (entryStats?.series || []).forEach((s) => {
      const map = {};
      (s.counts || []).forEach((c) => {
        map[c.day] = c;
      });
      seriesByLabel[s.label] = map;
    });

    const shiftTotal = (c) => (c ? c.shift1 + c.shift2 + c.shift3 : 0);

    const datasets = ["Disamatic", "DMM"].map((label) => {
      const map = seriesByLabel[label] || {};
      const color = MOULDING_LINE_COLORS[label];
      return {
        label,
        data: labels.map((day) => shiftTotal(map[day])),
        borderColor: color,
        backgroundColor: transparentize(color, 0.5),
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 2,
      };
    });

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      animations: {
        radius: {
          duration: 400,
          easing: "linear",
          loop: (context) => context.active,
        },
      },
      elements: {
        point: { hoverRadius: 12, hoverBackgroundColor: "yellow" },
      },
      // index+intersect:false (not admin's nearest+intersect:true) — hovering
      // anywhere on a day's column shows both lines' shift breakdown together,
      // rather than relying on two lines coincidentally sharing a pixel.
      interaction: { mode: "index", intersect: false },
      plugins: {
        tooltip: {
          callbacks: {
            title: (items) =>
              `Day ${items[0].label} · ${MONTH_NAMES[month - 1]}`,
            label: (item) => {
              const c = seriesByLabel[item.dataset.label]?.[item.label];
              return [
                item.dataset.label,
                `  Shift I: ${c?.shift1 || 0}`,
                `  Shift II: ${c?.shift2 || 0}`,
                `  Shift III: ${c?.shift3 || 0}`,
              ];
            },
          },
        },
        legend: {
          position: "top",
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            font: { size: 10 },
            padding: 8,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#64748b", font: { size: 10 } },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#64748b", precision: 0 },
          grid: { color: "#eef2f6" },
        },
      },
    };

    return {
      data: { labels, datasets },
      options,
      title: `${MONTH_NAMES[month - 1]} ${year}`,
    };
  }, [entryStats]);

  // Filter admin chart datasets to only the checked departments
  const filteredAdminChartData = useMemo(() => {
    if (checkedDepts.size === 0) return { ...adminChart.data, datasets: [] };
    if (checkedDepts.size === ADMIN_DEPARTMENTS.length) return adminChart.data;
    return {
      ...adminChart.data,
      datasets: adminChart.data.datasets.filter((ds) =>
        checkedDepts.has(ds.label),
      ),
    };
  }, [adminChart.data, checkedDepts]);

  // ---- Password handlers ----
  const handlePasswordModalOpen = () => setIsPasswordModalOpen(true);
  const handlePasswordModalClose = () => {
    setIsPasswordModalOpen(false);
    setPasswordError("");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPassword({ current: false, new: false, confirm: false });
  };
  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    setPasswordError("");
  };
  const handlePasswordSave = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordError("All fields are required");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.changePassword, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPasswordError(data.message || "Failed to change password");
        setPasswordLoading(false);
        return;
      }
      setPasswordLoading(false);
      handlePasswordModalClose();
    } catch (error) {
      setPasswordError("Failed to change password");
      setPasswordLoading(false);
    }
  };

  return (
    <div className="up-page">
      {/* Left column: Identity Strip + Login History · Right: Download Logs (tall) */}
      <div className="up-grid-2">
        <div className="up-left-col">
          {/* Identity Strip */}
          <div className="up-identity">
            <div className="up-id-avatar">
              <User size={20} />
            </div>
            <div className="up-id-info">
              <span className="up-id-name">{userData.name}</span>
              <div className="up-id-chips">
                <span className="up-chip up-chip-id">
                  <IdCard size={10} /> {userData.employeeId || "—"}
                </span>
                <span className="up-chip up-chip-dept">
                  <Building2 size={10} /> {userData.department || "—"}
                </span>
                <span className="up-chip up-chip-role">
                  <Shield size={10} /> {userData.role || "employee"}
                </span>
              </div>
            </div>
            <button className="up-pwd-btn" onClick={handlePasswordModalOpen}>
              <UserRoundPen size={14} />
              Change Password
            </button>
          </div>

          {/* Login History card */}
          <div className="up-card up-card-login">
            <div className="up-card-head">
              <LogIn size={16} />
              <span>Login History</span>
              <span className="up-head-sub">Last 5 sessions</span>
            </div>
            <div className="up-login-list">
              <div className="up-login-hdr">
                <span>Date</span>
                <span>Time</span>
              </div>
              {historyLoading ? (
                <div className="up-empty">Loading login history…</div>
              ) : loginHistory.length > 0 ? (
                loginHistory.slice(0, 5).map((login) => (
                  <div key={login.id} className="up-login-row">
                    <span>
                      <Calendar size={11} /> {login.date}
                    </span>
                    <span>
                      <Clock size={11} /> {login.time}
                    </span>
                  </div>
                ))
              ) : (
                <div className="up-empty">No login history available</div>
              )}
            </div>
          </div>
        </div>

        {/* Download Logs */}
        <div className="up-card up-card-download">
          <div className="up-card-head">
            <Download size={16} />
            <span>Download Logs</span>
            <span className="up-head-sub">
              {isAdmin ? "All departments" : "Your recent downloads"}
            </span>
            {isAdmin ? (
              <button
                className="up-refresh-btn"
                title="View full logs"
                onClick={() => navigate("/admin/download-logs")}
              >
                <ExternalLink size={14} />
              </button>
            ) : (
              <button
                className="up-refresh-btn"
                title="View all your downloads"
                onClick={() => navigate("/user-profile/download-logs")}
              >
                <ExternalLink size={14} />
              </button>
            )}
          </div>
          <div className="up-tbl-wrap">
            <table className="up-tbl">
              <thead>
                <tr>
                  <th>#</th>
                  {isAdmin && <th>Emp ID</th>}
                  {isAdmin && <th>Name</th>}
                  {isAdmin && <th>Report</th>}
                  <th>Date</th>
                  <th>Range Downloaded</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {downloadLoading ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 4} className="up-tbl-state">
                      Loading download logs…
                    </td>
                  </tr>
                ) : paginatedDownloadLogs.length > 0 ? (
                  paginatedDownloadLogs.map((log, index) => {
                    const { date, time } = formatDateTime(log.createdAt);
                    return (
                      <tr key={log._id || index}>
                        <td>
                          {(downloadPage - 1) * downloadLogsPerPage +
                            index +
                            1}
                        </td>
                        {isAdmin && <td>{log.employeeId || "—"}</td>}
                        {isAdmin && <td>{log.name || "—"}</td>}
                        {isAdmin && (
                          <td className="up-tbl-report-cell">
                            {log.reportType || "—"}
                          </td>
                        )}
                        <td>{date}</td>
                        <td>{log.rangeLabel || "—"}</td>
                        <td>{time}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 4} className="up-tbl-state">
                      No download history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {isAdmin && !downloadLoading && totalDownloadPages > 1 && (
            <CustomPagination
              currentPage={downloadPage}
              totalPages={totalDownloadPages}
              onPageChange={setDownloadPage}
              className="up-pagination-compact"
            />
          )}
        </div>
      </div>

      {/* Activity Chart — Sand Lab: table-based, placeholder only */}
      {isSandLab ? (
        <div className="up-card up-card-chart up-chart-placeholder" />
      ) : (
        <div className="up-card up-card-chart">
          <div className="up-card-head">
            <BarChart3 size={16} />
            <span>
              {isAdmin
                ? "Department Entry Trends"
                : isMoulding
                  ? "Moulding Entries This Month"
                  : "Entries This Month"}
            </span>
            <span className="up-head-sub">
              {isAdmin
                ? `${adminChart.title} · daily entries`
                : isMoulding
                  ? `${mouldingChart.title} · entries per shift`
                  : `${chart.title} · entries per day`}
            </span>
            <button
              className="up-refresh-btn"
              onClick={isAdmin ? fetchAdminStats : fetchEntryStats}
              title="Refresh"
            >
              <RefreshCw size={13} />
            </button>
          </div>
          {/* Admin dept checkboxes — hidden for non-admin */}
          {isAdmin && (
            <div className="up-dept-checks">
              <button
                className="up-dept-check-btn"
                onClick={() => setCheckedDepts(new Set())}
                title="Uncheck all departments"
              >
                None
              </button>
              <button
                className="up-dept-check-btn up-dept-check-btn-all"
                onClick={() => setCheckedDepts(new Set(ADMIN_DEPARTMENTS))}
                title="Select all departments"
              >
                All
              </button>
              <span className="up-dept-checks-sep" />
              {ADMIN_DEPARTMENTS.map((dept, i) => {
                const color = DEPT_COLORS[i % DEPT_COLORS.length];
                const checked = checkedDepts.has(dept);
                return (
                  <label
                    key={dept}
                    className={`up-dept-check-item${checked ? " checked" : ""}`}
                    style={{
                      borderColor: checked ? color : "transparent",
                      background: checked ? `${color}14` : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDept(dept)}
                      style={{ accentColor: color }}
                    />
                    <span style={{ color: checked ? color : "#94a3b8" }}>
                      {dept}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          <div className={`up-chart${isAdmin ? " is-admin" : ""}`}>
            {statsLoading && !isAdmin && entryStats === null ? (
              <div className="up-chart-msg">Loading activity…</div>
            ) : isAdmin ? (
              <Line
                data={filteredAdminChartData}
                options={adminChart.options}
              />
            ) : isMoulding ? (
              <Line data={mouldingChart.data} options={mouldingChart.options} />
            ) : (
              <Bar data={chart.data} options={chart.options} />
            )}
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      <EditCard
        isOpen={isPasswordModalOpen}
        onClose={handlePasswordModalClose}
        departmentName="Password"
        onSave={handlePasswordSave}
        onCancel={handlePasswordModalClose}
        saveText="Change Password"
        loading={passwordLoading}
        error={passwordError}
      >
        <div className="password-change-form">
          <div className="password-form-group">
            <label htmlFor="currentPassword" className="password-label">
              Current Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="currentPassword"
                type={showPassword.current ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  handlePasswordChange("currentPassword", e.target.value)
                }
                placeholder="Enter current password"
                className="password-input"
                disabled={passwordLoading}
              />
              <EyeButton
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    current: !prev.current,
                  }))
                }
                isVisible={showPassword.current}
              />
            </div>
          </div>
          <div className="password-form-group">
            <label htmlFor="newPassword" className="password-label">
              New Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="newPassword"
                type={showPassword.new ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) =>
                  handlePasswordChange("newPassword", e.target.value)
                }
                placeholder="Enter new password"
                className="password-input"
                disabled={passwordLoading}
              />
              <EyeButton
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, new: !prev.new }))
                }
                isVisible={showPassword.new}
              />
            </div>
          </div>
          <div className="password-form-group">
            <label htmlFor="confirmPassword" className="password-label">
              Confirm New Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="confirmPassword"
                type={showPassword.confirm ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  handlePasswordChange("confirmPassword", e.target.value)
                }
                placeholder="Confirm new password"
                className="password-input"
                disabled={passwordLoading}
              />
              <EyeButton
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    confirm: !prev.confirm,
                  }))
                }
                isVisible={showPassword.confirm}
              />
            </div>
          </div>
        </div>
      </EditCard>
    </div>
  );
};

export default UserProfile;
