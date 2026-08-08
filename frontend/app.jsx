import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
// Context & Layout
import { AuthContext } from './src/context/AuthContext';
import Sidebar from './src/Components/sidebar';
import Dashboard from './src/Components/Dashboard';
import DepartmentRouteGuard from './src/Components/DepartmentRouteGuard';
import Loader from './src/Components/Loader';

// Generic per-department draft state (persists across Form <-> Report navigation)
import { DepartmentProvider } from './src/context/DepartmentContext';

// Pages
import Login from './src/pages/Login';
import UserProfile from './src/Components/UserProfile';
import AdminDashboard from './src/Components/AdminDashboard';
import DownloadLogsReport from './src/pages/Admin/DownloadLogsReport';
import DownloadLogsMine from './src/pages/DownloadLogsMine';

// Feature Pages
import MicroTensile from './src/pages/MicroTensile/MicroTensile';
import MicroTensileReport from './src/pages/MicroTensile/MicroTensileReport';
import MicroStructure from './src/pages/Microstructure/MicroStructure';
import MicroStructureReport from './src/pages/Microstructure/MicroStructureReport';
import QcProductionDetails from './src/pages/QcProduction/QcProductionDetails';
import QcProductionDetailsReport from './src/pages/QcProduction/QcProductionDetailsReport';
import Process from './src/pages/Process/Process';
import ProcessReport from './src/pages/Process/ProcessReport';
import MeltingLogSheet from './src/pages/Melting/MeltingLogSheet';
import MeltingLogSheetReport from './src/pages/Melting/MeltingLogSheetReport';
import CupolaHolderLogSheet from './src/pages/Melting/CupolaHolderLogSheet';
import CupolaHolderLogSheetReport from './src/pages/Melting/CupolaHolderLogSheetReport';
import Tensile from './src/pages/Tensile/Tensile';
import TensileReport from './src/pages/Tensile/TensileReport';
import SandTestingRecord from './src/pages/SandLab/SandTestingRecord';
import SandTestingRecordReport from './src/pages/SandLab/SandTestingRecordReport';
import FoundarySandTestingNote from './src/pages/SandLab/FoundarySandTestingNote';
import FoundrySandTestingReport from './src/pages/SandLab/FoundrySandTestingReport';
import ReturnSandFoundrySandTestingNote from './src/pages/SandLab/ReturnSandFoundrySandTestingNote';
import ReturnSandFoundrySandTestingNoteReport from './src/pages/SandLab/ReturnSandFoundrySandTestingNoteReport';
import DisamaticProduct from './src/pages/Moulding/DisamaticProduct';
import DisamaticProductReport from './src/pages/Moulding/DisamaticProductReport';
import DmmSettingParameters from './src/pages/Moulding/DmmSettingParameters';
import DmmSettingParametersReport from './src/pages/Moulding/DmmSettingParametersReport';
import Impact from './src/pages/Impact/Impact';
import ImpactReport from './src/pages/Impact/ImpactReport';

// ====================== Route Map (static — defined outside component) ======================
const routeMap = {
  'Admin': '/admin',
  'Tensile': '/tensile',
  'Impact': '/impact',
  'Micro Tensile': '/micro-tensile',
  'Micro Structure': '/micro-structure',
  'QC - production': '/qc-production-details',
  'Process': '/process',
  'Melting': '/melting/melting-log-sheet',
  'Moulding': '/moulding/disamatic-product',
  'Sand Lab': '/sand-lab/sand-testing-record',
  'All': '/admin'
};

// ====================== App Components ======================

const DepartmentRedirect = () => {
  const { user, isAdmin } = useContext(AuthContext);
  if (isAdmin) return <Navigate to="/admin" replace />;
  const targetRoute = routeMap[user?.department] || '/micro-tensile';
  return <Navigate to={targetRoute} replace />;
};

const ProtectedLayout = () => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Sidebar />
      <Dashboard>
        <Outlet />
      </Dashboard>
    </>
  );
};

const App = () => {
  const { user, loading, logoutLoading, initializing } = useContext(AuthContext);

  // Block rendering until the backend session has been verified on startup,
  // so protected pages never flash from stale localStorage.
  if (loading || initializing) {
    return (
      <div className="logout-loader-overlay">
        <Loader />
      </div>
    );
  }

  if (logoutLoading) {
    return (
      <div className="logout-loader-overlay">
        <Loader />
      </div>
    );
  }
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <DepartmentProvider>
      <Routes>

        {/* Public Routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />

        {/* Private Routes */}
        <Route path="/" element={<ProtectedLayout />}>
          <Route index element={<DepartmentRedirect />} />

          {/* Admin Route */}
          <Route path="admin" element={
            <DepartmentRouteGuard>
              <AdminDashboard />
            </DepartmentRouteGuard>
          } />

          {/* Admin — Download Logs full report (guarded again inside the page itself) */}
          <Route path="admin/download-logs" element={
            <DepartmentRouteGuard>
              <DownloadLogsReport />
            </DepartmentRouteGuard>
          } />

          {/* Departments */}
          <Route path="micro-tensile">
             <Route index element={<DepartmentRouteGuard><MicroTensile /></DepartmentRouteGuard>} />
             <Route path="report" element={<DepartmentRouteGuard><MicroTensileReport /></DepartmentRouteGuard>} />
          </Route>

          <Route path="micro-structure">
             <Route index element={<DepartmentRouteGuard><MicroStructure /></DepartmentRouteGuard>} />
             <Route path="report" element={<DepartmentRouteGuard><MicroStructureReport /></DepartmentRouteGuard>} />
          </Route>

          <Route path="impact">
             <Route index element={<DepartmentRouteGuard><Impact /></DepartmentRouteGuard>} />
             <Route path="report" element={<DepartmentRouteGuard><ImpactReport /></DepartmentRouteGuard>} />
          </Route>

          <Route path="process">
             <Route index element={<DepartmentRouteGuard><Process /></DepartmentRouteGuard>} />
             <Route path="report" element={<DepartmentRouteGuard><ProcessReport /></DepartmentRouteGuard>} />
          </Route>

          <Route path="qc-production-details">
             <Route index element={<DepartmentRouteGuard><QcProductionDetails /></DepartmentRouteGuard>} />
             <Route path="report" element={<DepartmentRouteGuard><QcProductionDetailsReport /></DepartmentRouteGuard>} />
          </Route>

          <Route path="melting">
             <Route path="melting-log-sheet" element={<DepartmentRouteGuard><MeltingLogSheet /></DepartmentRouteGuard>} />
             <Route path="melting-log-sheet/report" element={<DepartmentRouteGuard><MeltingLogSheetReport /></DepartmentRouteGuard>} />
             <Route path="cupola-holder-log-sheet" element={<DepartmentRouteGuard><CupolaHolderLogSheet /></DepartmentRouteGuard>} />
             <Route path="cupola-holder-log-sheet/report" element={<DepartmentRouteGuard><CupolaHolderLogSheetReport /></DepartmentRouteGuard>} />
          </Route>

          <Route path="tensile">
             <Route index element={<DepartmentRouteGuard><Tensile /></DepartmentRouteGuard>} />
             <Route path="report" element={<DepartmentRouteGuard><TensileReport /></DepartmentRouteGuard>} />
          </Route>

          <Route path="sand-lab">
             <Route path="sand-testing-record" element={<DepartmentRouteGuard><SandTestingRecord /></DepartmentRouteGuard>} />
             <Route path="sand-testing-record/report" element={<DepartmentRouteGuard><SandTestingRecordReport /></DepartmentRouteGuard>} />
             <Route path="foundry-sand-testing-note" element={<DepartmentRouteGuard><FoundarySandTestingNote /></DepartmentRouteGuard>} />
             <Route path="foundry-sand-testing-note/report" element={<DepartmentRouteGuard><FoundrySandTestingReport /></DepartmentRouteGuard>} />
             <Route path="return-sand-foundry-sand-testing-note" element={<DepartmentRouteGuard><ReturnSandFoundrySandTestingNote /></DepartmentRouteGuard>} />
             <Route path="return-sand-foundry-sand-testing-note/report" element={<DepartmentRouteGuard><ReturnSandFoundrySandTestingNoteReport /></DepartmentRouteGuard>} />
          </Route>

          <Route path="moulding">
             <Route path="disamatic-product" element={<DepartmentRouteGuard><DisamaticProduct /></DepartmentRouteGuard>} />
             <Route path="disamatic-product/report" element={<DepartmentRouteGuard><DisamaticProductReport /></DepartmentRouteGuard>} />
             <Route path="dmm-setting-parameters" element={<DepartmentRouteGuard><DmmSettingParameters /></DepartmentRouteGuard>} />
             <Route path="dmm-setting-parameters/report" element={<DepartmentRouteGuard><DmmSettingParametersReport /></DepartmentRouteGuard>} />
          </Route>

          <Route path="user-profile" element={<UserProfile />} />
          <Route path="user-profile/download-logs" element={<DownloadLogsMine />} />
        </Route>

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
      </DepartmentProvider>
    </BrowserRouter>
  );
};

export default App;
