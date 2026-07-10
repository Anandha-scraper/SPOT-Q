import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { departmentFormConfig } from './departmentFormConfig';

// A single generic context that holds one independent draft "slice" per department.
// Each slice = { formData, validationStates, submitErrorMessage, meta }.
//
// Pages consume a slice via useDepartmentForm('<dept>'), which returns the same
// property names the old per-department contexts exposed, so page bodies are unchanged.
//
// Drafts persist for the whole authenticated session (the provider is mounted once,
// above <Routes>, so it survives navigation) and are cleared on logout / session
// teardown (user -> null) and on hard refresh (in-memory state).

const DepartmentContext = createContext(null);

// Build a fresh slice for one department from its config. structuredClone keeps the
// (possibly nested — e.g. QcProduction arrays) initial values isolated per slice so
// one department can never mutate another's defaults.
const createSlice = (deptKey) => {
  const cfg = departmentFormConfig[deptKey];
  return {
    formData: structuredClone(cfg.initialFormData),
    validationStates: structuredClone(cfg.initialValidation || {}),
    submitErrorMessage: '',
    meta: structuredClone(cfg.initialMeta || {})
  };
};

const buildInitialState = () => {
  const state = {};
  for (const key of Object.keys(departmentFormConfig)) {
    state[key] = createSlice(key);
  }
  return state;
};

export const DepartmentProvider = ({ children }) => {
  const { user } = useAuth();
  const [slices, setSlices] = useState(buildInitialState);

  // Reset every draft when the session ends. logout / clearSession (expiry) / verify
  // failure all funnel through setUser(null), so watching `user` covers all paths.
  useEffect(() => {
    if (!user) {
      setSlices(buildInitialState());
    }
  }, [user]);

  const value = useMemo(() => ({ slices, setSlices }), [slices]);

  return (
    <DepartmentContext.Provider value={value}>
      {children}
    </DepartmentContext.Provider>
  );
};

export const useDepartmentForm = (deptKey) => {
  const ctx = useContext(DepartmentContext);
  if (!ctx) {
    throw new Error('useDepartmentForm must be used within a DepartmentProvider');
  }
  const cfg = departmentFormConfig[deptKey];
  if (!cfg) {
    throw new Error(`useDepartmentForm: unknown department "${deptKey}"`);
  }

  const { slices, setSlices } = ctx;
  const slice = slices[deptKey];

  const setFormData = useCallback((update) => {
    setSlices(prev => {
      const cur = prev[deptKey];
      const next = typeof update === 'function' ? update(cur.formData) : update;
      return { ...prev, [deptKey]: { ...cur, formData: next } };
    });
  }, [setSlices, deptKey]);

  const setValidation = useCallback((field, value) => {
    setSlices(prev => {
      const cur = prev[deptKey];
      return { ...prev, [deptKey]: { ...cur, validationStates: { ...cur.validationStates, [field]: value } } };
    });
  }, [setSlices, deptKey]);

  const resetValidation = useCallback(() => {
    setSlices(prev => {
      const cur = prev[deptKey];
      return { ...prev, [deptKey]: { ...cur, validationStates: structuredClone(cfg.initialValidation || {}) } };
    });
  }, [setSlices, deptKey, cfg]);

  const setSubmitErrorMessage = useCallback((update) => {
    setSlices(prev => {
      const cur = prev[deptKey];
      const next = typeof update === 'function' ? update(cur.submitErrorMessage) : update;
      return { ...prev, [deptKey]: { ...cur, submitErrorMessage: next } };
    });
  }, [setSlices, deptKey]);

  const resetFormData = useCallback(() => {
    setSlices(prev => ({ ...prev, [deptKey]: createSlice(deptKey) }));
  }, [setSlices, deptKey]);

  // Department-specific extras (meta), surfaced under their existing names so call
  // sites are unchanged, e.g. isPrimarySaved / setIsPrimarySaved, entryCount /
  // setEntryCount, pouringFromTime / setPouringFromTime. Setters accept a value or a
  // functional updater (like setEntryCount(prev => prev + 1)).
  const metaKeys = useMemo(() => Object.keys(cfg.initialMeta || {}), [cfg]);

  const metaApi = useMemo(() => {
    const api = {};
    for (const key of metaKeys) {
      api[key] = slice.meta[key];
      const setterName = `set${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      api[setterName] = (update) => {
        setSlices(prev => {
          const cur = prev[deptKey];
          const nextVal = typeof update === 'function' ? update(cur.meta[key]) : update;
          return { ...prev, [deptKey]: { ...cur, meta: { ...cur.meta, [key]: nextVal } } };
        });
      };
    }
    return api;
  }, [metaKeys, slice.meta, setSlices, deptKey]);

  return useMemo(() => ({
    formData: slice.formData,
    setFormData,
    validationStates: slice.validationStates,
    setValidation,
    resetValidation,
    submitErrorMessage: slice.submitErrorMessage,
    setSubmitErrorMessage,
    resetFormData,
    ...metaApi
  }), [
    slice.formData,
    slice.validationStates,
    slice.submitErrorMessage,
    setFormData,
    setValidation,
    resetValidation,
    setSubmitErrorMessage,
    resetFormData,
    metaApi
  ]);
};
