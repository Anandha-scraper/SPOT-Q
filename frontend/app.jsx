import React, { createContext, useContext, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Context & Layout
import { AuthContext } from './src/context/AuthContext';
import Sidebar from './src/Components/sidebar';
import Dashboard from './src/Components/Dashboard';
import DepartmentRouteGuard from './src/Components/DepartmentRouteGuard';
import Loader from './src/Components/Loader';

// Pages
import Login from './src/pages/Login';
import UserProfile from './src/Components/UserProfile';
import AdminDashboard from './src/Components/AdminDashboard';

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
import DisamaticProduct from './src/pages/Moulding/DisamaticProduct';
import DisamaticProductReport from './src/pages/Moulding/DisamaticProductReport';
import DmmSettingParameters from './src/pages/Moulding/DmmSettingParameters';
import DmmSettingParametersReport from './src/pages/Moulding/DmmSettingParametersReport';
import Impact from './src/pages/Impact/Impact';
import ImpactReport from './src/pages/Impact/ImpactReport';

// ====================== Helper Functions ======================
const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// ====================== Impact Context ======================
const ImpactContext = createContext();

const initialImpactFormData = {
  date: getCurrentDate(),
  partName: '',
  dateCode: '',
  specification: '',
  observedValue: '',
  remarks: ''
};

const initialImpactValidation = {
  date: null,
  partName: null,
  dateCode: null,
  specification: null,
  observedValue: null,
  remarks: null
};

export const ImpactProvider = ({ children }) => {
  const [formData, setFormData] = useState(initialImpactFormData);
  const [validationStates, setValidationStates] = useState(initialImpactValidation);
  const [submitErrorMessage, setSubmitErrorMessage] = useState('');

  const setValidation = (field, value) => {
    setValidationStates(prev => ({ ...prev, [field]: value }));
  };

  const resetValidation = () => {
    setValidationStates(initialImpactValidation);
  };

  const resetFormData = () => {
    setFormData(initialImpactFormData);
    resetValidation();
    setSubmitErrorMessage('');
  };

  return (
    <ImpactContext.Provider value={{
      formData,
      setFormData,
      validationStates,
      setValidation,
      resetValidation,
      submitErrorMessage,
      setSubmitErrorMessage,
      resetFormData
    }}>
      {children}
    </ImpactContext.Provider>
  );
};

export const useImpactContext = () => useContext(ImpactContext);

// ====================== Process Context ======================
const ProcessContext = createContext();

const initialProcessFormData = {
  date: getCurrentDate(),
  disa: '',
  partName: '',
  datecode: '',
  heatcode: '',
  quantityOfMoulds: '',
  metalCompositionC: '',
  metalCompositionSi: '',
  metalCompositionMn: '',
  metalCompositionP: '',
  metalCompositionS: '',
  metalCompositionMgFL: '',
  metalCompositionCu: '',
  metalCompositionCr: '',
  pouringTemperatureMin: '',
  pouringTemperatureMax: '',
  ppCode: '',
  treatmentNo: '',
  fcNo: '',
  heatNo: '',
  conNo: '',
  correctiveAdditionC: '',
  correctiveAdditionSi: '',
  correctiveAdditionMn: '',
  correctiveAdditionS: '',
  correctiveAdditionCr: '',
  correctiveAdditionCu: '',
  correctiveAdditionSn: '',
  tappingWt: '',
  mg: '',
  resMgConvertor: '',
  recOfMg: '',
  streamInoculant: '',
  pTime: '',
  remarks: ''
};

export const ProcessProvider = ({ children }) => {
  const [formData, setFormData] = useState(initialProcessFormData);
  const [pouringFromTime, setPouringFromTime] = useState({ hours: '', minutes: '' });
  const [pouringToTime, setPouringToTime] = useState({ hours: '', minutes: '' });
  const [tappingTime, setTappingTime] = useState({ hours: '', minutes: '' });
  const [isPrimarySaved, setIsPrimarySaved] = useState(false);
  const [entryCount, setEntryCount] = useState(0);

  return (
    <ProcessContext.Provider value={{
      formData,
      setFormData,
      pouringFromTime,
      setPouringFromTime,
      pouringToTime,
      setPouringToTime,
      tappingTime,
      setTappingTime,
      isPrimarySaved,
      setIsPrimarySaved,
      entryCount,
      setEntryCount
    }}>
      {children}
    </ProcessContext.Provider>
  );
};

export const useProcessContext = () => useContext(ProcessContext);

// ====================== QcProduction Context ======================
const QcProductionContext = createContext();

const initialQcProductionFormData = {
  date: '',
  partName: '',
  noOfMoulds: '',
  cPercentMin: '',
  cPercentMax: '',
  siPercentMin: '',
  siPercentMax: '',
  mnPercentMin: '',
  mnPercentMax: '',
  pPercentMin: '',
  pPercentMax: '',
  sPercentMin: '',
  sPercentMax: '',
  mgPercentMin: '',
  mgPercentMax: '',
  cuPercentMin: '',
  cuPercentMax: '',
  crPercentMin: '',
  crPercentMax: '',
  nodularity: '',
  noduleCount: '',
  graphiteTypeMin: '',
  graphiteTypeMax: '',
  pearlite: '',
  ferrite: '',
  hardnessBHNMin: '',
  hardnessBHNMax: '',
  tsValues: [{ value: '' }],
  ysValues: [{ min: '', max: '' }],
  elValues: [{ min: '', max: '' }]
};

const initialQcProductionValidation = {
  date: null,
  partName: null,
  noOfMoulds: null,
  cPercentMin: null,
  cPercentMax: null,
  siPercentMin: null,
  siPercentMax: null,
  mnPercentMin: null,
  mnPercentMax: null,
  pPercentMin: null,
  pPercentMax: null,
  sPercentMin: null,
  sPercentMax: null,
  mgPercentMin: null,
  mgPercentMax: null,
  cuPercentMin: null,
  cuPercentMax: null,
  crPercentMin: null,
  crPercentMax: null,
  nodularity: null,
  noduleCount: null,
  graphiteTypeMin: null,
  graphiteTypeMax: null,
  pearlite: null,
  ferrite: null,
  hardnessBHNMin: null,
  hardnessBHNMax: null,
  tsValues: null,
  ysValues: null,
  elValues: null
};

export const QcProductionProvider = ({ children }) => {
  const [formData, setFormData] = useState(initialQcProductionFormData);
  const [validationStates, setValidationStates] = useState(initialQcProductionValidation);
  const [submitErrorMessage, setSubmitErrorMessage] = useState('');

  const setValidation = (field, value) => {
    setValidationStates(prev => ({ ...prev, [field]: value }));
  };

  const resetValidation = () => {
    setValidationStates(initialQcProductionValidation);
  };

  const resetFormData = () => {
    setFormData(initialQcProductionFormData);
    resetValidation();
    setSubmitErrorMessage('');
  };

  return (
    <QcProductionContext.Provider value={{
      formData,
      setFormData,
      validationStates,
      setValidation,
      resetValidation,
      submitErrorMessage,
      setSubmitErrorMessage,
      resetFormData
    }}>
      {children}
    </QcProductionContext.Provider>
  );
};

export const useQcProductionContext = () => useContext(QcProductionContext);

// ====================== MicroStructure Context ======================
const MicroStructureContext = createContext();

const initialMicroStructureFormData = {
  date: '',
  disa: '',
  partName: '',
  dateCode: '',
  heatCode: '',
  nodularity: '',
  graphiteType: '',
  countMin: '',
  countMax: '',
  sizeMin: '',
  sizeMax: '',
  ferriteMin: '',
  ferriteMax: '',
  pearliteMin: '',
  pearliteMax: '',
  carbideMin: '',
  carbideMax: '',
  remarks: ''
};

const initialMicroStructureValidation = {
  date: null,
  disa: null,
  partName: null,
  dateCode: null,
  heatCode: null,
  nodularity: null,
  graphiteType: null,
  countMin: null,
  countMax: null,
  sizeMin: null,
  sizeMax: null,
  ferriteMin: null,
  ferriteMax: null,
  pearliteMin: null,
  pearliteMax: null,
  carbideMin: null,
  carbideMax: null,
  remarks: null
};

export const MicroStructureProvider = ({ children }) => {
  const [formData, setFormData] = useState(initialMicroStructureFormData);
  const [validationStates, setValidationStates] = useState(initialMicroStructureValidation);
  const [submitErrorMessage, setSubmitErrorMessage] = useState('');
  const [isPrimarySaved, setIsPrimarySaved] = useState(false);
  const [entryCount, setEntryCount] = useState(0);

  const setValidation = (field, value) => {
    setValidationStates(prev => ({ ...prev, [field]: value }));
  };

  const resetValidation = () => {
    setValidationStates(initialMicroStructureValidation);
  };

  const resetFormData = () => {
    setFormData(initialMicroStructureFormData);
    resetValidation();
    setSubmitErrorMessage('');
  };

  return (
    <MicroStructureContext.Provider value={{
      formData,
      setFormData,
      validationStates,
      setValidation,
      resetValidation,
      submitErrorMessage,
      setSubmitErrorMessage,
      resetFormData,
      isPrimarySaved,
      setIsPrimarySaved,
      entryCount,
      setEntryCount
    }}>
      {children}
    </MicroStructureContext.Provider>
  );
};

export const useMicroStructureContext = () => useContext(MicroStructureContext);

// ====================== App Components ======================

const DepartmentRedirect = () => {
  const { user, isAdmin } = useContext(AuthContext);

  const routeMap = useMemo(() => ({
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
  }), []);

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
    return null;
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

          {/* Departments */}
          <Route path="micro-tensile">
             <Route index element={<DepartmentRouteGuard><MicroTensile /></DepartmentRouteGuard>} />
             <Route path="report" element={<DepartmentRouteGuard><MicroTensileReport /></DepartmentRouteGuard>} />
          </Route>

          <Route path="micro-structure" element={<MicroStructureProvider><Outlet /></MicroStructureProvider>}>
             <Route index element={<DepartmentRouteGuard><MicroStructure /></DepartmentRouteGuard>} />
             <Route path="report" element={<DepartmentRouteGuard><MicroStructureReport /></DepartmentRouteGuard>} />
          </Route>

          <Route path="impact" element={<ImpactProvider><Outlet /></ImpactProvider>}>
             <Route index element={<DepartmentRouteGuard><Impact /></DepartmentRouteGuard>} />
             <Route path="report" element={<DepartmentRouteGuard><ImpactReport /></DepartmentRouteGuard>} />
          </Route>

          <Route path="process" element={<ProcessProvider><Outlet /></ProcessProvider>}>
             <Route index element={<DepartmentRouteGuard><Process /></DepartmentRouteGuard>} />
             <Route path="report" element={<DepartmentRouteGuard><ProcessReport /></DepartmentRouteGuard>} />
          </Route>

          <Route path="qc-production-details" element={<QcProductionProvider><Outlet /></QcProductionProvider>}>
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
          </Route>

          <Route path="moulding">
             <Route path="disamatic-product" element={<DepartmentRouteGuard><DisamaticProduct /></DepartmentRouteGuard>} />
             <Route path="disamatic-product/report" element={<DepartmentRouteGuard><DisamaticProductReport /></DepartmentRouteGuard>} />
             <Route path="dmm-setting-parameters" element={<DepartmentRouteGuard><DmmSettingParameters /></DepartmentRouteGuard>} />
             <Route path="dmm-setting-parameters/report" element={<DepartmentRouteGuard><DmmSettingParametersReport /></DepartmentRouteGuard>} />
          </Route>

          <Route path="user-profile" element={<UserProfile />} />
        </Route>

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
