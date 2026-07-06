
import React, { useState, useRef, useEffect } from 'react';
import { Loader2, FileText } from 'lucide-react';
import { SubmitButton, LockPrimaryButton, DisaDropdown, CustomTimeInput, Time } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import Sakthi from '../../Components/Sakthi';
import { InlineLoader, toast } from '../../Components/Alert';
import { InfoIcon, InfoCard, useInfoModal } from '../../Components/Info';
import { API_ENDPOINTS } from '../../config/api';
import { useArrowNavigation } from '../../utils/arrowNavigation';
import { useDepartmentForm } from '../../context/DepartmentContext';
import '../../styles/PageStyles/Process/Process.css';

export default function ProcessControl() {
  const { isOpen, openModal, closeModal } = useInfoModal();

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

  const validationRanges = [
    {
      field: 'Date',
      required: true,
      type: 'Date',
      pattern: 'DD/MM/YYYY'
    },
    {
      field: 'DISA',
      required: true,
      type: 'Select',
      allowedValues: ['DISA 1', 'DISA 2', 'DISA 3', 'DISA 4']
    },
    {
      field: 'Part Name',
      required: true,
      type: 'Text',
      pattern: 'e.g., ABC-123'
    },
    {
      field: 'Date Code',
      required: true,
      type: 'Text',
      pattern: 'e.g., 6F25'
    },
    {
      field: 'Heat Code',
      required: true,
      type: 'Number'
    },
    {
      field: 'Qty. Of Moulds',
      required: true,
      type: 'Number',
      min: 1
    },
    {
      field: 'Metal Composition - C',
      type: 'Number',
      min: 0,
      max: 100,
      unit: '%'
    },
    {
      field: 'Metal Composition - Si',
      type: 'Number',
      min: 0,
      max: 100,
      unit: '%'
    },
    {
      field: 'Metal Composition - Mn',
      type: 'Number',
      min: 0,
      max: 100,
      unit: '%'
    },
    {
      field: 'Metal Composition - P',
      type: 'Number',
      min: 0,
      max: 100,
      unit: '%'
    },
    {
      field: 'Metal Composition - S',
      type: 'Number',
      min: 0,
      max: 100,
      unit: '%'
    },
    {
      field: 'Metal Composition - Mg F/L',
      type: 'Number',
      min: 0,
      max: 100,
      unit: '%'
    },
    {
      field: 'Metal Composition - Cu',
      type: 'Number',
      min: 0,
      max: 100,
      unit: '%'
    },
    {
      field: 'Metal Composition - Cr',
      type: 'Number',
      min: 0,
      max: 100,
      unit: '%'
    },
    {
      field: 'Time of Pouring (Range)',
      type: 'Time Range',
      max:'60min',
      pattern: 'HH:MM - HH:MM'
    },
    {
      field: 'Pouring Temp',
      type: 'Number Range',
      min: 0,
      unit: '°C',
      pattern: 'Min - Max (e.g., 1400 - 1500)'
    },
    {
      field: 'PP Code',
      type: 'Integer'
    },
    {
      field: 'Treatment No',
      type: 'Integer'
    },
    {
      field: 'F/C No.',
      type: 'Select',
      allowedValues: ['1', '2', '3', '4','H1','H2']
    },
    {
      field: 'Heat No',
      type: 'Text'
    },
    {
      field: 'Con No',
      type: 'Number'
    },
    {
      field: 'Tapping Time',
      type: 'Time',
      pattern: 'HH:MM'
    },
    {
      field: 'Corrective Addition - C',
      type: 'Number',
      min: 0,
      unit: 'Kgs'
    },
    {
      field: 'Corrective Addition - Si',
      type: 'Number',
      min: 0,
      unit: 'Kgs'
    },
    {
      field: 'Corrective Addition - Mn',
      type: 'Number',
      min: 0,
      unit: 'Kgs'
    },
    {
      field: 'Corrective Addition - S',
      type: 'Number',
      min: 0,
      unit: 'Kgs'
    },
    {
      field: 'Corrective Addition - Cr',
      type: 'Number',
      min: 0,
      unit: 'Kgs'
    },
    {
      field: 'Corrective Addition - Cu',
      type: 'Number',
      min: 0,
      unit: 'Kgs'
    },
    {
      field: 'Corrective Addition - Sn',
      type: 'Number',
      min: 0,
      unit: 'Kgs'
    },
    {
      field: 'Tapping Wt',
      type: 'Number',
      min: 0,
      unit: 'Kgs'
    },
    {
      field: 'Mg',
      type: 'Number',
      min: 0,
      unit: 'Kgs'
    },
    {
      field: 'Res. Mg. Convertor',
      type: 'Number',
      min: 0,
      max: 100,
      unit: '%'
    },
    {
      field: 'Rec. Of Mg',
      type: 'Number',
      min: 0,
      max: 100,
      unit: '%'
    },
    {
      field: 'Stream Inoculant',
      type: 'Number',
      min: 0,
      unit: 'gm/Sec',
      pattern: 'e.g., 5.5'
    },
    {
      field: 'P.Time',
      type: 'Number',
      min: 0,
      unit: 'sec',
      pattern: 'e.g., 120'
    },
    {
      field: 'Remarks',
      type: 'Text'
    }
  ];

  const fieldMapping = {
    'Date': 'date',
    'DISA': 'disa',
    'Part Name': 'partName',
    'Date Code': 'datecode',
    'Heat Code': 'heatcode',
    'Qty. Of Moulds': 'quantityOfMoulds',
    'Metal Composition - C': 'metalCompositionC',
    'Metal Composition - Si': 'metalCompositionSi',
    'Metal Composition - Mn': 'metalCompositionMn',
    'Metal Composition - P': 'metalCompositionP',
    'Metal Composition - S': 'metalCompositionS',
    'Metal Composition - Mg F/L': 'metalCompositionMgFL',
    'Metal Composition - Cu': 'metalCompositionCu',
    'Metal Composition - Cr': 'metalCompositionCr',
    'Pouring Temp': ['pouringTemperatureMin', 'pouringTemperatureMax'],
    'PP Code': 'ppCode',
    'Treatment No': 'treatmentNo',
    'F/C No.': 'fcNo',
    'Heat No': 'heatNo',
    'Con No': 'conNo',
    'Corrective Addition - C': 'correctiveAdditionC',
    'Corrective Addition - Si': 'correctiveAdditionSi',
    'Corrective Addition - Mn': 'correctiveAdditionMn',
    'Corrective Addition - S': 'correctiveAdditionS',
    'Corrective Addition - Cr': 'correctiveAdditionCr',
    'Corrective Addition - Cu': 'correctiveAdditionCu',
    'Corrective Addition - Sn': 'correctiveAdditionSn',
    'Tapping Wt': 'tappingWt',
    'Mg': 'mg',
    'Res. Mg. Convertor': 'resMgConvertor',
    'Rec. Of Mg': 'recOfMg',
    'Stream Inoculant': 'streamInoculant',
    'P.Time': 'pTime',
    'Remarks': 'remarks'
  };

  const inputRefs = useRef({});
  const primarySectionRef = useRef(null);
  const { containerRef: gridRef, handleArrowKeyDown } = useArrowNavigation();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [savePrimaryLoading, setSavePrimaryLoading] = useState(false);
  const [showSakthi, setShowSakthi] = useState(false);
  const [showCombinationFound, setShowCombinationFound] = useState(false);
  const [showCombinationAdded, setShowCombinationAdded] = useState(false);
  const [showPrimaryWarning, setShowPrimaryWarning] = useState(false);
  const [highlightPrimaryFields, setHighlightPrimaryFields] = useState(false);

  const [dateValid, setDateValid] = useState(null);
  const [disaValid, setDisaValid] = useState(null);
  const [partNameValid, setPartNameValid] = useState(null);
  const [datecodeValid, setDatecodeValid] = useState(null);
  const [heatcodeValid, setHeatcodeValid] = useState(null);
  const [quantityOfMouldsValid, setQuantityOfMouldsValid] = useState(null);
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

  const validateField = (rule, mappedFields, formData) => {
    if (Array.isArray(mappedFields)) {
      const [minField, maxField] = mappedFields;
      const minValue = formData[minField];
      const maxValue = formData[maxField];
      const minInput = inputRefs?.current?.[minField];
      const maxInput = inputRefs?.current?.[maxField];

      if ((minInput && minInput.validity && minInput.validity.badInput) ||
          (maxInput && maxInput.validity && maxInput.validity.badInput)) {
        return { isValid: false, message: `${rule.field} must contain valid numbers` };
      }

      if (rule.required) {
        if (!minValue || !maxValue) {
          return { isValid: false, message: `${rule.field} is required` };
        }
      }

      if (minValue && maxValue) {
        const min = parseFloat(minValue);
        const max = parseFloat(maxValue);

        if (isNaN(min) || isNaN(max)) {
          return { isValid: false, message: `${rule.field} must contain valid numbers` };
        }

        if (min >= max) {
          return { isValid: false, message: `${rule.field} minimum must be less than maximum` };
        }
      }

      return { isValid: true };
    }

    const fieldName = mappedFields;
    const value = formData[fieldName];
    const inputElement = inputRefs?.current?.[fieldName];

    if (inputElement && inputElement.validity && inputElement.validity.badInput) {
      return { isValid: false, message: `${rule.field} must be a valid ${rule.type.toLowerCase()}` };
    }

    if (rule.required) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return { isValid: false, message: `${rule.field} is required` };
      }
    }

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return { isValid: true };
    }

    switch (rule.type) {
      case 'Number':
      case 'Integer':
        const stringValue = String(value).trim();

        const invalidNumberPattern = /[eE+]|\..*\.|--|\+\+/;
        if (invalidNumberPattern.test(stringValue)) {
          return { isValid: false, message: `${rule.field} must be a valid number` };
        }

        if (/[eE.+-]$/.test(stringValue)) {
          return { isValid: false, message: `${rule.field} must be a valid number` };
        }

        const num = parseFloat(value);
        if (isNaN(num) || !isFinite(num)) {
          return { isValid: false, message: `${rule.field} must be a valid number` };
        }

        if (rule.min !== undefined && num < rule.min) {
          return { isValid: false, message: `${rule.field} must be at least ${rule.min}` };
        }
        if (rule.max !== undefined && num > rule.max) {
          return { isValid: false, message: `${rule.field} must be no more than ${rule.max}` };
        }

        if (rule.type === 'Integer' && !Number.isInteger(num)) {
          return { isValid: false, message: `${rule.field} must be a whole number` };
        }
        break;

      case 'Text':
        const textValue = String(value).trim();
        if (textValue === '') {
          return rule.required ? { isValid: false, message: `${rule.field} is required` } : { isValid: true };
        }

        if (rule.field === 'Date Code') {
          const dateCodePattern = /^[0-9][A-Z][0-9]{2}$/;
          if (!dateCodePattern.test(textValue)) {
            return { isValid: false, message: `${rule.field} must be in format: 1 digit, 1 letter, 2 digits (e.g., 6F25)` };
          }
        }
        break;

      case 'Select':
        if (rule.allowedValues && !rule.allowedValues.includes(value)) {
          return { isValid: false, message: `${rule.field} must be one of: ${rule.allowedValues.join(', ')}` };
        }
        break;

      case 'Date':
        if (value && typeof value === 'string' && value.trim() !== '') {
          const dateValue = new Date(value);
          if (isNaN(dateValue.getTime())) {
            return { isValid: false, message: `${rule.field} must be a valid date` };
          }
        }
        break;

      default:
        break;
    }

    return { isValid: true };
  };

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
    const checkDateDisaExists = async () => {
      if (!formData.date || !formData.disa) {
        setIsPrimarySaved(false);
        setEntryCount(0);
        setSavePrimaryLoading(false);
        setShowCombinationFound(false);
        setShowCombinationAdded(false);
        return;
      }

      try {
        setSavePrimaryLoading(true);
        setShowCombinationFound(false);

        const startTime = Date.now();

        const response = await fetch(`${API_ENDPOINTS.process}/check?date=${formData.date}&disa=${encodeURIComponent(formData.disa)}`, {
          method: 'GET',
          credentials: 'include'
        });
        const data = await response.json();

        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);
        await new Promise(resolve => setTimeout(resolve, remainingTime));

        setSavePrimaryLoading(false);

        if (data.success && data.exists) {
          setShowCombinationFound(true);

          setTimeout(() => {
            setShowCombinationFound(false);
            setIsPrimarySaved(true);
            setEntryCount(data.count || 0);
          }, 1500);
        } else {
          setIsPrimarySaved(false);
          setEntryCount(0);
        }
      } catch (error) {
        setSavePrimaryLoading(false);
      }
    };

    checkDateDisaExists();
  }, [formData.date, formData.disa]);

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

  useEffect(() => {
    const handleDisabledClick = (e) => {
      const target = e.target;

      if ((target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') && target.disabled) {
        handleDisabledFieldClick(e);
        return;
      }

      if (target.tagName === 'LABEL') {
        let formGroup = target.closest('.process-form-group');
        if (formGroup) {
          const input = formGroup.querySelector('input, select, textarea');
          if (input && input.disabled) {
            handleDisabledFieldClick(e);
            return;
          }
        }
      }

      if (target.classList && target.classList.contains('process-form-grid') && !isPrimarySaved) {
        handleDisabledFieldClick(e);
        return;
      }

      let formGroup = null;
      if (target.classList && target.classList.contains('process-form-group')) {
        formGroup = target;
      } else {
        formGroup = target.closest('.process-form-group');
      }

      if (formGroup) {
        const input = formGroup.querySelector('input, select, textarea');
        if (input && input.disabled) {
          handleDisabledFieldClick(e);
          return;
        }
      }

      if (!isPrimarySaved) {
        const closestFormGroup = target.closest('.process-form-group');
        if (closestFormGroup) {
          const input = closestFormGroup.querySelector('input, select, textarea');
          if (input && input.disabled) {
            handleDisabledFieldClick(e);
            return;
          }
        }
      }
    };

    document.addEventListener('mousedown', handleDisabledClick, true);

    return () => {
      document.removeEventListener('mousedown', handleDisabledClick, true);
    };
  }, [isPrimarySaved]);

  const fieldOrder = ['date', 'disa', 'partName', 'datecode', 'heatcode', 'quantityOfMoulds', 'metalCompositionC', 'metalCompositionSi',
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
      case 'quantityOfMoulds':
        setQuantityOfMouldsValid(null);
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

    if (name === 'partName') {
      const sanitizedValue = value.toUpperCase().replace(/[^A-Z0-9\-_ ]/g, '');
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

  const handleDisabledFieldClick = (e) => {
    if (!isPrimarySaved) {
      e.preventDefault();
      e.stopPropagation();

      setShowPrimaryWarning(true);
      setHighlightPrimaryFields(true);

      if (primarySectionRef.current) {
        primarySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      setTimeout(() => {
        setShowPrimaryWarning(false);
        setHighlightPrimaryFields(false);
      }, 3000);
    }
  };

  const handlePrimarySubmit = async () => {
    if (!formData.date || !formData.disa) {
      toast.warning('Please fill in Date and DISA');

      if (!formData.date) {
        inputRefs.current.date?.focus();
      } else if (!formData.disa) {
        inputRefs.current.disa?.focus();
      }

      return;
    }

    if (savePrimaryLoading || showCombinationFound || showCombinationAdded) {
      return;
    }

    try {
      setSavePrimaryLoading(true);

      const startTime = Date.now();

      const response = await fetch(`${API_ENDPOINTS.process}/save-primary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          date: formData.date,
          disa: formData.disa
        })
      });

      const rawResponse = await response.text();
      let data = null;
      if (rawResponse) {
        try {
          data = JSON.parse(rawResponse);
        } catch (parseError) {
          throw new Error('Invalid server response');
        }
      } else {
        data = { success: false, message: 'Empty response from server' };
      }

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      await new Promise(resolve => setTimeout(resolve, remainingTime));

      setSavePrimaryLoading(false);

      if (data.success) {
        setShowCombinationAdded(true);

        setTimeout(() => {
          setShowCombinationAdded(false);
          setIsPrimarySaved(true);
          setEntryCount(data.count || 0);
          setTimeout(() => {
            inputRefs.current.partName?.focus();
          }, 100);
        }, 1000);
      } else {
        toast.error('Failed to save primary: ' + data.message);
      }
    } catch (error) {
      setSavePrimaryLoading(false);
      toast.error('Failed to save primary: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    let hasErrors = false;
    let firstErrorField = null;

    setSubmitErrorMessage('');

    for (const rule of validationRanges) {
      const mappedFields = fieldMapping[rule.field];

      if (rule.field === 'Time of Pouring (Range)') {
        if (rule.required && (!pouringFromTime || !pouringToTime)) {
          setPouringTimeValid(false);
          hasErrors = true;
          if (!firstErrorField) firstErrorField = 'pouringFromTime';
        } else if (pouringFromTime && pouringToTime) {
          const fromMinutes = pouringFromTime.hour * 60 + pouringFromTime.minute;
          const toMinutes = pouringToTime.hour * 60 + pouringToTime.minute;

          if (fromMinutes >= toMinutes) {
            setPouringTimeValid(false);
            setSubmitErrorMessage('Time of Pouring: Start time must be less than end time');
            hasErrors = true;
            if (!firstErrorField) firstErrorField = 'pouringFromTime';
          } else if ((toMinutes - fromMinutes) > 60) {
            setPouringTimeValid(false);
            setSubmitErrorMessage('Time of Pouring: Maximum allowed difference is 1 hour');
            hasErrors = true;
            if (!firstErrorField) firstErrorField = 'pouringFromTime';
          } else {
            setPouringTimeValid(null);
          }
        } else {
          setPouringTimeValid(null);
        }
        continue;
      }

      if (rule.field === 'Tapping Time') {
        if (rule.required && !tappingTime) {
          setTappingTimeValid(false);
          hasErrors = true;
          if (!firstErrorField) firstErrorField = 'tappingTime';
        } else {
          setTappingTimeValid(null);
        }
        continue;
      }

      if (!mappedFields) continue;

      const result = validateField(rule, mappedFields, formData);

      let setter;
      if (Array.isArray(mappedFields)) {
        setter = setPouringTempValid;
      } else {
        setter = validationSetters[mappedFields];
      }

      if (setter) {
        if (!result.isValid) {
          setter(false);
          hasErrors = true;
          if (!firstErrorField) firstErrorField = Array.isArray(mappedFields) ? mappedFields[0] : mappedFields;
        } else {
          setter(null);
        }
      }
    }

    if (hasErrors) {
      setSubmitErrorMessage('Fill required Field in Correct format');

      if (firstErrorField) {
        inputRefs.current[firstErrorField]?.focus();
      }

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

      payload.timeOfPouring = timeOfPouring || '-';
      payload.tappingTime = tappingTimeStr || '-';

      for (const rule of validationRanges) {
        const mappedField = fieldMapping[rule.field];
        if (!mappedField || Array.isArray(mappedField)) continue;

        const isRequired = rule.required === true;
        if (!isRequired && (!payload[mappedField] || payload[mappedField].toString().trim() === '')) {
          payload[mappedField] = '-';
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
          throw new Error('Invalid server response');
        }
      } else {
        data = { success: false, message: 'Empty response from server' };
      }

      if (!response.ok) {

        if (response.status === 400) {
          const errorMessage = data?.message || `Bad Request (${response.status}): Please check your input data format`;
          throw new Error(errorMessage);
        } else {
          throw new Error(data?.message || `HTTP ${response.status}: ${response.statusText}`);
        }
      }

      if (data.success) {
        setShowSakthi(true);

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

      setSubmitErrorMessage(error.message || 'Failed to save data. Please check your input and try again.');

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

  const handleSakthiComplete = () => {
    setShowSakthi(false);
  };

  return (
    <>
      {showSakthi && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <Sakthi onComplete={handleSakthiComplete} />
        </div>
      )}
      <div className="process-header">
        <div className="process-header-text">
          <h2>
            <FileText size={28} style={{ color: '#5B9AA9' }} />
            Process Control - Entry Form
            <InfoIcon onClick={openModal} />
          </h2>
        </div>
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
              <label>Date </label>
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
              <label>DISA </label>
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
              {(savePrimaryLoading || showCombinationFound || showCombinationAdded || showPrimaryWarning) && (
                <div style={{
                  marginTop: '0.75rem',
                  display: 'flex',
                  alignItems: 'flex-start'
                }}>
                  {savePrimaryLoading && (
                    <InlineLoader
                      message="Fetching Date, Disa"
                      size="medium"
                      variant="primary"
                    />
                  )}
                  {showCombinationFound && (
                    <InlineLoader
                      message="Combination found"
                      size="medium"
                      variant="success"
                    />
                  )}
                  {showCombinationAdded && (
                    <InlineLoader
                      message="Combination Added"
                      size="medium"
                      variant="success"
                    />
                  )}
                  {showPrimaryWarning && (
                    <InlineLoader
                      message="Save Date, Disa"
                      size="medium"
                      variant="danger"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="process-form-group">
              <label>&nbsp;</label>
              <LockPrimaryButton
                onClick={handlePrimarySubmit}
                disabled={savePrimaryLoading || showCombinationFound || showCombinationAdded || !formData.date || !formData.disa || isPrimarySaved}
                isLocked={isPrimarySaved}
              />
            </div>

            {}
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', marginBottom: '1rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0' }}></div>

            <div className="process-form-group" ref={partNameDropdownRef} style={{ position: 'relative' }}>
              <label>Part Name </label>
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
                placeholder="CAPITAL LETTERS & NUMBERS"
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
              <label>Date Code </label>
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
              <label>Heat Code </label>
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

            <div className="process-form-group">
              <label>Qty. Of Moulds </label>
              <input
                ref={el => inputRefs.current.quantityOfMoulds = el}
                type="number"
                name="quantityOfMoulds"
                value={formData.quantityOfMoulds}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'quantityOfMoulds')}
                placeholder="Enter quantity"
                disabled={!isPrimarySaved}
                className={getInputClassName('quantityOfMoulds', quantityOfMouldsValid)}
              />
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
                  type="text"
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

            {}
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
                maxLength={200}
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