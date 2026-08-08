
import React, { useState, useRef, useEffect } from 'react';
import { Loader2, FileText } from 'lucide-react';
import { SubmitButton, LockPrimaryButton, DisaDropdown, CustomTimeInput, Time } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { InlineLoader } from '../../Components/InlineLoader';
import { useToast } from '../../Components/alert';
import { InfoIcon, InfoCard, useInfoModal } from '../../Components/Info';
import { API_ENDPOINTS } from '../../config/api';
import { useArrowNavigation } from '../../utils/arrowNavigation';
import { usePrimaryLock, PRIMARY_STATUS } from '../../utils/primaryLock';
import { runValidation, getRequiredFields, RequiredMark, MESSAGE_REQUIRED, MESSAGE_FORMAT } from '../../utils/formValidation';
import { buildSubmitError, FALLBACK_SUBMIT_ERROR } from '../../utils/submitError';
import { useDepartmentForm } from '../../context/DepartmentContext';
import { validationRanges, fieldMapping } from '../../deviations/Dprocess';
import ComponentShowcase from './ComponentShowcase';
import '../../styles/PageStyles/Process/Process.css';

// Number in backend/models/Process.js — a '-' placeholder fails the cast.
// Every other optional Process field is String or Mixed and accepts '-'.
const NUMERIC_MODEL_FIELDS = new Set(['quantityOfMoulds']);

export default function ProcessControl() {
  const { isOpen, openModal, closeModal } = useInfoModal();
  const { toast } = useToast();

  const {
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
  } = useDepartmentForm('process');

  const inputRefs = useRef({});
  const primarySectionRef = useRef(null);
  const { containerRef: gridRef, handleArrowKeyDown } = useArrowNavigation();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showComponentShowcase, setShowComponentShowcase] = useState(false);

  const requiredFields = getRequiredFields(validationRanges, fieldMapping);
  const mark = (field) => (requiredFields.has(field) ? <RequiredMark /> : null);

  const [dateValid, setDateValid] = useState(null);
  const [disaValid, setDisaValid] = useState(null);
  const [partNameValid, setPartNameValid] = useState(null);
  const [datecodeValid, setDatecodeValid] = useState(null);
  const [heatcodeValid, setHeatcodeValid] = useState(null);
  const [quantityOfMouldsValid, setQuantityOfMouldsValid] = useState(null);
  const [qtyMouldsRangeValid, setQtyMouldsRangeValid] = useState(null);
  const [ppCodeValid, setPpCodeValid] = useState(null);
  const [treatmentNoValid, setTreatmentNoValid] = useState(null);
  const [fcNoValid, setFcNoValid] = useState(null);
  const [heatNoValid, setHeatNoValid] = useState(null);
  const [pouringTempValid, setPouringTempValid] = useState(null);
  const [pouringTimeValid, setPouringTimeValid] = useState(null)
  const [tappingWtValid, setTappingWtValid] = useState(null);
  const [streamInoculantValid, setStreamInoculantValid] = useState(null);
  const [remarksValid, setRemarksValid] = useState(null);

  const [metalCValid, setMetalCValid] = useState(null);
  const [metalSiValid, setMetalSiValid] = useState(null);
  const [metalMnValid, setMetalMnValid] = useState(null);
  const [metalPValid, setMetalPValid] = useState(null);
  const [metalSValid, setMetalSValid] = useState(null);
  const [metalMgFLValid, setMetalMgFLValid] = useState(null);
  const [metalCuValid, setMetalCuValid] = useState(null);
  const [metalCrValid, setMetalCrValid] = useState(null);

  const [corrCValid, setCorrCValid] = useState(null);
  const [corrSiValid, setCorrSiValid] = useState(null);
  const [corrMnValid, setCorrMnValid] = useState(null);
  const [corrSValid, setCorrSValid] = useState(null);
  const [corrCrValid, setCorrCrValid] = useState(null);
  const [corrCuValid, setCorrCuValid] = useState(null);
  const [corrSnValid, setCorrSnValid] = useState(null);

  const [conNoValid, setConNoValid] = useState(null);
  const [tappingTimeValid, setTappingTimeValid] = useState(null);
  const [mgValid, setMgValid] = useState(null);
  const [resMgConvertorValid, setResMgConvertorValid] = useState(null);
  const [recOfMgValid, setRecOfMgValid] = useState(null);
  const [pTimeValid, setPTimeValid] = useState(null);

  const [submitErrorMessage, setSubmitErrorMessage] = useState('');

  const [partNameSuggestions, setPartNameSuggestions] = useState([]);
  const [showPartNameDropdown, setShowPartNameDropdown] = useState(false);
  const [filteredPartNames, setFilteredPartNames] = useState([]);
  const partNameDropdownRef = useRef(null);

  const validationSetters = {
    'date': setDateValid,
    'disa': setDisaValid,
    'partName': setPartNameValid,
    'datecode': setDatecodeValid,
    'heatcode': setHeatcodeValid,
    'quantityOfMoulds': setQuantityOfMouldsValid,
    'metalCompositionC': setMetalCValid,
    'metalCompositionSi': setMetalSiValid,
    'metalCompositionMn': setMetalMnValid,
    'metalCompositionP': setMetalPValid,
    'metalCompositionS': setMetalSValid,
    'metalCompositionMgFL': setMetalMgFLValid,
    'metalCompositionCu': setMetalCuValid,
    'metalCompositionCr': setMetalCrValid,
    'ppCode': setPpCodeValid,
    'treatmentNo': setTreatmentNoValid,
    'fcNo': setFcNoValid,
    'heatNo': setHeatNoValid,
    'conNo': setConNoValid,
    'correctiveAdditionC': setCorrCValid,
    'correctiveAdditionSi': setCorrSiValid,
    'correctiveAdditionMn': setCorrMnValid,
    'correctiveAdditionS': setCorrSValid,
    'correctiveAdditionCr': setCorrCrValid,
    'correctiveAdditionCu': setCorrCuValid,
    'correctiveAdditionSn': setCorrSnValid,
    'tappingWt': setTappingWtValid,
    'mg': setMgValid,
    'resMgConvertor': setResMgConvertorValid,
    'recOfMg': setRecOfMgValid,
    'streamInoculant': setStreamInoculantValid,
    'pTime': setPTimeValid,
    'remarks': setRemarksValid
  };

  const getInputClassName = (fieldName, validationState) => {
    if (validationState === false) return 'invalid-input';
    return '';
  };

  // Date + DISA must be saved before the entry fields unlock.
  const { status, highlightPrimaryFields, savePrimary } = usePrimaryLock({
    endpoint: API_ENDPOINTS.process,
    date: formData.date,
    disa: formData.disa,
    isPrimarySaved,
    setIsPrimarySaved,
    setEntryCount,
    primarySectionRef,
    formGroupClass: 'process-form-group',
    onSaved: () => {
      toast.success('Primary saved');
      setTimeout(() => inputRefs.current.partName?.focus(), 100);
    }
  });

  const primaryBusy = status === 'checking' || status === 'saving' || status === 'found' || status === 'added';
  const statusInfo = PRIMARY_STATUS[status];


  useEffect(() => {
    if (!formData.date) {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');

      setFormData(prev => ({
        ...prev,
        date: `${y}-${m}-${d}`
      }));
    }
  }, []);

  useEffect(() => {
    const fetchPartNames = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.process}/part-names`, {
          method: 'GET',
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
          setPartNameSuggestions(data.data);
        }
      } catch (error) {
      }
    };
    fetchPartNames();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (partNameDropdownRef.current && !partNameDropdownRef.current.contains(event.target)) {
        setShowPartNameDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  useEffect(() => {
    setPouringTimeValid(null);
    setSubmitErrorMessage('');
  }, [pouringFromTime, pouringToTime]);

  useEffect(() => {
    if (tappingTime) {
      setTappingTimeValid(null);
    } else {
      setTappingTimeValid(null);
    }
  }, [tappingTime]);


  const fieldOrder = ['date', 'disa', 'partName', 'datecode', 'heatcode', 'quantityOfMouldsFrom', 'quantityOfMouldsTo', 'metalCompositionC', 'metalCompositionSi',
    'metalCompositionMn', 'metalCompositionP', 'metalCompositionS', 'metalCompositionMgFL', 'metalCompositionCu',
    'metalCompositionCr', 'pouringTemperatureMin', 'pouringTemperatureMax', 'ppCode', 'treatmentNo', 'fcNo', 'heatNo', 'conNo', 'tappingTime',
    'correctiveAdditionC', 'correctiveAdditionSi', 'correctiveAdditionMn', 'correctiveAdditionS',
    'correctiveAdditionCr', 'correctiveAdditionCu', 'correctiveAdditionSn', 'tappingWt', 'mg', 'resMgConvertor',
    'recOfMg', 'streamInoculant', 'pTime', 'remarks'];

  const handleChange = (e) => {
    const { name, value } = e.target;

    switch (name) {
      case 'date':
      case 'disa':
        setIsPrimarySaved(false);

        setFormData(prev => ({
          date: name === 'date' ? value : prev.date,
          disa: name === 'disa' ? value : prev.disa,
          partName: '', datecode: '', heatcode: '', quantityOfMoulds: '',
          quantityOfMouldsFrom: '', quantityOfMouldsTo: '',
          metalCompositionC: '', metalCompositionSi: '', metalCompositionMn: '',
          metalCompositionP: '', metalCompositionS: '', metalCompositionMgFL: '',
          metalCompositionCr: '', metalCompositionCu: '',
          pouringTemperatureMin: '', pouringTemperatureMax: '', ppCode: '', treatmentNo: '', fcNo: '',
          heatNo: '', conNo: '', correctiveAdditionC: '', correctiveAdditionSi: '',
          correctiveAdditionMn: '', correctiveAdditionS: '', correctiveAdditionCr: '',
          correctiveAdditionCu: '', correctiveAdditionSn: '', tappingWt: '',
          mg: '', resMgConvertor: '', recOfMg: '', streamInoculant: '',
          pTime: '', remarks: ''
        }));

        setPouringFromTime(null);
        setPouringToTime(null);
        setTappingTime(null);

        setPartNameValid(null);
        setDatecodeValid(null);
        setHeatcodeValid(null);
        setQuantityOfMouldsValid(null);
        setQtyMouldsRangeValid(null);
        setMetalCValid(null);
        setMetalSiValid(null);
        setMetalMnValid(null);
        setMetalPValid(null);
        setMetalSValid(null);
        setMetalMgFLValid(null);
        setMetalCuValid(null);
        setMetalCrValid(null);
        setPouringTempValid(null);
        setPouringTimeValid(null);
        setPpCodeValid(null);
        setTreatmentNoValid(null);
        setFcNoValid(null);
        setHeatNoValid(null);
        setConNoValid(null);
        setCorrCValid(null);
        setCorrSiValid(null);
        setCorrMnValid(null);
        setCorrSValid(null);
        setCorrCrValid(null);
        setCorrCuValid(null);
        setCorrSnValid(null);
        setTappingWtValid(null);
        setTappingTimeValid(null);
        setMgValid(null);
        setResMgConvertorValid(null);
        setRecOfMgValid(null);
        setStreamInoculantValid(null);
        setPTimeValid(null);
        setRemarksValid(null);
        setSubmitErrorMessage('');
        return;
      case 'partName':
        setPartNameValid(null);
        break;
      case 'datecode':
        setDatecodeValid(null);
        break;
      case 'heatcode':
        setHeatcodeValid(null);
        break;
      case 'quantityOfMouldsFrom':
      case 'quantityOfMouldsTo':
        setQuantityOfMouldsValid(null);
        setQtyMouldsRangeValid(null);
        break;
      case 'metalCompositionC':
        setMetalCValid(null);
        break;
      case 'metalCompositionSi':
        setMetalSiValid(null);
        break;
      case 'metalCompositionMn':
        setMetalMnValid(null);
        break;
      case 'metalCompositionP':
        setMetalPValid(null);
        break;
      case 'metalCompositionS':
        setMetalSValid(null);
        break;
      case 'metalCompositionMgFL':
        setMetalMgFLValid(null);
        break;
      case 'metalCompositionCu':
        setMetalCuValid(null);
        break;
      case 'metalCompositionCr':
        setMetalCrValid(null);
        break;
      case 'pouringTemperatureMin':
      case 'pouringTemperatureMax':
        setPouringTempValid(null);
        break;
      case 'ppCode':
        setPpCodeValid(null);
        break;
      case 'treatmentNo':
        setTreatmentNoValid(null);
        break;
      case 'fcNo':
        setFcNoValid(null);
        break;
      case 'heatNo':
        setHeatNoValid(null);
        break;
      case 'conNo':
        setConNoValid(null);
        break;
      case 'correctiveAdditionC':
        setCorrCValid(null);
        break;
      case 'correctiveAdditionSi':
        setCorrSiValid(null);
        break;
      case 'correctiveAdditionMn':
        setCorrMnValid(null);
        break;
      case 'correctiveAdditionS':
        setCorrSValid(null);
        break;
      case 'correctiveAdditionCr':
        setCorrCrValid(null);
        break;
      case 'correctiveAdditionCu':
        setCorrCuValid(null);
        break;
      case 'correctiveAdditionSn':
        setCorrSnValid(null);
        break;
      case 'tappingWt':
        setTappingWtValid(null);
        break;
      case 'mg':
        setMgValid(null);
        break;
      case 'resMgConvertor':
        setResMgConvertorValid(null);
        break;
      case 'recOfMg':
        setRecOfMgValid(null);
        break;
      case 'streamInoculant':
        setStreamInoculantValid(null);
        break;
      case 'pTime':
        setPTimeValid(null);
        break;
      case 'remarks':
        setRemarksValid(null);
        break;
      default:
        break;
    }

    if (name === 'datecode') {
      setFormData({...formData, [name]: value.toUpperCase()});
      return;
    }

    if (name === 'quantityOfMouldsFrom' || name === 'quantityOfMouldsTo') {
      const nextFrom = name === 'quantityOfMouldsFrom' ? value : formData.quantityOfMouldsFrom;
      const nextTo = name === 'quantityOfMouldsTo' ? value : formData.quantityOfMouldsTo;
      const hasFrom = nextFrom !== '' && nextFrom != null;
      const hasTo = nextTo !== '' && nextTo != null;

      // From-To -> the difference; To alone -> To itself; From alone (no To)
      // is a validation error caught at submit, so the calculated box stays blank.
      let computedQty = '';
      if (hasFrom && hasTo) {
        computedQty = String(Number(nextTo) - Number(nextFrom));
      } else if (!hasFrom && hasTo) {
        computedQty = String(nextTo);
      }

      setFormData({ ...formData, [name]: value, quantityOfMoulds: computedQty });
      return;
    }

    if (name === 'partName') {
      const sanitizedValue = value.toUpperCase();
      setFormData({...formData, [name]: sanitizedValue});
      if (sanitizedValue) {
        const filtered = partNameSuggestions.filter(pn =>
          pn.toUpperCase().includes(sanitizedValue)
        ).slice(0, 2);
        setFilteredPartNames(filtered);
        setShowPartNameDropdown(filtered.length > 0);
      } else {
        setFilteredPartNames([]);
        setShowPartNameDropdown(false);
      }
      return;
    }

    if (name === 'ppCode' || name === 'treatmentNo') {
      const sanitizedValue = value.replace(/[^0-9]/g, '');
      setFormData({...formData, [name]: sanitizedValue});
      return;
    }

    setFormData({...formData, [name]: value});
  };

  const handleIntegerBlur = (fieldName) => {
    const value = formData[fieldName];
    if (value && value.length === 1) {
      setFormData(prev => ({...prev, [fieldName]: '0' + value}));
    }
  };

  const handlePartNameSelect = (partName) => {
    setFormData(prev => ({...prev, partName}));
    setShowPartNameDropdown(false);
    setPartNameValid(null);
    inputRefs.current.datecode?.focus();
  };

  const handlePartNameFocus = () => {
    if (formData.partName) {
      const filtered = partNameSuggestions.filter(pn =>
        pn.toUpperCase().includes(formData.partName.toUpperCase())
      ).slice(0, 2);
      setFilteredPartNames(filtered);
      setShowPartNameDropdown(filtered.length > 0);
    } else {
      setFilteredPartNames([]);
      setShowPartNameDropdown(false);
    }
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const idx = fieldOrder.indexOf(field);

      if (field === 'metalCompositionCr') {
        inputRefs.current.pouringFromTime?.focus();
        return;
      }

      if (field === 'conNo') {
        inputRefs.current.tappingTime?.focus();
        return;
      }

      if (field === 'remarks') {
        inputRefs.current.submitBtn?.focus();
      } else if (idx < fieldOrder.length - 1) {
        inputRefs.current[fieldOrder[idx + 1]]?.focus();
      }
    }
  };


  // Time of Pouring and Tapping Time live outside fieldMapping (they are
  // {hour, minute} objects, not formData strings), so they are checked here and
  // then folded into the shared required-wins result.
  const validateTimes = () => {
    const rule = validationRanges.find(r => r.field === 'Time of Pouring (Range)');
    if (!pouringFromTime || !pouringToTime) {
      if (rule?.required) return { missing: true };
      return {};
    }
    // Parses the declared "60min" into 60 rather than hardcoding it, so this
    // check always matches whatever Dprocess.js's rule.max actually says.
    const maxMinutes = parseInt(rule?.max, 10) || 60;
    const fromMinutes = pouringFromTime.hour * 60 + pouringFromTime.minute;
    const toMinutes = pouringToTime.hour * 60 + pouringToTime.minute;
    if (fromMinutes >= toMinutes) return { message: 'Time of Pouring: Start time must be less than end time' };
    if (toMinutes - fromMinutes > maxMinutes) return { message: `Time of Pouring: Maximum allowed difference is ${maxMinutes} minutes` };
    return {};
  };

  // Qty. Of Moulds lives outside fieldMapping as two UI-only boxes (From/To);
  // the generic min:0 rule already covers the computed value, but "From
  // entered, To blank" and "From greater than To" have no computed value to
  // validate against (the calculated box just stays blank/negative), so
  // they're checked here instead.
  const validateQtyMouldsRange = () => {
    const hasFrom = formData.quantityOfMouldsFrom !== '' && formData.quantityOfMouldsFrom != null;
    const hasTo = formData.quantityOfMouldsTo !== '' && formData.quantityOfMouldsTo != null;
    if (hasFrom && !hasTo) return { missing: true };
    if (hasFrom && hasTo && Number(formData.quantityOfMouldsFrom) > Number(formData.quantityOfMouldsTo)) {
      return { message: 'Qty. Of Moulds: From cannot be greater than To' };
    }
    return {};
  };

  const handleSubmit = async () => {
    setSubmitErrorMessage('');

    const time = validateTimes();
    const tappingRule = validationRanges.find(r => r.field === 'Tapping Time');
    const tappingMissing = Boolean(tappingRule?.required && !tappingTime);
    const qtyRange = validateQtyMouldsRange();

    setPouringTimeValid(time.missing || time.message ? false : null);
    setTappingTimeValid(tappingMissing ? false : null);
    setQtyMouldsRangeValid(qtyRange.missing || qtyRange.message ? false : null);

    const { ok, message, firstErrorField, fieldStates } = runValidation({
      validationRanges,
      fieldMapping,
      formData,
      inputRefs
    });

    // Feed the per-field validity setters; the Pouring Temp range shares one setter.
    Object.entries(fieldStates).forEach(([key, state]) => {
      if (key === 'pouringTemperatureMin' || key === 'pouringTemperatureMax') {
        if (state === false) setPouringTempValid(false);
        return;
      }
      validationSetters[key]?.(state);
    });
    if (fieldStates.pouringTemperatureMin === null && fieldStates.pouringTemperatureMax === null) {
      setPouringTempValid(null);
    }

    const anyMissing = time.missing || tappingMissing || qtyRange.missing || (!ok && message === MESSAGE_REQUIRED);
    const hasErrors = anyMissing || Boolean(time.message) || Boolean(qtyRange.message) || !ok;

    if (hasErrors) {
      // Required-wins; otherwise prefer the specific time/qty message over the generic one.
      const finalMessage = anyMissing ? MESSAGE_REQUIRED : (time.message || qtyRange.message || MESSAGE_FORMAT);
      setSubmitErrorMessage(finalMessage);
      toast.error(finalMessage);

      const focusField = (time.missing || time.message) ? 'pouringFromTime'
        : tappingMissing ? 'tappingTime'
        : qtyRange.missing ? 'quantityOfMouldsTo'
        : qtyRange.message ? 'quantityOfMouldsFrom'
        : firstErrorField;
      inputRefs.current[focusField]?.focus();
      return;
    }

    try {
      setSubmitLoading(true);

      let timeOfPouring = '';
      if (pouringFromTime && pouringToTime) {
        const formatTime = (time) => {
          const hour = time.hour % 12 || 12;
          const minute = String(time.minute).padStart(2, '0');
          const period = time.hour >= 12 ? 'PM' : 'AM';
          return `${hour}:${minute} ${period}`;
        };
        timeOfPouring = `${formatTime(pouringFromTime)} - ${formatTime(pouringToTime)}`;
      }

      let tappingTimeStr = '';
      if (tappingTime) {
        const hour = tappingTime.hour % 12 || 12;
        const minute = String(tappingTime.minute).padStart(2, '0');
        const period = tappingTime.hour >= 12 ? 'PM' : 'AM';
        tappingTimeStr = `${hour}:${minute} ${period}`;
      }

      const payload = { ...formData };

      // UI-only inputs the "Qty. Of Moulds" range is built from — the
      // backend only ever sees the computed quantityOfMoulds value.
      delete payload.quantityOfMouldsFrom;
      delete payload.quantityOfMouldsTo;

      payload.timeOfPouring = timeOfPouring || '-';
      payload.tappingTime = tappingTimeStr || '-';

      for (const rule of validationRanges) {
        const mappedField = fieldMapping[rule.field];
        if (!mappedField || Array.isArray(mappedField)) continue;

        const isRequired = rule.required === true;
        if (!isRequired && (!payload[mappedField] || payload[mappedField].toString().trim() === '')) {
          if (NUMERIC_MODEL_FIELDS.has(mappedField)) {
            delete payload[mappedField];
          } else {
            payload[mappedField] = '-';
          }
        }
      }

      if (!payload.timeOfPouring || payload.timeOfPouring.trim() === '') {
        payload.timeOfPouring = '-';
      }
      if (!payload.tappingTime || payload.tappingTime.trim() === '') {
        payload.tappingTime = '-';
      }

      const response = await fetch(`${API_ENDPOINTS.process}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const rawResponse = await response.text();
      let data = null;

      if (rawResponse) {
        try {
          data = JSON.parse(rawResponse);
        } catch (parseError) {
          throw new Error(FALLBACK_SUBMIT_ERROR);
        }
      } else {
        data = { success: false };
      }

      if (!response.ok || !data?.success) {
        const message = buildSubmitError(data, fieldMapping);
        setSubmitErrorMessage(message);
        toast.error(message);
        inputRefs.current.partName?.focus();
        return;
      }

      if (data.success) {
        toast.success('Entry saved successfully.');

        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        const currentDate = `${y}-${m}-${d}`;

        const resetData = {
          date: currentDate
        };
        Object.keys(formData).forEach(key => {
          if (key !== 'date' && key !== 'disa') {
            resetData[key] = '';
          } else if (key === 'disa') {
            resetData[key] = formData.disa;
          }
        });
        setFormData(resetData);

        setPouringFromTime(null);
        setPouringToTime(null);
        setTappingTime(null);

        setPartNameValid(null);
        setDatecodeValid(null);
        setHeatcodeValid(null);
        setQuantityOfMouldsValid(null);
        setQtyMouldsRangeValid(null);
        setMetalCValid(null);
        setMetalSiValid(null);
        setMetalMnValid(null);
        setMetalPValid(null);
        setMetalSValid(null);
        setMetalMgFLValid(null);
        setMetalCuValid(null);
        setMetalCrValid(null);
        setPouringTimeValid(null);
        setPouringTempValid(null);
        setPpCodeValid(null);
        setTreatmentNoValid(null);
        setFcNoValid(null);
        setHeatNoValid(null);
        setConNoValid(null);
        setTappingTimeValid(null);
        setCorrCValid(null);
        setCorrSiValid(null);
        setCorrMnValid(null);
        setCorrSValid(null);
        setCorrCrValid(null);
        setCorrCuValid(null);
        setCorrSnValid(null);
        setTappingWtValid(null);
        setMgValid(null);
        setResMgConvertorValid(null);
        setRecOfMgValid(null);
        setStreamInoculantValid(null);
        setPTimeValid(null);
        setRemarksValid(null);

        setSubmitErrorMessage('');

        setShowPartNameDropdown(false);
        setFilteredPartNames([]);

        setEntryCount(prev => prev + 1);

        setTimeout(() => {
          inputRefs.current.partName?.focus();
        }, 100);
      }
    } catch (error) {

      const message = error.message || 'Failed to save data. Please check your input and try again.';
      setSubmitErrorMessage(message);
      toast.error(message);

      if (inputRefs.current.partName) {
        inputRefs.current.partName.focus();
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmitKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <ComponentShowcase open={showComponentShowcase} onClose={() => setShowComponentShowcase(false)} />
      <div className="process-header">
        <div className="process-header-text">
          <h2>
            <FileText size={28} style={{ color: '#5B9AA9' }} />
            Process Control - Entry Form
            <InfoIcon onClick={openModal} />
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setShowComponentShowcase(true)}
          style={{
            padding: '0.5rem 0.9rem', borderRadius: '8px', border: '2px solid #5B9AA9',
            background: '#fff', color: '#5B9AA9', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
          }}
        >
          Component Showcase
        </button>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          DATE : {formData.date ? (() => {
            const [y, m, d] = formData.date.split('-');
            return `${d} / ${m} / ${y}`;
          })() : '-'}
        </div>
      </div>

      {}
      <InfoCard
        isOpen={isOpen}
        onClose={closeModal}
        title="Process Control - Validation Ranges & Data Entry Flow"
        validationRanges={validationRanges}
      />

      <div className="process-form-grid" ref={gridRef} onKeyDown={handleArrowKeyDown}>
            {}
            <div ref={primarySectionRef} className="section-header primary-data-header">
              <h3>Primary Data {isPrimarySaved && <span style={{ fontWeight: 400, fontSize: '0.875rem', color: '#5B9AA9' }}>(Entries: {entryCount})</span>}</h3>
            </div>

            <div className="process-form-group">
              <label>Date {mark('date')}</label>
              <CustomDatePicker
                ref={el => inputRefs.current.date = el}
                name="date"
                value={formData.date}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'date')}
                max={new Date().toISOString().split('T')[0]}
                style={{
                  border: highlightPrimaryFields ? '2px solid #ef4444' : '2px solid #cbd5e1',
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  backgroundColor: highlightPrimaryFields ? '#fee2e2' : '#fff',
                  transition: 'all 0.3s ease'
                }}
              />
            </div>

            <div className="process-form-group" style={{ minHeight: 'auto' }}>
              <label>DISA {mark('disa')}</label>
              <DisaDropdown
                ref={el => inputRefs.current.disa = el}
                name="disa"
                value={formData.disa}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'disa')}
                style={{
                  border: highlightPrimaryFields ? '2px solid #ef4444' : undefined,
                  backgroundColor: highlightPrimaryFields ? '#fee2e2' : undefined,
                  transition: 'all 0.3s ease'
                }}
              />
              {statusInfo && (
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'flex-start' }}>
                  <InlineLoader message={statusInfo.message} size="medium" variant={statusInfo.variant} />
                </div>
              )}
            </div>

            <div className="process-form-group">
              <label>&nbsp;</label>
              <LockPrimaryButton
                onClick={savePrimary}
                disabled={primaryBusy || !formData.date || !formData.disa || isPrimarySaved}
                isLocked={isPrimarySaved}
              />
            </div>

            {}
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', marginBottom: '1rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0' }}></div>

            <div className="process-form-group" ref={partNameDropdownRef} style={{ position: 'relative' }}>
              <label>Part Name {mark('partName')}</label>
              <input
                ref={el => inputRefs.current.partName = el}
                type="text"
                name="partName"
                value={formData.partName}
                onChange={handleChange}
                onFocus={handlePartNameFocus}
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    setShowPartNameDropdown(false);
                  } else if (e.key === 'Enter' && showPartNameDropdown && filteredPartNames.length > 0) {
                    e.preventDefault();
                    handlePartNameSelect(filteredPartNames[0]);
                  } else {
                    handleKeyDown(e, 'partName');
                  }
                }}
                placeholder="AUTO-CAPITALIZED"
                disabled={!isPrimarySaved}
                className={getInputClassName('partName', partNameValid)}
                autoComplete="off"
              />
              {showPartNameDropdown && filteredPartNames.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  {filteredPartNames.map((pn, idx) => (
                    <div
                      key={idx}
                      onClick={() => handlePartNameSelect(pn)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: idx < filteredPartNames.length - 1 ? '1px solid #eee' : 'none',
                        backgroundColor: 'white'
                      }}
                      onMouseEnter={e => e.target.style.backgroundColor = '#f0f0f0'}
                      onMouseLeave={e => e.target.style.backgroundColor = 'white'}
                    >
                      {pn}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="process-form-group">
              <label>Date Code {mark('datecode')}</label>
              <input
                ref={el => inputRefs.current.datecode = el}
                type="text"
                name="datecode"
                value={formData.datecode}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'datecode')}
                placeholder="e.g., 6F25"
                disabled={!isPrimarySaved}
                className={getInputClassName('datecode', datecodeValid)}
              />
            </div>

            <div className="process-form-group">
              <label>Heat Code {mark('heatcode')}</label>
              <input
                ref={el => inputRefs.current.heatcode = el}
                type="number"
                name="heatcode"
                value={formData.heatcode}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'heatcode')}
                placeholder="Enter number only"
                disabled={!isPrimarySaved}
                className={getInputClassName('heatcode', heatcodeValid)}
              />
            </div>

            <div className="process-form-group" style={{ gridColumn: 'span 2' }}>
              <label>Qty. Of Moulds {mark('quantityOfMoulds')}</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  ref={el => inputRefs.current.quantityOfMouldsFrom = el}
                  type="number"
                  name="quantityOfMouldsFrom"
                  value={formData.quantityOfMouldsFrom}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'quantityOfMouldsFrom')}
                  placeholder="From"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('quantityOfMouldsFrom', qtyMouldsRangeValid)}
                  style={{ flex: 1 }}
                />
                <span style={{ fontWeight: '600', color: '#64748b' }}>-</span>
                <input
                  ref={el => inputRefs.current.quantityOfMouldsTo = el}
                  type="number"
                  name="quantityOfMouldsTo"
                  value={formData.quantityOfMouldsTo}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'quantityOfMouldsTo')}
                  placeholder="To"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('quantityOfMouldsTo', qtyMouldsRangeValid)}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  value={formData.quantityOfMoulds}
                  readOnly
                  disabled
                  title="Calculated: To - From (or To, if From is blank)"
                  placeholder="Calc."
                  className={getInputClassName('quantityOfMoulds', quantityOfMouldsValid)}
                  style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600 }}
                />
              </div>
            </div>

            <div className="section-header metal-composition-header" style={{ gridColumn: '1 / -1' }}>
              <h3>Metal Composition (%) </h3>
            </div>
            <div className="metal-composition-row" style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="process-form-group" style={{ flex: '1', minWidth: '100px' }}>
                <label>C</label>
                <input
                  ref={r => inputRefs.current.metalCompositionC = r}
                  type="number"
                  name="metalCompositionC"
                  step="0.001"
                  value={formData.metalCompositionC}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'metalCompositionC')}
                  placeholder="%"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('metalCompositionC', metalCValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '100px' }}>
                <label>Si</label>
                <input
                  ref={r => inputRefs.current.metalCompositionSi = r}
                  type="number"
                  name="metalCompositionSi"
                  value={formData.metalCompositionSi}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'metalCompositionSi')}
                  placeholder="%"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('metalCompositionSi', metalSiValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '100px' }}>
                <label>Mn</label>
                <input
                  ref={r => inputRefs.current.metalCompositionMn = r}
                  type="number"
                  name="metalCompositionMn"
                  step="0.001"
                  value={formData.metalCompositionMn}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'metalCompositionMn')}
                  placeholder="%"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('metalCompositionMn', metalMnValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '100px' }}>
                <label>P</label>
                <input
                  ref={r => inputRefs.current.metalCompositionP = r}
                  type="number"
                  name="metalCompositionP"
                  step="0.001"
                  value={formData.metalCompositionP}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'metalCompositionP')}
                  placeholder="%"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('metalCompositionP', metalPValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '100px' }}>
                <label>S</label>
                <input
                  ref={r => inputRefs.current.metalCompositionS = r}
                  type="number"
                  name="metalCompositionS"
                  step="0.001"
                  value={formData.metalCompositionS}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'metalCompositionS')}
                  placeholder="%"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('metalCompositionS', metalSValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '100px' }}>
                <label>Mg F/L</label>
                <input
                  ref={r => inputRefs.current.metalCompositionMgFL = r}
                  type="number"
                  name="metalCompositionMgFL"
                  step="0.001"
                  value={formData.metalCompositionMgFL}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'metalCompositionMgFL')}
                  placeholder="%"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('metalCompositionMgFL', metalMgFLValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '100px' }}>
                <label>Cu</label>
                <input
                  ref={r => inputRefs.current.metalCompositionCu = r}
                  type="number"
                  name="metalCompositionCu"
                  step="0.001"
                  value={formData.metalCompositionCu}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'metalCompositionCu')}
                  placeholder="%"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('metalCompositionCu', metalCuValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '100px' }}>
                <label>Cr</label>
                <input
                  ref={r => inputRefs.current.metalCompositionCr = r}
                  type="number"
                  name="metalCompositionCr"
                  step="0.001"
                  value={formData.metalCompositionCr}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'metalCompositionCr')}
                  placeholder="%"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('metalCompositionCr', metalCrValid)}
                />
              </div>
            </div>

            {}
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', marginBottom: '0.5rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0' }}></div>

            <div className="process-form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Time of Pouring (Range) </label>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div>
                  <label>From Time</label>
                  <CustomTimeInput
                    ref={el => inputRefs.current.pouringFromTime = el}
                    value={pouringFromTime}
                    onChange={setPouringFromTime}
                    disabled={!isPrimarySaved}
                    hasError={pouringTimeValid === false}
                  />
                </div>
                <div>
                  <label>To Time</label>
                  <CustomTimeInput
                    ref={el => inputRefs.current.pouringToTime = el}
                    value={pouringToTime}
                    onChange={setPouringToTime}
                    disabled={!isPrimarySaved}
                    hasError={pouringTimeValid === false}
                  />
                </div>
              </div>
            </div>

            <div className="pouring-details-row" style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="process-form-group" style={{ flex: '1', minWidth: '280px' }}>
                <label>Pouring Temp (°C) </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    ref={el => inputRefs.current.pouringTemperatureMin = el}
                    type="number"
                    name="pouringTemperatureMin"
                    step="0.01"
                    value={formData.pouringTemperatureMin}
                    onChange={handleChange}
                    onKeyDown={e => handleKeyDown(e, 'pouringTemperatureMin')}
                    placeholder="Min"
                    disabled={!isPrimarySaved}
                    className={getInputClassName('pouringTemperatureMin', pouringTempValid)}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontWeight: '600', color: '#64748b' }}>-</span>
                  <input
                    ref={el => inputRefs.current.pouringTemperatureMax = el}
                    type="number"
                    name="pouringTemperatureMax"
                    step="0.01"
                    value={formData.pouringTemperatureMax}
                    onChange={handleChange}
                    onKeyDown={e => handleKeyDown(e, 'pouringTemperatureMax')}
                    placeholder="Max"
                    disabled={!isPrimarySaved}
                    className={getInputClassName('pouringTemperatureMax', pouringTempValid)}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '130px' }}>
                <label>PP Code </label>
                <input
                  ref={el => inputRefs.current.ppCode = el}
                  type="text"
                  name="ppCode"
                  value={formData.ppCode}
                  onChange={handleChange}
                  onBlur={() => handleIntegerBlur('ppCode')}
                  onKeyDown={e => handleKeyDown(e, 'ppCode')}
                  placeholder="Enter number only"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('ppCode', ppCodeValid)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '130px' }}>
                <label>Treatment No </label>
                <input
                  ref={el => inputRefs.current.treatmentNo = el}
                  type="text"
                  name="treatmentNo"
                  value={formData.treatmentNo}
                  onChange={handleChange}
                  onBlur={() => handleIntegerBlur('treatmentNo')}
                  onKeyDown={e => handleKeyDown(e, 'treatmentNo')}
                  placeholder="Enter number only"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('treatmentNo', treatmentNoValid)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '130px' }}>
                <label>F/C No. </label>
                <select
                  ref={el => inputRefs.current.fcNo = el}
                  name="fcNo"
                  value={formData.fcNo}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'fcNo')}
                  disabled={!isPrimarySaved}
                  className={getInputClassName('fcNo', fcNoValid)}
                >
                  <option value="">Select F/C No.</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="H1">H1</option>
                  <option value="H2">H2</option>
                </select>
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '130px' }}>
                <label>Heat No </label>
                <input
                  ref={el => inputRefs.current.heatNo = el}
                  type="number"
                  name="heatNo"
                  value={formData.heatNo}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'heatNo')}
                  placeholder="Enter Heat No"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('heatNo', heatNoValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '130px' }}>
                <label>Con No </label>
                <input
                  ref={el => inputRefs.current.conNo = el}
                  type="number"
                  name="conNo"
                  value={formData.conNo}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'conNo')}
                  placeholder="Enter number only"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('conNo', conNoValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '130px' }}>
                <label>Tapping Time </label>
                <CustomTimeInput
                  ref={el => inputRefs.current.tappingTime = el}
                  value={tappingTime}
                  onChange={setTappingTime}
                  disabled={!isPrimarySaved}
                  hasError={tappingTimeValid === false}
                />
              </div>
            </div>

            <div className="section-header corrective-addition-header" style={{ gridColumn: '1 / -1' }}>
              <h3>Corrective Additions (Kgs) </h3>
            </div>
            <div className="corrective-additions-row" style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="process-form-group" style={{ flex: '1', minWidth: '100px' }}>
                <label>C</label>
                <input
                  ref={r => inputRefs.current.correctiveAdditionC = r}
                  type="number"
                  name="correctiveAdditionC"
                  step="0.01"
                  value={formData.correctiveAdditionC}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'correctiveAdditionC')}
                  placeholder="Kgs"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('correctiveAdditionC', corrCValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '100px' }}>
                <label>Si</label>
                <input
                  ref={r => inputRefs.current.correctiveAdditionSi = r}
                  type="number"
                  name="correctiveAdditionSi"
                  step="0.01"
                  value={formData.correctiveAdditionSi}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'correctiveAdditionSi')}
                  placeholder="Kgs"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('correctiveAdditionSi', corrSiValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '100px' }}>
                <label>Mn</label>
                <input
                  ref={r => inputRefs.current.correctiveAdditionMn = r}
                  type="number"
                  name="correctiveAdditionMn"
                  step="0.01"
                  value={formData.correctiveAdditionMn}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'correctiveAdditionMn')}
                  placeholder="Kgs"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('correctiveAdditionMn', corrMnValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '100px' }}>
                <label>S</label>
                <input
                  ref={r => inputRefs.current.correctiveAdditionS = r}
                  type="number"
                  name="correctiveAdditionS"
                  step="0.01"
                  value={formData.correctiveAdditionS}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'correctiveAdditionS')}
                  placeholder="Kgs"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('correctiveAdditionS', corrSValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '100px' }}>
                <label>Cr</label>
                <input
                  ref={r => inputRefs.current.correctiveAdditionCr = r}
                  type="number"
                  name="correctiveAdditionCr"
                  step="0.01"
                  value={formData.correctiveAdditionCr}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'correctiveAdditionCr')}
                  placeholder="Kgs"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('correctiveAdditionCr', corrCrValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '100px' }}>
                <label>Cu</label>
                <input
                  ref={r => inputRefs.current.correctiveAdditionCu = r}
                  type="number"
                  name="correctiveAdditionCu"
                  step="0.01"
                  value={formData.correctiveAdditionCu}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'correctiveAdditionCu')}
                  placeholder="Kgs"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('correctiveAdditionCu', corrCuValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '100px' }}>
                <label>Sn</label>
                <input
                  ref={r => inputRefs.current.correctiveAdditionSn = r}
                  type="number"
                  name="correctiveAdditionSn"
                  step="0.01"
                  value={formData.correctiveAdditionSn}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'correctiveAdditionSn')}
                  placeholder="Kgs"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('correctiveAdditionSn', corrSnValid)}
                />
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', marginBottom: '0.5rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0' }}></div>
            <div className="additional-fields-row" style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="process-form-group" style={{ flex: '1', minWidth: '150px' }}>
                <label>Tapping Wt (Kgs) </label>
                <input
                  ref={el => inputRefs.current.tappingWt = el}
                  type="number"
                  name="tappingWt"
                  step="0.01"
                  value={formData.tappingWt}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'tappingWt')}
                  placeholder="Enter weight"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('tappingWt', tappingWtValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '150px' }}>
                <label>Mg (Kgs)</label>
                <input
                  ref={el => inputRefs.current.mg = el}
                  type="number"
                  name="mg"
                  step="0.01"
                  value={formData.mg}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'mg')}
                  placeholder="Enter Mg"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('mg', mgValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '150px' }}>
                <label>Res. Mg. Convertor (%)</label>
                <input
                  ref={el => inputRefs.current.resMgConvertor = el}
                  type="number"
                  name="resMgConvertor"
                  step="0.01"
                  value={formData.resMgConvertor}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'resMgConvertor')}
                  placeholder="Enter %"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('resMgConvertor', resMgConvertorValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '150px' }}>
                <label>Rec. Of Mg (%)</label>
                <input
                  ref={el => inputRefs.current.recOfMg = el}
                  type="number"
                  name="recOfMg"
                  step="0.01"
                  value={formData.recOfMg}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'recOfMg')}
                  placeholder="Enter %"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('recOfMg', recOfMgValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '150px' }}>
                <label>Stream Inoculant (gm/Sec) </label>
                <input
                  ref={el => inputRefs.current.streamInoculant = el}
                  type="number"
                  name="streamInoculant"
                  value={formData.streamInoculant}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'streamInoculant')}
                  step="0.1"
                  placeholder="e.g., 5.5"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('streamInoculant', streamInoculantValid)}
                />
              </div>
              <div className="process-form-group" style={{ flex: '1', minWidth: '150px' }}>
                <label>P.Time (sec)</label>
                <input
                  ref={el => inputRefs.current.pTime = el}
                  type="number"
                  name="pTime"
                  value={formData.pTime}
                  onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, 'pTime')}
                  step="0.1"
                  placeholder="e.g., 120"
                  disabled={!isPrimarySaved}
                  className={getInputClassName('pTime', pTimeValid)}
                />
              </div>
            </div>

            <div className="process-form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Remarks </label>
              <textarea
                ref={el => inputRefs.current.remarks = el}
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'remarks')}
                placeholder="Enter any additional notes..."
                rows={3}
                disabled={!isPrimarySaved}
                className={getInputClassName('remarks', remarksValid)}
              />
            </div>
      </div>

      <div className="process-submit-container" style={{ justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
        {}
        {submitErrorMessage && (
          <div style={{ flex: 1, marginRight: '0.5rem' }}>
            <InlineLoader
              message={submitErrorMessage}
              variant="danger"
              size="medium"
            />
          </div>
        )}
        <div>
          <SubmitButton
            ref={el => inputRefs.current.submitBtn = el}
            onClick={handleSubmit}
            disabled={submitLoading || !isPrimarySaved}
            type="button"
            onKeyDown={handleSubmitKeyDown}
          >
          {submitLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            'Submit Entry'
          )}
        </SubmitButton>
        </div>
      </div>
    </>
  );
}