import React, { useState, useRef, useEffect } from 'react';
import { Save, Loader2, RefreshCw, FileText } from 'lucide-react';
import '../../styles/PageStyles/Process/Process.css';

export default function ProcessControl() {

  const [formData, setFormData] = useState({
    date: '', disa: '', partName: '', datecode: '', heatcode: '', quantityOfMoulds: '', metalCompositionC: '', metalCompositionSi: '',
    metalCompositionMn: '', metalCompositionP: '', metalCompositionS: '', metalCompositionMgFL: '',
    metalCompositionCr: '', metalCompositionCu: '', 
    pouringStartHour: '', pouringStartMinute: '',
    pouringEndHour: '', pouringEndMinute: '',
    pouringTemperature: '',
    ppCode: '', treatmentNo: '', fcNo: '', heatNo: '', conNo: '', 
    tappingHour: '', tappingMinute: '',
    correctiveAdditionC: '',
    correctiveAdditionSi: '', correctiveAdditionMn: '', correctiveAdditionS: '', correctiveAdditionCr: '',
    correctiveAdditionCu: '', correctiveAdditionSn: '', tappingWt: '', mg: '', resMgConvertor: '',
    recOfMg: '', streamInoculant: '', pTime: '', remarks: ''
  });


  const inputRefs = useRef({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isPrimarySaved, setIsPrimarySaved] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // VALIDATION STATES (null = neutral/default, true = green/valid, false = red/invalid)
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
  const [pouringTimeValid, setPouringTimeValid] = useState(null);
  const [tappingWtValid, setTappingWtValid] = useState(null);
  const [streamInoculantValid, setStreamInoculantValid] = useState(null);
  const [remarksValid, setRemarksValid] = useState(null);
  
  // Metal Composition validation states
  const [metalCValid, setMetalCValid] = useState(null);
  const [metalSiValid, setMetalSiValid] = useState(null);
  const [metalMnValid, setMetalMnValid] = useState(null);
  const [metalPValid, setMetalPValid] = useState(null);
  const [metalSValid, setMetalSValid] = useState(null);
  const [metalMgFLValid, setMetalMgFLValid] = useState(null);
  const [metalCuValid, setMetalCuValid] = useState(null);
  const [metalCrValid, setMetalCrValid] = useState(null);
  
  // Corrective Addition validation states
  const [corrCValid, setCorrCValid] = useState(null);
  const [corrSiValid, setCorrSiValid] = useState(null);
  const [corrMnValid, setCorrMnValid] = useState(null);
  const [corrSValid, setCorrSValid] = useState(null);
  const [corrCrValid, setCorrCrValid] = useState(null);
  const [corrCuValid, setCorrCuValid] = useState(null);
  const [corrSnValid, setCorrSnValid] = useState(null);
  
  // Other optional fields
  const [conNoValid, setConNoValid] = useState(null);
  const [tappingTimeValid, setTappingTimeValid] = useState(null);
  const [mgValid, setMgValid] = useState(null);
  const [resMgConvertorValid, setResMgConvertorValid] = useState(null);
  const [recOfMgValid, setRecOfMgValid] = useState(null);
  const [pTimeValid, setPTimeValid] = useState(null);

  // Set current date on mount
  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setFormData(prev => ({
      ...prev,
      date: `${y}-${m}-${d}`
    }));
  }, []);

  const fieldOrder = ['disa', 'partName', 'datecode', 'heatcode', 'quantityOfMoulds', 'metalCompositionC', 'metalCompositionSi',
    'metalCompositionMn', 'metalCompositionP', 'metalCompositionS', 'metalCompositionMgFL', 'metalCompositionCu',
    'metalCompositionCr', 'pouringStartHour', 'pouringStartMinute', 'pouringEndHour', 'pouringEndMinute',
    'pouringTemperature', 'ppCode', 'treatmentNo', 'fcNo', 'heatNo', 'conNo',
    'tappingHour', 'tappingMinute', 'correctiveAdditionC', 'correctiveAdditionSi', 'correctiveAdditionMn', 'correctiveAdditionS',
    'correctiveAdditionCr', 'correctiveAdditionCu', 'correctiveAdditionSn', 'tappingWt', 'mg', 'resMgConvertor',
    'recOfMg', 'streamInoculant', 'pTime', 'remarks'];

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validate DISA
    if (name === 'disa') {
      if (value.trim() === '') {
        setDisaValid(null);
      } else {
        setDisaValid(value.trim().length > 0);
      }
    }

    // Validate Part Name
    if (name === 'partName') {
      if (value.trim() === '') {
        setPartNameValid(null);
      } else {
        setPartNameValid(value.trim().length > 0);
      }
    }

    // Validate Date Code - specific format (e.g., 6F25)
    if (name === 'datecode') {
      const pattern = /^[0-9][A-Z][0-9]{2}$/;
      if (value.trim() === '') {
        setDatecodeValid(null);
      } else {
        setDatecodeValid(pattern.test(value));
      }
      setFormData({...formData, [name]: value.toUpperCase()});
      return;
    }

    // Validate Heat Code - only numbers
    if (name === 'heatcode') {
      const numericPattern = /^\d+$/;
      if (value.trim() === '') {
        setHeatcodeValid(null);
      } else {
        setHeatcodeValid(numericPattern.test(value));
      }
    }

    // Validate Quantity of Moulds (number)
    if (name === 'quantityOfMoulds') {
      if (value.trim() === '') {
        setQuantityOfMouldsValid(null);
      } else {
        setQuantityOfMouldsValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }

    // Metal Composition validations (all are numbers)
    if (name === 'metalCompositionC') {
      if (value.trim() === '') {
        setMetalCValid(null);
      } else {
        setMetalCValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'metalCompositionSi') {
      if (value.trim() === '') {
        setMetalSiValid(null);
      } else {
        setMetalSiValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'metalCompositionMn') {
      if (value.trim() === '') {
        setMetalMnValid(null);
      } else {
        setMetalMnValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'metalCompositionP') {
      if (value.trim() === '') {
        setMetalPValid(null);
      } else {
        setMetalPValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'metalCompositionS') {
      if (value.trim() === '') {
        setMetalSValid(null);
      } else {
        setMetalSValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'metalCompositionMgFL') {
      if (value.trim() === '') {
        setMetalMgFLValid(null);
      } else {
        setMetalMgFLValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'metalCompositionCu') {
      if (value.trim() === '') {
        setMetalCuValid(null);
      } else {
        setMetalCuValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'metalCompositionCr') {
      if (value.trim() === '') {
        setMetalCrValid(null);
      } else {
        setMetalCrValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }

    // Validate Pouring Time (check when any time field changes)
    if (name.includes('pouring')) {
      const updatedData = {...formData, [name]: value};
      const hasStartTime = updatedData.pouringStartHour && updatedData.pouringStartMinute;
      const hasEndTime = updatedData.pouringEndHour && updatedData.pouringEndMinute;
      
      const allEmpty = !updatedData.pouringStartHour && !updatedData.pouringStartMinute && 
                       !updatedData.pouringEndHour && !updatedData.pouringEndMinute;
      
      if (allEmpty) {
        setPouringTimeValid(null);
      } else if (hasStartTime && hasEndTime) {
        setPouringTimeValid(true);
      } else {
        setPouringTimeValid(false);
      }
    }

    // Validate Pouring Temperature
    if (name === 'pouringTemperature') {
      if (value.trim() === '') {
        setPouringTempValid(null);
      } else {
        setPouringTempValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // Validate PP Code - only numbers
    if (name === 'ppCode') {
      const numericPattern = /^\d+$/;
      if (value.trim() === '') {
        setPpCodeValid(null);
      } else {
        setPpCodeValid(numericPattern.test(value));
      }
    }

    // Validate Treatment No - only numbers
    if (name === 'treatmentNo') {
      const numericPattern = /^\d+$/;
      if (value.trim() === '') {
        setTreatmentNoValid(null);
      } else {
        setTreatmentNoValid(numericPattern.test(value));
      }
    }

    // Validate FC No - roman numerals from dropdown
    if (name === 'fcNo') {
      if (value.trim() === '') {
        setFcNoValid(null);
      } else {
        setFcNoValid(value.trim().length > 0);
      }
    }

    // Validate Heat No
    if (name === 'heatNo') {
      if (value.trim() === '') {
        setHeatNoValid(null);
      } else {
        setHeatNoValid(value.trim().length > 0);
      }
    }

    // Validate Con No - only numbers
    if (name === 'conNo') {
      const numericPattern = /^\d+$/;
      if (value.trim() === '') {
        setConNoValid(null);
      } else {
        setConNoValid(numericPattern.test(value));
      }
    }

    // Validate Tapping Time (check when any tapping time field changes)
    if (name === 'tappingHour' || name === 'tappingMinute') {
      const updatedData = {...formData, [name]: value};
      const hasTappingTime = updatedData.tappingHour && updatedData.tappingMinute;
      
      const allEmpty = !updatedData.tappingHour && !updatedData.tappingMinute;
      
      if (allEmpty) {
        setTappingTimeValid(null);
      } else if (hasTappingTime) {
        setTappingTimeValid(true);
      } else {
        setTappingTimeValid(false);
      }
    }

    // Corrective Addition validations (all are numbers)
    if (name === 'correctiveAdditionC') {
      if (value.trim() === '') {
        setCorrCValid(null);
      } else {
        setCorrCValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'correctiveAdditionSi') {
      if (value.trim() === '') {
        setCorrSiValid(null);
      } else {
        setCorrSiValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'correctiveAdditionMn') {
      if (value.trim() === '') {
        setCorrMnValid(null);
      } else {
        setCorrMnValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'correctiveAdditionS') {
      if (value.trim() === '') {
        setCorrSValid(null);
      } else {
        setCorrSValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'correctiveAdditionCr') {
      if (value.trim() === '') {
        setCorrCrValid(null);
      } else {
        setCorrCrValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'correctiveAdditionCu') {
      if (value.trim() === '') {
        setCorrCuValid(null);
      } else {
        setCorrCuValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'correctiveAdditionSn') {
      if (value.trim() === '') {
        setCorrSnValid(null);
      } else {
        setCorrSnValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }

    // Validate Tapping Wt
    if (name === 'tappingWt') {
      if (value.trim() === '') {
        setTappingWtValid(null);
      } else {
        setTappingWtValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // Validate Mg
    if (name === 'mg') {
      if (value.trim() === '') {
        setMgValid(null);
      } else {
        setMgValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }

    // Validate Res. Mg. Convertor
    if (name === 'resMgConvertor') {
      if (value.trim() === '') {
        setResMgConvertorValid(null);
      } else {
        setResMgConvertorValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }

    // Validate Rec. Of Mg
    if (name === 'recOfMg') {
      if (value.trim() === '') {
        setRecOfMgValid(null);
      } else {
        setRecOfMgValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }

    // Validate Stream Inoculant
    if (name === 'streamInoculant') {
      if (value.trim() === '') {
        setStreamInoculantValid(null);
      } else {
        setStreamInoculantValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }

    // Validate P.Time
    if (name === 'pTime') {
      if (value.trim() === '') {
        setPTimeValid(null);
      } else {
        setPTimeValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }

    // Validate Remarks
    if (name === 'remarks') {
      if (value.trim() === '') {
        setRemarksValid(null);
      } else {
        setRemarksValid(value.trim().length > 0);
      }
    }

    setFormData({...formData, [name]: value});
  };
  
  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const idx = fieldOrder.indexOf(field);
      
      // If on remarks field (last field), move to submit button
      if (field === 'remarks') {
        inputRefs.current.submitBtn?.focus();
      } else if (idx < fieldOrder.length - 1) {
        inputRefs.current[fieldOrder[idx + 1]]?.focus();
      }
    }
  };

  const handlePrimarySubmit = () => {
    // If already locked, unlock it
    if (isPrimarySaved) {
      setIsPrimarySaved(false);
      return;
    }

    // Validate required fields
    if (!formData.disa) {
      alert('Please fill in DISA');
      return;
    }

    // Lock primary field (disa) without saving to database
    // The actual save will happen when user clicks "Submit Entry"
    setIsPrimarySaved(true);
  };

  const handleSubmit = async () => {
    // Check all fields and mark empty/invalid ones as red
    let hasErrors = false;
    
    // Validate DISA (required)
    if (!formData.disa || !formData.disa.trim()) {
      setDisaValid(false);
      hasErrors = true;
    }
    
    // Validate Part Name (required)
    if (!formData.partName || !formData.partName.trim()) {
      setPartNameValid(false);
      hasErrors = true;
    }
    
    // Validate Date Code (required)
    const datecodePattern = /^[0-9][A-Z][0-9]{2}$/;
    if (!formData.datecode || !formData.datecode.trim() || !datecodePattern.test(formData.datecode)) {
      setDatecodeValid(false);
      hasErrors = true;
    }
    
    // Validate Heat Code (required)
    if (!formData.heatcode || !formData.heatcode.trim()) {
      setHeatcodeValid(false);
      hasErrors = true;
    }
    
    // Validate Quantity of Moulds (optional but validate if empty)
    if (!formData.quantityOfMoulds || formData.quantityOfMoulds.trim() === '') {
      setQuantityOfMouldsValid(false);
      hasErrors = true;
    } else if (isNaN(formData.quantityOfMoulds) || parseFloat(formData.quantityOfMoulds) < 0) {
      setQuantityOfMouldsValid(false);
      hasErrors = true;
    }
    
    // Validate Metal Composition fields (all optional but validate if empty)
    if (!formData.metalCompositionC || formData.metalCompositionC.trim() === '') {
      setMetalCValid(false);
      hasErrors = true;
    }
    if (!formData.metalCompositionSi || formData.metalCompositionSi.trim() === '') {
      setMetalSiValid(false);
      hasErrors = true;
    }
    if (!formData.metalCompositionMn || formData.metalCompositionMn.trim() === '') {
      setMetalMnValid(false);
      hasErrors = true;
    }
    if (!formData.metalCompositionP || formData.metalCompositionP.trim() === '') {
      setMetalPValid(false);
      hasErrors = true;
    }
    if (!formData.metalCompositionS || formData.metalCompositionS.trim() === '') {
      setMetalSValid(false);
      hasErrors = true;
    }
    if (!formData.metalCompositionMgFL || formData.metalCompositionMgFL.trim() === '') {
      setMetalMgFLValid(false);
      hasErrors = true;
    }
    if (!formData.metalCompositionCu || formData.metalCompositionCu.trim() === '') {
      setMetalCuValid(false);
      hasErrors = true;
    }
    if (!formData.metalCompositionCr || formData.metalCompositionCr.trim() === '') {
      setMetalCrValid(false);
      hasErrors = true;
    }
    
    // Validate PP Code (required)
    if (!formData.ppCode || !formData.ppCode.trim()) {
      setPpCodeValid(false);
      hasErrors = true;
    }
    
    // Validate Treatment No (required)
    if (!formData.treatmentNo || !formData.treatmentNo.trim()) {
      setTreatmentNoValid(false);
      hasErrors = true;
    }
    
    // Validate FC No (required)
    if (!formData.fcNo || !formData.fcNo.trim()) {
      setFcNoValid(false);
      hasErrors = true;
    }
    
    // Validate Heat No (required)
    if (!formData.heatNo || !formData.heatNo.trim()) {
      setHeatNoValid(false);
      hasErrors = true;
    }
    
    // Validate Con No (optional but validate if empty)
    if (!formData.conNo || formData.conNo.trim() === '') {
      setConNoValid(false);
      hasErrors = true;
    }
    
    // Validate Pouring Temperature (required)
    if (!formData.pouringTemperature || isNaN(formData.pouringTemperature) || parseFloat(formData.pouringTemperature) <= 0) {
      setPouringTempValid(false);
      hasErrors = true;
    }
    
    // Validate Time of Pouring (required)
    if (!formData.pouringStartHour || !formData.pouringStartMinute || !formData.pouringEndHour || !formData.pouringEndMinute) {
      setPouringTimeValid(false);
      hasErrors = true;
    }
    
    // Validate Tapping Time (optional but validate if empty)
    if (!formData.tappingHour || !formData.tappingMinute) {
      setTappingTimeValid(false);
      hasErrors = true;
    }
    
    // Validate Corrective Addition fields (all optional but validate if empty)
    if (!formData.correctiveAdditionC || formData.correctiveAdditionC.trim() === '') {
      setCorrCValid(false);
      hasErrors = true;
    }
    if (!formData.correctiveAdditionSi || formData.correctiveAdditionSi.trim() === '') {
      setCorrSiValid(false);
      hasErrors = true;
    }
    if (!formData.correctiveAdditionMn || formData.correctiveAdditionMn.trim() === '') {
      setCorrMnValid(false);
      hasErrors = true;
    }
    if (!formData.correctiveAdditionS || formData.correctiveAdditionS.trim() === '') {
      setCorrSValid(false);
      hasErrors = true;
    }
    if (!formData.correctiveAdditionCr || formData.correctiveAdditionCr.trim() === '') {
      setCorrCrValid(false);
      hasErrors = true;
    }
    if (!formData.correctiveAdditionCu || formData.correctiveAdditionCu.trim() === '') {
      setCorrCuValid(false);
      hasErrors = true;
    }
    if (!formData.correctiveAdditionSn || formData.correctiveAdditionSn.trim() === '') {
      setCorrSnValid(false);
      hasErrors = true;
    }
    
    // Validate Tapping Wt (required)
    if (!formData.tappingWt || isNaN(formData.tappingWt) || parseFloat(formData.tappingWt) <= 0) {
      setTappingWtValid(false);
      hasErrors = true;
    }
    
    // Validate Mg (optional but validate if empty)
    if (!formData.mg || formData.mg.trim() === '') {
      setMgValid(false);
      hasErrors = true;
    }
    
    // Validate Res. Mg. Convertor (optional but validate if empty)
    if (!formData.resMgConvertor || formData.resMgConvertor.trim() === '') {
      setResMgConvertorValid(false);
      hasErrors = true;
    }
    
    // Validate Rec. Of Mg (optional but validate if empty)
    if (!formData.recOfMg || formData.recOfMg.trim() === '') {
      setRecOfMgValid(false);
      hasErrors = true;
    }
    
    // Validate Stream Inoculant (required)
    if (!formData.streamInoculant || isNaN(formData.streamInoculant) || parseFloat(formData.streamInoculant) < 0) {
      setStreamInoculantValid(false);
      hasErrors = true;
    }
    
    // Validate P.Time (optional but validate if empty)
    if (!formData.pTime || formData.pTime.trim() === '') {
      setPTimeValid(false);
      hasErrors = true;
    }
    
    // Validate Remarks (required)
    if (!formData.remarks || !formData.remarks.trim()) {
      setRemarksValid(false);
      hasErrors = true;
    }
    
    // If there are errors, stop submission
    if (hasErrors) {
      return;
    }

    try {
      setSubmitLoading(true);

      // Combine time fields into format: "HH:MM - HH:MM"
      let timeOfPouring = '';
      if (formData.pouringStartHour && formData.pouringStartMinute) {
        const startHour = String(formData.pouringStartHour).padStart(2, '0');
        const startMin = String(formData.pouringStartMinute).padStart(2, '0');
        timeOfPouring = `${startHour}:${startMin}`;
        
        if (formData.pouringEndHour && formData.pouringEndMinute) {
          const endHour = String(formData.pouringEndHour).padStart(2, '0');
          const endMin = String(formData.pouringEndMinute).padStart(2, '0');
          timeOfPouring += ` - ${endHour}:${endMin}`;
        }
      }

      // Combine tapping time fields into format: "HH:MM"
      let tappingTime = '';
      if (formData.tappingHour && formData.tappingMinute) {
        const hour = String(formData.tappingHour).padStart(2, '0');
        const min = String(formData.tappingMinute).padStart(2, '0');
        tappingTime = `${hour}:${min}`;
      }

      // Prepare payload without the separate time fields
      const { pouringStartHour, pouringStartMinute,
              pouringEndHour, pouringEndMinute,
              tappingHour, tappingMinute, ...payload } = formData;
      
      payload.timeOfPouring = timeOfPouring;
      payload.tappingTime = tappingTime;

      // Send all data (primary + other fields) combined to backend
      // Backend will find existing document by date+disa and update it, or create new one
      const response = await fetch('/v1/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.success) {
        alert('Process control entry saved successfully!');

        // Get current date
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        const currentDate = `${y}-${m}-${d}`;

        // Reset all fields except primary data (date and disa)
        const resetData = { 
          date: currentDate
        };
        Object.keys(formData).forEach(key => {
          if (key !== 'date' && key !== 'disa') {
            resetData[key] = '';
          } else if (key === 'disa') {
            resetData[key] = formData.disa; // Keep disa
          }
        });
        setFormData(resetData);
        
        // Keep primary locked, focus on Part Name for next entry
        setTimeout(() => {
          inputRefs.current.partName?.focus();
        }, 100);
      }
    } catch (error) {
      console.error('Error saving process control entry:', error);
      alert('Failed to save entry: ' + error.message);
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

const handleReset = () => {
    // Get current date
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const currentDate = `${y}-${m}-${d}`;

    // Reset all fields except primary data (date and disa)
    const resetData = { date: currentDate };
    Object.keys(formData).forEach(key => {
      if (key !== 'date' && key !== 'disa') {
        resetData[key] = '';
      } else if (key === 'disa') {
        resetData[key] = formData.disa; // Keep disa
      }
    });
    setFormData(resetData);
    // Keep primary locked if it was locked
    // Focus on Part Name for next entry
    setTimeout(() => {
      inputRefs.current.partName?.focus();
    }, 100);
  };

  return (
    <>

      <div className="process-header">
        <div className="process-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            Process Control - Entry Form
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          DATE : {formData.date ? new Date(formData.date).toLocaleDateString('en-GB') : '-'}
        </div>
      </div>

      <div className="process-form-grid">
            {/* Primary Data Section */}
            <div className="section-header primary-data-header">
              <h3>Primary Data</h3>
            </div>

            <div className="process-form-group">
              <label>DISA *</label>
              <select
                ref={el => inputRefs.current.disa = el}
                name="disa"
                value={formData.disa}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'disa')}
                disabled={isPrimarySaved}                className={
                  disaValid === null
                    ? ""
                    : disaValid
                    ? "valid-input"
                    : "invalid-input"
                }                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '2px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  backgroundColor: isPrimarySaved ? '#f1f5f9' : '#ffffff',
                  color: '#1e293b',
                  cursor: isPrimarySaved ? 'not-allowed' : 'pointer'
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
              <label>&nbsp;</label>
              <button
                className="process-lock-primary-btn"
                type="button"
                onClick={handlePrimarySubmit}
                disabled={!isPrimarySaved && !formData.disa}
              >
                {isPrimarySaved ? 'Unlock Primary' : 'Lock Primary'}
              </button>
            </div>

            {/* Divider line to separate primary data from other inputs */}
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', marginBottom: '1rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0' }}></div>

            <div className="process-form-group">
              <label>Part Name *</label>
              <input 
                ref={el => inputRefs.current.partName = el} 
                type="text" 
                name="partName" 
                value={formData.partName} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'partName')} 
                placeholder="e.g., ABC-123"
                className={
                  partNameValid === null
                    ? ""
                    : partNameValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
              <label>Date Code *</label>
              <input 
                ref={el => inputRefs.current.datecode = el} 
                type="text" 
                name="datecode" 
                value={formData.datecode} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'datecode')} 
                placeholder="e.g., 6F25"
                className={
                  datecodeValid === null
                    ? ""
                    : datecodeValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
              <label>Heat Code *</label>
              <input 
                ref={el => inputRefs.current.heatcode = el} 
                type="number" 
                name="heatcode" 
                value={formData.heatcode} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'heatcode')} 
                placeholder="Enter number only"
                className={
                  heatcodeValid === null
                    ? ""
                    : heatcodeValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
              <label>Qty. Of Moulds</label>
              <input 
                ref={el => inputRefs.current.quantityOfMoulds = el} 
                type="number" 
                name="quantityOfMoulds" 
                value={formData.quantityOfMoulds} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'quantityOfMoulds')} 
                placeholder="Enter quantity"
                className={
                  quantityOfMouldsValid === null
                    ? ""
                    : quantityOfMouldsValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="section-header metal-composition-header">
              <h3>Metal Composition (%)</h3>
            </div>
            <div className="process-form-group">
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
                className={
                  metalCValid === null
                    ? ""
                    : metalCValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-form-group">
              <label>Si</label>
              <input 
                ref={r => inputRefs.current.metalCompositionSi = r} 
                type="number" 
                name="metalCompositionSi" 
                step="0.001" 
                value={formData.metalCompositionSi} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'metalCompositionSi')} 
                placeholder="%"
                className={
                  metalSiValid === null
                    ? ""
                    : metalSiValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-form-group">
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
                className={
                  metalMnValid === null
                    ? ""
                    : metalMnValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-form-group">
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
                className={
                  metalPValid === null
                    ? ""
                    : metalPValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-form-group">
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
                className={
                  metalSValid === null
                    ? ""
                    : metalSValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-form-group">
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
                className={
                  metalMgFLValid === null
                    ? ""
                    : metalMgFLValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-form-group">
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
                className={
                  metalCuValid === null
                    ? ""
                    : metalCuValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-form-group">
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
                className={
                  metalCrValid === null
                    ? ""
                    : metalCrValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            {/* Divider line */}
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', marginBottom: '0.5rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0' }}></div>

            <div className="process-form-group time-range-group" style={{ gridColumn: '1 / -1' }}>
              <label>Time of Pouring (Range) *</label>
              <div 
                className="time-range-container"
                style={{
                  border: pouringTimeValid === null 
                    ? '2px solid #cbd5e1' 
                    : pouringTimeValid 
                    ? '2px solid #10b981' 
                    : '2px solid #ef4444',
                  borderRadius: '8px',
                  padding: '0.375rem 0.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  width: 'fit-content'
                }}
              >
                <div className="time-inputs-group">
                  <input 
                    ref={el => inputRefs.current.pouringStartHour = el} 
                    type="number" 
                    name="pouringStartHour" 
                    value={formData.pouringStartHour} 
                    onChange={handleChange} 
                    onKeyDown={e => handleKeyDown(e, 'pouringStartHour')} 
                    placeholder="HH" 
                    min="0" 
                    max="23"
                    style={{ width: '60px', border: 'none', outline: 'none' }}
                  />
                  <span>:</span>
                  <input 
                    ref={el => inputRefs.current.pouringStartMinute = el} 
                    type="number" 
                    name="pouringStartMinute" 
                    value={formData.pouringStartMinute} 
                    onChange={handleChange} 
                    onKeyDown={e => handleKeyDown(e, 'pouringStartMinute')} 
                    placeholder="MM" 
                    min="0" 
                    max="59"
                    style={{ width: '60px', border: 'none', outline: 'none' }}
                  />
                </div>
                <span className="time-separator">-</span>
                <div className="time-inputs-group">
                  <input 
                    ref={el => inputRefs.current.pouringEndHour = el} 
                    type="number" 
                    name="pouringEndHour" 
                    value={formData.pouringEndHour} 
                    onChange={handleChange} 
                    onKeyDown={e => handleKeyDown(e, 'pouringEndHour')} 
                    placeholder="HH" 
                    min="0" 
                    max="23"
                    style={{ width: '60px', border: 'none', outline: 'none' }}
                  />
                  <span>:</span>
                  <input 
                    ref={el => inputRefs.current.pouringEndMinute = el} 
                    type="number" 
                    name="pouringEndMinute" 
                    value={formData.pouringEndMinute} 
                    onChange={handleChange} 
                    onKeyDown={e => handleKeyDown(e, 'pouringEndMinute')} 
                    placeholder="MM" 
                    min="0" 
                    max="59"
                    style={{ width: '60px', border: 'none', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div className="process-form-group">
              <label>Pouring Temp (°C) *</label>
              <input 
                ref={el => inputRefs.current.pouringTemperature = el} 
                type="number" 
                name="pouringTemperature" 
                step="0.01" 
                value={formData.pouringTemperature} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'pouringTemperature')} 
                placeholder="e.g., 1450"
                className={
                  pouringTempValid === null
                    ? ""
                    : pouringTempValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
              <label>PP Code *</label>
              <input 
                ref={el => inputRefs.current.ppCode = el} 
                type="number" 
                name="ppCode" 
                value={formData.ppCode} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'ppCode')} 
                placeholder="Enter number only"
                className={
                  ppCodeValid === null
                    ? ""
                    : ppCodeValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
              <label>Treatment No *</label>
              <input 
                ref={el => inputRefs.current.treatmentNo = el} 
                type="number" 
                name="treatmentNo" 
                value={formData.treatmentNo} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'treatmentNo')} 
                placeholder="Enter number only"
                className={
                  treatmentNoValid === null
                    ? ""
                    : treatmentNoValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
              <label>F/C No. *</label>
              <select
                ref={el => inputRefs.current.fcNo = el} 
                name="fcNo" 
                value={formData.fcNo} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'fcNo')} 
                className={
                  fcNoValid === null
                    ? ""
                    : fcNoValid
                    ? "valid-input"
                    : "invalid-input"
                }
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '2px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  cursor: 'pointer'
                }}
              >
                <option value="">Select F/C No.</option>
                <option value="I">I</option>
                <option value="II">II</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
                <option value="V">V</option>
                <option value="VI">VI</option>
              </select>
            </div>

            <div className="process-form-group">
              <label>Heat No *</label>
              <input 
                ref={el => inputRefs.current.heatNo = el} 
                type="text" 
                name="heatNo" 
                value={formData.heatNo} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'heatNo')} 
                placeholder="Enter Heat No"
                className={
                  heatNoValid === null
                    ? ""
                    : heatNoValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
              <label>Con No</label>
              <input 
                ref={el => inputRefs.current.conNo = el} 
                type="number" 
                name="conNo" 
                value={formData.conNo} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'conNo')} 
                placeholder="Enter number only"
                className={
                  conNoValid === null
                    ? ""
                    : conNoValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Tapping Time</label>
              <div 
                className="time-range-container"
                style={{
                  border: tappingTimeValid === null 
                    ? '2px solid #cbd5e1' 
                    : tappingTimeValid 
                    ? '2px solid #10b981' 
                    : '2px solid #ef4444',
                  borderRadius: '8px',
                  padding: '0.375rem 0.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  width: 'fit-content'
                }}
              >
                <div className="time-inputs-group">
                  <input 
                    ref={el => inputRefs.current.tappingHour = el} 
                    type="number" 
                    name="tappingHour" 
                    value={formData.tappingHour} 
                    onChange={handleChange} 
                    onKeyDown={e => handleKeyDown(e, 'tappingHour')} 
                    placeholder="HH" 
                    min="0" 
                    max="23"
                    style={{ width: '60px', border: 'none', outline: 'none' }}
                  />
                  <span>:</span>
                  <input 
                    ref={el => inputRefs.current.tappingMinute = el} 
                    type="number" 
                    name="tappingMinute" 
                    value={formData.tappingMinute} 
                    onChange={handleChange} 
                    onKeyDown={e => handleKeyDown(e, 'tappingMinute')} 
                    placeholder="MM" 
                    min="0" 
                    max="59"
                    style={{ width: '60px', border: 'none', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div className="section-header corrective-addition-header">
              <h3>Corrective Addition (Kgs)</h3>
            </div>
            <div className="process-form-group">
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
                className={
                  corrCValid === null
                    ? ""
                    : corrCValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-form-group">
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
                className={
                  corrSiValid === null
                    ? ""
                    : corrSiValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-form-group">
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
                className={
                  corrMnValid === null
                    ? ""
                    : corrMnValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-form-group">
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
                className={
                  corrSValid === null
                    ? ""
                    : corrSValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-form-group">
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
                className={
                  corrCrValid === null
                    ? ""
                    : corrCrValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-form-group">
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
                className={
                  corrCuValid === null
                    ? ""
                    : corrCuValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-form-group">
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
                className={
                  corrSnValid === null
                    ? ""
                    : corrSnValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            {/* Divider line */}
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', marginBottom: '0.5rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0' }}></div>

            <div className="process-form-group">
              <label>Tapping Wt (Kgs) *</label>
              <input 
                ref={el => inputRefs.current.tappingWt = el} 
                type="number" 
                name="tappingWt" 
                step="0.01" 
                value={formData.tappingWt} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'tappingWt')} 
                placeholder="Enter weight"
                className={
                  tappingWtValid === null
                    ? ""
                    : tappingWtValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
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
                className={
                  mgValid === null
                    ? ""
                    : mgValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
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
                className={
                  resMgConvertorValid === null
                    ? ""
                    : resMgConvertorValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
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
                className={
                  recOfMgValid === null
                    ? ""
                    : recOfMgValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
              <label>Stream Inoculant (gm/Sec) *</label>
              <input 
                ref={el => inputRefs.current.streamInoculant = el}
                type="number"
                name="streamInoculant"
                value={formData.streamInoculant}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'streamInoculant')}
                step="0.1"
                placeholder="e.g., 5.5"
                className={
                  streamInoculantValid === null
                    ? ""
                    : streamInoculantValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
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
                className={
                  pTimeValid === null
                    ? ""
                    : pTimeValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Remarks *</label>
              <textarea 
                ref={el => inputRefs.current.remarks = el} 
                name="remarks" 
                value={formData.remarks} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'remarks')}
                placeholder="Enter any additional notes..." 
                maxLength={200}
                rows={3}
                className={
                  remarksValid === null
                    ? ""
                    : remarksValid
                    ? "valid-input"
                    : "invalid-input"
                }
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '2px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '80px'
                }}
              />
            </div>
      </div>

      <div className="process-submit-container">
        <button 
          className="process-reset-btn"
          onClick={handleReset}
          type="button"
        >
          <RefreshCw size={18} />
          Reset Form
        </button>
        <button 
          ref={el => inputRefs.current.submitBtn = el}
          className="process-submit-btn" 
          type="button"
          onClick={handleSubmit}
          onKeyDown={handleSubmitKeyDown}
          disabled={submitLoading}
        >
          {submitLoading ? <Loader2 size={20} className="animate-spin" /> : <Save size={18} />}
          {submitLoading ? 'Saving...' : 'Submit Entry'}
        </button>
      </div>
    </>
  );
}