import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { DeleteButton, DeptTrendDropdown } from "./Buttons";
import { Eye, EyeOff, UserRoundPen, UserPlus, X } from "lucide-react";
import "../styles/ComponentStyles/Alert.css";
import { API_ENDPOINTS } from "../config/api"; //deployment ready API endpoints
import { useToast } from "./alert";
import "../styles/ComponentStyles/AdminDashboard.css";

const DeletingStatus = () => (
  <div className="delete-alert-overlay">
    <div className="delete-alert-content">
      <div className="delete-loader">
        <div className="trash-lid"></div>
        <div className="trash-body">
          <div className="trash-line"></div>
          <div className="trash-line"></div>
        </div>
        <div className="deleting-item"></div>
      </div>
      <div className="delete-alert-text">
        <h2 className="delete-alert-title">Permanently removing employee...</h2>
      </div>
    </div>
  </div>
);

const CreatingEmployeeStatus = () => (
  <div className="create-alert-overlay">
    <div className="create-alert-content">
      <div className="employee-builder-loader">
        <div className="profile-card">
          <div className="profile-avatar"></div>
          <div className="profile-details">
            <div className="detail-line text-short"></div>
            <div className="detail-line text-long"></div>
          </div>
        </div>
        <div className="success-badge">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M19.916 4.626a.75.75 0 0 1 .207 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      <div className="create-alert-text">
        <h2 className="create-alert-title">Onboarding New Member</h2>
        <p className="create-alert-subtitle">Finalizing profile details...</p>
      </div>
    </div>
  </div>
);

const PASSWORD_MIN_LENGTH = 6;
const CREATE_ANIMATION_MS = 3000;

const STRENGTH_LEVELS = [
  { level: "weak", text: "Weak" },
  { level: "weak", text: "Weak" },
  { level: "medium", text: "Medium" },
  { level: "strong", text: "Strong" },
  { level: "strong", text: "Strong" },
];

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, level: "empty", text: "" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (password.length < PASSWORD_MIN_LENGTH) score = 0;
  return { score: Math.max(score, 1), ...STRENGTH_LEVELS[score] };
};

const PasswordStrengthMeter = ({ password }) => {
  const { score, level, text } = getPasswordStrength(password);
  return (
    <div className="pwd-strength" aria-live="polite">
      <div className="pwd-strength-bars">
        {[1, 2, 3, 4].map((slot) => (
          <span
            key={slot}
            className={`pwd-bar ${slot <= score ? `pwd-bar--${level}` : ""}`}
          />
        ))}
      </div>
      <span className={`pwd-strength-label pwd-strength-label--${level}`}>
        {text ? `${text} password` : "Enter a password"}
      </span>
    </div>
  );
};

const AdminDashboard = () => {
  const { toast } = useToast();
  // Hooks and Context
  const { isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  // Data States
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    department: "",
    password: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Modal States (Crucial missing states)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Creating Employee State
  const [isCreating, setIsCreating] = useState(false);

  // Security Redirect
  useEffect(() => {
    if (!isAdmin) navigate("/");
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchDepartments();
    fetchUsers();
  }, [isAdmin]);

  // Functions
  const fetchDepartments = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.adminDepartments, {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) setDepartments(data.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.adminUsers, {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) setUsers(data.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setFormData({
      employeeId: "",
      name: "",
      department: "",
      password: "",
      confirmPassword: "",
    });
    setFormError("");
    setShowCreatePassword(false);
    setShowConfirmPassword(false);
    setShowCreateModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "employeeId" ? value.toUpperCase() : value,
    }));
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.employeeId ||
      !formData.name ||
      !formData.department ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setFormError("Enter all required fields.");
      return;
    }
    if (formData.password.length < PASSWORD_MIN_LENGTH) {
      setFormError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    try {
      setIsCreating(true);
      setFormLoading(true);
      const payload = {
        employeeId: formData.employeeId,
        name: formData.name,
        password: formData.password,
        department: formData.department,
      };
      const response = await fetch(API_ENDPOINTS.adminUsers, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        const createdName = formData.name;
        setFormLoading(false);
        setShowCreateModal(false);
        setFormData({
          employeeId: "",
          name: "",
          department: "",
          password: "",
          confirmPassword: "",
        });
        fetchUsers();
        setTimeout(() => {
          setIsCreating(false);
          toast.success(`Employee ${createdName} created successfully.`);
        }, CREATE_ANIMATION_MS);
      } else {
        setIsCreating(false);
        setFormError(data.message || "Failed to create employee.");
      }
    } catch (error) {
      setIsCreating(false);
      setFormError("Error connecting to server.");
    } finally {
      if (!isCreating) setFormLoading(false);
    }
  };

  const handleOpenDeleteModal = (userId, employeeId) => {
    setUserToDelete({ userId, employeeId });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteModal(false);
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${API_ENDPOINTS.adminUsers}/${userToDelete.userId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await response.json();
      if (data.success) {
        await fetchUsers();
        setTimeout(() => {
          setIsDeleting(false);
          setUserToDelete(null);
        }, 1000); // set suration of deleting animation
      } else {
        setIsDeleting(false);
        toast.error(data.message || "Failed to delete employee");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setIsDeleting(false);
      toast.error("Error deleting employee");
    }
  };

  const handleOpenPasswordModal = (targetUser) => {
    setSelectedUser(targetUser);
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordError("");
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setShowPasswordModal(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setPasswordError(
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      );
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    try {
      setPasswordLoading(true);
      const response = await fetch(
        `${API_ENDPOINTS.adminUsers}/${selectedUser._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ password: newPassword }),
        },
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Password updated successfully!");
        setShowPasswordModal(false);
      } else {
        setPasswordError(data.message || "Failed to update password.");
      }
    } catch (error) {
      setPasswordError("Error updating password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="admin-dash">
      <div className="admin-dash-header">
        <h2 className="admin-dash-title">Admin Employee Management</h2>
        <button
          type="button"
          className="add-emp-btn"
          onClick={handleOpenCreateModal}
        >
          <UserPlus size={18} />
          <span>Add Employee</span>
        </button>
      </div>

      {/* EMPLOYEE LIST */}
      <div className="emp-card">
        <div className="emp-filter-bar">
          <span className="emp-filter-label">Department</span>
          <DeptTrendDropdown
            value={selectedDepartment}
            onChange={setSelectedDepartment}
            options={departments.filter((d) => d !== "Admin")}
          />
          {selectedDepartment && (
            <button
              className="emp-filter-clear"
              onClick={() => setSelectedDepartment("")}
              title="Show all departments"
            >
              &times;
            </button>
          )}
        </div>
        {loading ? (
          <div className="loading-state">Loading employees...</div>
        ) : (
          <div className="emp-table-container">
            <table className="emp-table">
              <thead>
                <tr>
                  <th
                    style={{
                      width: "50px",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      textAlign: "center",
                    }}
                  >
                    S.no
                  </th>
                  <th
                    style={{
                      width: "130px",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      textAlign: "center",
                    }}
                  >
                    Employee ID
                  </th>
                  <th
                    style={{
                      width: "250px",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      textAlign: "center",
                    }}
                  >
                    Department
                  </th>
                  <th
                    style={{
                      width: "250px",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      textAlign: "center",
                    }}
                  >
                    Last Login
                  </th>
                  <th
                    style={{
                      width: "120px",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      textAlign: "center",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter(
                    (u) =>
                      u.role !== "admin" &&
                      (!selectedDepartment ||
                        u.department === selectedDepartment),
                  )
                  .map((u, index) => (
                    <tr key={u._id}>
                      <td
                        style={{
                          fontSize: "0.95rem",
                          color: "#2d3748",
                          textAlign: "center",
                        }}
                      >
                        {index + 1}
                      </td>
                      <td
                        className="emp-id"
                        style={{
                          fontSize: "1.25rem",
                          color: "#000000",
                          letterSpacing: "0.5px",
                          textAlign: "center",
                        }}
                      >
                        {u.employeeId}
                      </td>
                      <td
                        style={{
                          fontSize: "0.95rem",
                          color: "#2d3748",
                          textAlign: "center",
                        }}
                      >
                        {u.department}
                      </td>
                      <td
                        style={{
                          fontSize: "0.95rem",
                          color: "#2d3748",
                          textAlign: "center",
                        }}
                      >
                        {u.lastLogin
                          ? (() => {
                              const date = new Date(u.lastLogin);
                              const day = String(date.getDate()).padStart(
                                2,
                                "0",
                              );
                              const month = String(
                                date.getMonth() + 1,
                              ).padStart(2, "0");
                              const year = String(date.getFullYear()).slice(
                                -2,
                              );
                              let hours = date.getHours();
                              const minutes = String(
                                date.getMinutes(),
                              ).padStart(2, "0");
                              const ampm = hours >= 12 ? "PM" : "AM";
                              hours = hours % 12 || 12;
                              return `${day}/${month}/${year} - ${hours}:${minutes} ${ampm}`;
                            })()
                          : "Never"}
                      </td>
                      <td
                        className="actions"
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        {u.role !== "admin" && (
                          <>
                            <button
                              onClick={() => handleOpenPasswordModal(u)}
                              className="action-btn edit-btn"
                              title="Change Password"
                            >
                              <UserRoundPen size={20} />
                            </button>
                            <DeleteButton
                              onClick={() =>
                                handleOpenDeleteModal(u._id, u.employeeId)
                              }
                            />
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD EMPLOYEE MODAL */}
      {showCreateModal && (
        <div className="overlay-blur" onClick={() => setShowCreateModal(false)}>
          <div
            className="modal-content-box modal-content-box--form"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <h3 className="modal-title">Add New Employee</h3>
                <p className="modal-subtitle">
                  Create a login for a shop-floor or department user.
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="emp-form-content">
              <div className="form-row form-row--three">
                <div className="input-block">
                  <label htmlFor="employeeId">Employee ID *</label>
                  <input
                    id="employeeId"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="input-block">
                  <label htmlFor="department">Department *</label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Select --</option>
                    {departments
                      .filter((d) => d !== "Admin")
                      .map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="input-block">
                  <label htmlFor="name">Name *</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row form-row--two">
                <div className="input-block">
                  <label htmlFor="password">Password *</label>
                  <div className="pwd-field">
                    <input
                      id="password"
                      type={showCreatePassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength={PASSWORD_MIN_LENGTH}
                    />
                    <button
                      type="button"
                      className="pwd-field-toggle"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      aria-label={
                        showCreatePassword ? "Hide password" : "Show password"
                      }
                    >
                      {showCreatePassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="input-block">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <div className="pwd-field">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      minLength={PASSWORD_MIN_LENGTH}
                      className={
                        formData.confirmPassword &&
                        formData.confirmPassword !== formData.password
                          ? "pwd-mismatch"
                          : ""
                      }
                    />
                    <button
                      type="button"
                      className="pwd-field-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword &&
                    formData.confirmPassword !== formData.password && (
                      <span className="pwd-mismatch-hint">
                        Passwords do not match
                      </span>
                    )}
                </div>
              </div>

              {formError && (
                <div className="status-msg error-bg">{formError}</div>
              )}

              <div className="emp-form-footer">
                <PasswordStrengthMeter password={formData.password} />
                <div className="emp-form-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowCreateModal(false)}
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btn-main"
                    disabled={formLoading}
                  >
                    {formLoading ? "Creating..." : "Create Employee"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD MODAL */}
      {showPasswordModal && selectedUser && (
        <div
          className="overlay-blur"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="modal-content-box modal-content-box--password"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <h3 className="modal-title">Change Password</h3>
                <p className="modal-subtitle">
                  Update password for <strong>{selectedUser.employeeId}</strong>
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowPasswordModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="emp-form-content">
              <div className="form-row form-row--two">
                <div className="input-block">
                  <label htmlFor="newPassword">New Password *</label>
                  <div className="pwd-field">
                    <input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError("");
                      }}
                      required
                      minLength={PASSWORD_MIN_LENGTH}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="pwd-field-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={
                        showNewPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="input-block">
                  <label htmlFor="confirmNewPassword">
                    Confirm New Password *
                  </label>
                  <div className="pwd-field">
                    <input
                      id="confirmNewPassword"
                      type={showConfirmNewPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        setPasswordError("");
                      }}
                      required
                      minLength={PASSWORD_MIN_LENGTH}
                      placeholder="Re-enter new password"
                      className={
                        confirmNewPassword && confirmNewPassword !== newPassword
                          ? "pwd-mismatch"
                          : ""
                      }
                    />
                    <button
                      type="button"
                      className="pwd-field-toggle"
                      onClick={() =>
                        setShowConfirmNewPassword(!showConfirmNewPassword)
                      }
                      aria-label={
                        showConfirmNewPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  {confirmNewPassword && confirmNewPassword !== newPassword && (
                    <span className="pwd-mismatch-hint">
                      Passwords do not match
                    </span>
                  )}
                </div>
              </div>

              {passwordError && (
                <div className="modal-error">{passwordError}</div>
              )}

              <div className="emp-form-footer">
                <PasswordStrengthMeter password={newPassword} />
                <div className="emp-form-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowPasswordModal(false)}
                    disabled={passwordLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="btn-save"
                  >
                    {passwordLoading ? "Updating..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && userToDelete && (
        <div className="overlay-blur" onClick={() => setShowDeleteModal(false)}>
          <div
            className="modal-content-box"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">Delete Employee</h2>
            <p className="modal-subtitle">
              Are you sure you want to delete{" "}
              <strong>{userToDelete.employeeId}</strong>?
            </p>
            <div className="modal-btns">
              <button
                onClick={handleConfirmDelete}
                className="btn-delete"
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETING ALERT */}
      {isDeleting && <DeletingStatus />}

      {/* CREATING EMPLOYEE ALERT */}
      {isCreating && <CreatingEmployeeStatus />}
    </div>
  );
};

export default AdminDashboard;
