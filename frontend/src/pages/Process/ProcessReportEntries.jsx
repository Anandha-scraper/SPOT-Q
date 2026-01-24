import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpenCheck, ArrowLeft } from 'lucide-react';
import Table from '../../Components/Table';
import { EditCard, DeleteConfirmCard } from '../../Components/PopUp';
import { EditButton, DeleteButton } from '../../Components/Buttons';
import { TimeRangeInput, TimeInput } from '../../Components/Buttons';
import '../../styles/PageStyles/Process/ProcessReportEntries.css';

const ProcessReportEntries = () => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const location = useLocation();
  const navigate = useNavigate();
  const { date, disa } = location.state || {};
  const [currentEntries, setCurrentEntries] = useState(location.state?.entries || []);
  const [loading, setLoading] = useState(false);
  const [tableKey, setTableKey] = useState(Date.now());
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Validation states (null = neutral, true = green/valid, false = red/invalid)
  const [partNameValid, setPartNameValid] = useState(null);
  const [datecodeValid, setDatecodeValid] = useState(null);
  const [heatcodeValid, setHeatcodeValid] = useState(null);
  const [quantityOfMouldsValid, setQuantityOfMouldsValid] = useState(null);
  const [metalCValid, setMetalCValid] = useState(null);
  const [metalSiValid, setMetalSiValid] = useState(null);
  const [metalMnValid, setMetalMnValid] = useState(null);
  const [metalPValid, setMetalPValid] = useState(null);
  const [metalSValid, setMetalSValid] = useState(null);
  const [metalMgFLValid, setMetalMgFLValid] = useState(null);
  const [metalCuValid, setMetalCuValid] = useState(null);
  const [metalCrValid, setMetalCrValid] = useState(null);
  const [timeOfPouringValid, setTimeOfPouringValid] = useState(null);
  const [pouringTempValid, setPouringTempValid] = useState(null);
  const [corrCValid, setCorrCValid] = useState(null);
  const [corrSiValid, setCorrSiValid] = useState(null);
  const [corrMnValid, setCorrMnValid] = useState(null);
  const [corrSValid, setCorrSValid] = useState(null);
  const [corrCrValid, setCorrCrValid] = useState(null);
  const [corrCuValid, setCorrCuValid] = useState(null);
  const [corrSnValid, setCorrSnValid] = useState(null);
  const [remarksValid, setRemarksValid] = useState(null);
  const [ppCodeValid, setPpCodeValid] = useState(null);
  const [treatmentNoValid, setTreatmentNoValid] = useState(null);
  const [fcNoValid, setFcNoValid] = useState(null);
  const [heatNoValid, setHeatNoValid] = useState(null);
  const [conNoValid, setConNoValid] = useState(null);
  const [tappingTimeValid, setTappingTimeValid] = useState(null);
  const [tappingWtValid, setTappingWtValid] = useState(null);
  const [mgValid, setMgValid] = useState(null);
  const [resMgConvertorValid, setResMgConvertorValid] = useState(null);
  const [recOfMgValid, setRecOfMgValid] = useState(null);
  const [streamInoculantValid, setStreamInoculantValid] = useState(null);
  const [pTimeValid, setPTimeValid] = useState(null);

  // Fetch fresh data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/v1/process', {
          credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
          // Filter entries by the current date and DISA (API returns flattened entries)
          const filteredEntries = (data.data || []).filter(item => {
            if (!item.date) return false;
            const itemDate = new Date(item.date).toISOString().split('T')[0];
            const matchesDate = itemDate === date;
            const matchesDisa = !disa || item.disa === disa;
            return matchesDate && matchesDisa;
          });
          setCurrentEntries(filteredEntries);
          setTableKey(Date.now());
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (date) {
      fetchInitialData();
    }
  }, [date, disa]);

  useEffect(() => {
    if (!date) {
      navigate('/process/report');
    }
  }, [date, navigate]);

  const refreshData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/v1/process', {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        // Filter entries by the current date and DISA (API returns flattened entries)
        const filteredEntries = (data.data || []).filter(item => {
          if (!item.date) return false;
          const itemDate = new Date(item.date).toISOString().split('T')[0];
          const matchesDate = itemDate === date;
          const matchesDisa = !disa || item.disa === disa;
          return matchesDate && matchesDisa;
        });
        setCurrentEntries(filteredEntries);
        setTableKey(Date.now());
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'No Date') return 'No Date';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day} / ${month} / ${year}`;
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    
    // Parse time strings to separate hour/minute fields
    const formData = { ...item };
    
    // Parse timeOfPouring (format: "HH:MM - HH:MM")
    if (item.timeOfPouring) {
      const [start, end] = item.timeOfPouring.split(' - ');
      if (start) {
        const [startHour, startMinute] = start.split(':');
        formData.pouringStartHour = startHour || '';
        formData.pouringStartMinute = startMinute || '';
      }
      if (end) {
        const [endHour, endMinute] = end.split(':');
        formData.pouringEndHour = endHour || '';
        formData.pouringEndMinute = endMinute || '';
      }
    }
    
    // Parse tappingTime (format: "HH:MM")
    if (item.tappingTime) {
      const [hour, minute] = item.tappingTime.split(':');
      formData.tappingHour = hour || '';
      formData.tappingMinute = minute || '';
    }
    
    setEditFormData(formData);
    
    // Reset all validation states to null (neutral) when opening edit modal
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
    setTimeOfPouringValid(null);
    setPouringTempValid(null);
    setCorrCValid(null);
    setCorrSiValid(null);
    setCorrMnValid(null);
    setCorrSValid(null);
    setCorrCrValid(null);
    setCorrCuValid(null);
    setCorrSnValid(null);
    setRemarksValid(null);
    setPpCodeValid(null);
    setTreatmentNoValid(null);
    setFcNoValid(null);
    setHeatNoValid(null);
    setConNoValid(null);
    setTappingTimeValid(null);
    setTappingWtValid(null);
    setMgValid(null);
    setResMgConvertorValid(null);
    setRecOfMgValid(null);
    setStreamInoculantValid(null);
    setPTimeValid(null);
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setSelectedItem(null);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    // Validate all required fields
    let hasErrors = false;

    if (!editFormData.partName || editFormData.partName.trim() === '') {
      setPartNameValid(false);
      hasErrors = true;
    }

    const datecodePattern = /^[0-9][A-Z][0-9]{2}$/;
    if (!editFormData.datecode || !datecodePattern.test(editFormData.datecode)) {
      setDatecodeValid(false);
      hasErrors = true;
    }

    if (!editFormData.heatcode || editFormData.heatcode.trim() === '') {
      setHeatcodeValid(false);
      hasErrors = true;
    }

    if (!editFormData.quantityOfMoulds || isNaN(editFormData.quantityOfMoulds) || parseFloat(editFormData.quantityOfMoulds) < 0) {
      setQuantityOfMouldsValid(false);
      hasErrors = true;
    }

    // Validate metal composition fields
    if (!editFormData.metalCompositionC || isNaN(editFormData.metalCompositionC) || parseFloat(editFormData.metalCompositionC) < 0) {
      setMetalCValid(false);
      hasErrors = true;
    }
    if (!editFormData.metalCompositionSi || isNaN(editFormData.metalCompositionSi) || parseFloat(editFormData.metalCompositionSi) < 0) {
      setMetalSiValid(false);
      hasErrors = true;
    }
    if (!editFormData.metalCompositionMn || isNaN(editFormData.metalCompositionMn) || parseFloat(editFormData.metalCompositionMn) < 0) {
      setMetalMnValid(false);
      hasErrors = true;
    }
    if (!editFormData.metalCompositionP || isNaN(editFormData.metalCompositionP) || parseFloat(editFormData.metalCompositionP) < 0) {
      setMetalPValid(false);
      hasErrors = true;
    }
    if (!editFormData.metalCompositionS || isNaN(editFormData.metalCompositionS) || parseFloat(editFormData.metalCompositionS) < 0) {
      setMetalSValid(false);
      hasErrors = true;
    }
    if (!editFormData.metalCompositionMgFL || isNaN(editFormData.metalCompositionMgFL) || parseFloat(editFormData.metalCompositionMgFL) < 0) {
      setMetalMgFLValid(false);
      hasErrors = true;
    }
    if (!editFormData.metalCompositionCu || isNaN(editFormData.metalCompositionCu) || parseFloat(editFormData.metalCompositionCu) < 0) {
      setMetalCuValid(false);
      hasErrors = true;
    }
    if (!editFormData.metalCompositionCr || isNaN(editFormData.metalCompositionCr) || parseFloat(editFormData.metalCompositionCr) < 0) {
      setMetalCrValid(false);
      hasErrors = true;
    }

    if (!editFormData.timeOfPouring || editFormData.timeOfPouring.trim() === '') {
      setTimeOfPouringValid(false);
      hasErrors = true;
    }

    if (!editFormData.pouringTemperature || isNaN(editFormData.pouringTemperature) || parseFloat(editFormData.pouringTemperature) <= 0) {
      setPouringTempValid(false);
      hasErrors = true;
    }

    // Validate correction fields (optional - only validate if they have a value)
    if (editFormData.correctiveAdditionC !== undefined && editFormData.correctiveAdditionC !== '' && editFormData.correctiveAdditionC !== null) {
      if (isNaN(editFormData.correctiveAdditionC) || parseFloat(editFormData.correctiveAdditionC) < 0) {
        setCorrCValid(false);
        hasErrors = true;
      }
    }
    if (editFormData.correctiveAdditionSi !== undefined && editFormData.correctiveAdditionSi !== '' && editFormData.correctiveAdditionSi !== null) {
      if (isNaN(editFormData.correctiveAdditionSi) || parseFloat(editFormData.correctiveAdditionSi) < 0) {
        setCorrSiValid(false);
        hasErrors = true;
      }
    }
    if (editFormData.correctiveAdditionMn !== undefined && editFormData.correctiveAdditionMn !== '' && editFormData.correctiveAdditionMn !== null) {
      if (isNaN(editFormData.correctiveAdditionMn) || parseFloat(editFormData.correctiveAdditionMn) < 0) {
        setCorrMnValid(false);
        hasErrors = true;
      }
    }
    if (editFormData.correctiveAdditionS !== undefined && editFormData.correctiveAdditionS !== '' && editFormData.correctiveAdditionS !== null) {
      if (isNaN(editFormData.correctiveAdditionS) || parseFloat(editFormData.correctiveAdditionS) < 0) {
        setCorrSValid(false);
        hasErrors = true;
      }
    }
    if (editFormData.correctiveAdditionCr !== undefined && editFormData.correctiveAdditionCr !== '' && editFormData.correctiveAdditionCr !== null) {
      if (isNaN(editFormData.correctiveAdditionCr) || parseFloat(editFormData.correctiveAdditionCr) < 0) {
        setCorrCrValid(false);
        hasErrors = true;
      }
    }
    if (editFormData.correctiveAdditionCu !== undefined && editFormData.correctiveAdditionCu !== '' && editFormData.correctiveAdditionCu !== null) {
      if (isNaN(editFormData.correctiveAdditionCu) || parseFloat(editFormData.correctiveAdditionCu) < 0) {
        setCorrCuValid(false);
        hasErrors = true;
      }
    }
    if (editFormData.correctiveAdditionSn !== undefined && editFormData.correctiveAdditionSn !== '' && editFormData.correctiveAdditionSn !== null) {
      if (isNaN(editFormData.correctiveAdditionSn) || parseFloat(editFormData.correctiveAdditionSn) < 0) {
        setCorrSnValid(false);
        hasErrors = true;
      }
    }

    if (!editFormData.remarks || editFormData.remarks.trim() === '') {
      setRemarksValid(false);
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Create clean payload excluding _id and using the date from the current view
      const { _id, date: _, pouringStartHour, pouringStartMinute, pouringEndHour, pouringEndMinute, 
              tappingHour, tappingMinute, timeOfPouring: oldPouring, tappingTime: oldTapping, ...cleanData } = editFormData;
      
      // Pad time values with leading zeros - keep existing format if already 2 digits
      const padTime = (val) => {
        if (!val || val === '') return '00';
        const str = val.toString();
        return str.length === 1 ? '0' + str : str;
      };
      
      const timeOfPouring = `${padTime(pouringStartHour)}:${padTime(pouringStartMinute)} - ${padTime(pouringEndHour)}:${padTime(pouringEndMinute)}`;
      const tappingTime = `${padTime(tappingHour)}:${padTime(tappingMinute)}`;
      
      const updatePayload = {
        ...cleanData,
        date: date, // Use the date from the current view (required by backend)
        disa: editFormData.disa,
        timeOfPouring,
        tappingTime
      };
      
      const response = await fetch(`/v1/process/${selectedItem._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updatePayload)
      });
      
      const data = await response.json();

      if (data.success) {
        // Update the currentEntries with the data from the response
        // The backend returns the full document with all entries
        if (data.data && data.data.entries) {
          // Filter entries by DISA if needed and map with date
          const updatedEntries = data.data.entries.filter(entry => {
            const matchesDisa = !disa || entry.disa === disa;
            return matchesDisa;
          }).map(entry => ({
            _id: entry._id,
            date: data.data.date,
            disa: entry.disa,
            partName: entry.partName,
            datecode: entry.datecode,
            heatcode: entry.heatcode,
            quantityOfMoulds: entry.quantityOfMoulds,
            metalCompositionC: entry.metalCompositionC,
            metalCompositionSi: entry.metalCompositionSi,
            metalCompositionMn: entry.metalCompositionMn,
            metalCompositionP: entry.metalCompositionP,
            metalCompositionS: entry.metalCompositionS,
            metalCompositionMgFL: entry.metalCompositionMgFL,
            metalCompositionCu: entry.metalCompositionCu,
            metalCompositionCr: entry.metalCompositionCr,
            timeOfPouring: entry.timeOfPouring,
            pouringTemperature: entry.pouringTemperature,
            ppCode: entry.ppCode,
            treatmentNo: entry.treatmentNo,
            fcNo: entry.fcNo,
            heatNo: entry.heatNo,
            conNo: entry.conNo,
            tappingTime: entry.tappingTime,
            correctiveAdditionC: entry.correctiveAdditionC,
            correctiveAdditionSi: entry.correctiveAdditionSi,
            correctiveAdditionMn: entry.correctiveAdditionMn,
            correctiveAdditionS: entry.correctiveAdditionS,
            correctiveAdditionCr: entry.correctiveAdditionCr,
            correctiveAdditionCu: entry.correctiveAdditionCu,
            correctiveAdditionSn: entry.correctiveAdditionSn,
            tappingWt: entry.tappingWt,
            mg: entry.mg,
            resMgConvertor: entry.resMgConvertor,
            recOfMg: entry.recOfMg,
            streamInoculant: entry.streamInoculant,
            pTime: entry.pTime,
            remarks: entry.remarks
          }));
          
          // Force re-render by creating a completely new array
          setCurrentEntries([...updatedEntries]);
          setTableKey(Date.now());
        }
        setShowEditModal(false);
      } else {
        alert('Failed to update entry: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating process entry:', error);
      alert('Failed to update entry: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (item) => {
    setDeleteItemId(item._id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/v1/process/${deleteItemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setShowDeleteConfirm(false);
        setDeleteItemId(null);
        refreshData();
        
        // If no entries left after deletion, navigate back
        const updatedEntries = currentEntries.filter(entry => entry._id !== deleteItemId);
        if (updatedEntries.length === 0) {
          navigate('/process/report');
        }
      } else {
        alert('Failed to delete entry: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting process entry:', error);
      alert('Failed to delete entry: ' + (error.message || 'Unknown error'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeleteItemId(null);
  };

  const handleInputChange = (field, value) => {
    // Validate Part Name
    if (field === 'partName') {
      if (value.trim() === '') {
        setPartNameValid(null);
      } else {
        setPartNameValid(value.trim().length > 0);
      }
    }
    
    // Validate Date Code - specific format (e.g., 6F25)
    if (field === 'datecode') {
      const pattern = /^[0-9][A-Z][0-9]{2}$/;
      if (value.trim() === '') {
        setDatecodeValid(null);
      } else {
        setDatecodeValid(pattern.test(value));
      }
    }
    
    // Validate Heat Code
    if (field === 'heatcode') {
      if (value.trim() === '') {
        setHeatcodeValid(null);
      } else {
        setHeatcodeValid(value.trim().length > 0);
      }
    }
    
    // Validate Quantity of Moulds
    if (field === 'quantityOfMoulds') {
      if (value.trim() === '') {
        setQuantityOfMouldsValid(null);
      } else {
        setQuantityOfMouldsValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    
    // Metal Composition validations
    if (field === 'metalCompositionC') {
      if (value.trim() === '') {
        setMetalCValid(null);
      } else {
        setMetalCValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'metalCompositionSi') {
      if (value.trim() === '') {
        setMetalSiValid(null);
      } else {
        setMetalSiValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'metalCompositionMn') {
      if (value.trim() === '') {
        setMetalMnValid(null);
      } else {
        setMetalMnValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'metalCompositionP') {
      if (value.trim() === '') {
        setMetalPValid(null);
      } else {
        setMetalPValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'metalCompositionS') {
      if (value.trim() === '') {
        setMetalSValid(null);
      } else {
        setMetalSValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'metalCompositionMgFL') {
      if (value.trim() === '') {
        setMetalMgFLValid(null);
      } else {
        setMetalMgFLValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'metalCompositionCu') {
      if (value.trim() === '') {
        setMetalCuValid(null);
      } else {
        setMetalCuValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'metalCompositionCr') {
      if (value.trim() === '') {
        setMetalCrValid(null);
      } else {
        setMetalCrValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    
    // Time of Pouring (text format like "10:30 - 11:45")
    if (field === 'timeOfPouring') {
      if (value.trim() === '') {
        setTimeOfPouringValid(null);
      } else {
        setTimeOfPouringValid(value.trim().length > 0);
      }
    }
    
    // Pouring Temperature
    if (field === 'pouringTemperature') {
      if (value.trim() === '') {
        setPouringTempValid(null);
      } else {
        setPouringTempValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }
    
    // Corrective Addition validations
    if (field === 'correctiveAdditionC') {
      if (value.trim() === '') {
        setCorrCValid(null);
      } else {
        setCorrCValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'correctiveAdditionSi') {
      if (value.trim() === '') {
        setCorrSiValid(null);
      } else {
        setCorrSiValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'correctiveAdditionMn') {
      if (value.trim() === '') {
        setCorrMnValid(null);
      } else {
        setCorrMnValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'correctiveAdditionS') {
      if (value.trim() === '') {
        setCorrSValid(null);
      } else {
        setCorrSValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'correctiveAdditionCr') {
      if (value.trim() === '') {
        setCorrCrValid(null);
      } else {
        setCorrCrValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'correctiveAdditionCu') {
      if (value.trim() === '') {
        setCorrCuValid(null);
      } else {
        setCorrCuValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'correctiveAdditionSn') {
      if (value.trim() === '') {
        setCorrSnValid(null);
      } else {
        setCorrSnValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    
    // Validate Remarks
    if (field === 'remarks') {
      if (value.trim() === '') {
        setRemarksValid(null);
      } else {
        setRemarksValid(value.trim().length > 0);
      }
    }
    
    // Optional text fields - only validate if not empty
    if (field === 'ppCode') {
      const numericPattern = /^\d+$/;
      if (value.trim() === '') {
        setPpCodeValid(null);
      } else {
        setPpCodeValid(numericPattern.test(value));
      }
    }
    if (field === 'treatmentNo') {
      const numericPattern = /^\d+$/;
      if (value.trim() === '') {
        setTreatmentNoValid(null);
      } else {
        setTreatmentNoValid(numericPattern.test(value));
      }
    }
    if (field === 'fcNo') {
      if (value.trim() === '') {
        setFcNoValid(null);
      } else {
        setFcNoValid(value.trim().length > 0);
      }
    }
    if (field === 'heatNo') {
      if (value.trim() === '') {
        setHeatNoValid(null);
      } else {
        setHeatNoValid(value.trim().length > 0);
      }
    }
    if (field === 'conNo') {
      const numericPattern = /^\d+$/;
      if (value.trim() === '') {
        setConNoValid(null);
      } else {
        setConNoValid(numericPattern.test(value));
      }
    }
    
    // Handle time input fields with proper formatting
    if (field === 'pouringStartHour' || field === 'pouringEndHour' || field === 'tappingHour') {
      // Remove non-numeric characters and limit to 2 digits
      let cleaned = value.replace(/[^0-9]/g, '').slice(0, 2);
      
      // Ensure it's a valid hour (0-12)
      if (cleaned) {
        const hour = parseInt(cleaned, 10);
        if (hour > 12) {
          cleaned = cleaned.slice(0, 1); // If > 12, keep only first digit
        }
      }
      
      // Update form data and validate pouring time
      const updatedData = { ...editFormData, [field]: cleaned };
      
      // Validate pouring time
      if (field.includes('pouring')) {
        const hasStartTime = !!(updatedData.pouringStartHour && updatedData.pouringStartMinute);
        const hasEndTime = !!(updatedData.pouringEndHour && updatedData.pouringEndMinute);
        const allEmpty = !updatedData.pouringStartHour && !updatedData.pouringStartMinute && 
                         !updatedData.pouringEndHour && !updatedData.pouringEndMinute;
        
        if (allEmpty) {
          setTimeOfPouringValid(null);
        } else if (hasStartTime && hasEndTime) {
          setTimeOfPouringValid(true);
        } else {
          setTimeOfPouringValid(false);
        }
      }
      
      // Validate tapping time
      if (field === 'tappingHour') {
        const hasTappingTime = !!(updatedData.tappingHour && updatedData.tappingMinute);
        const allEmpty = !updatedData.tappingHour && !updatedData.tappingMinute;
        
        if (allEmpty) {
          setTappingTimeValid(null);
        } else if (hasTappingTime) {
          setTappingTimeValid(true);
        } else {
          setTappingTimeValid(false);
        }
      }
      
      setEditFormData(updatedData);
      return;
    }
    
    if (field === 'pouringStartMinute' || field === 'pouringEndMinute' || field === 'tappingMinute') {
      // Remove non-numeric characters and limit to 2 digits
      let cleaned = value.replace(/[^0-9]/g, '').slice(0, 2);
      
      // Ensure it's a valid minute (0-59)
      if (cleaned.length === 2) {
        const minute = parseInt(cleaned, 10);
        if (minute > 59) cleaned = '59';
      }
      
      // Update form data and validate time
      const updatedData = { ...editFormData, [field]: cleaned };
      
      // Validate pouring time
      if (field.includes('pouring')) {
        const hasStartTime = !!(updatedData.pouringStartHour && updatedData.pouringStartMinute);
        const hasEndTime = !!(updatedData.pouringEndHour && updatedData.pouringEndMinute);
        const allEmpty = !updatedData.pouringStartHour && !updatedData.pouringStartMinute && 
                         !updatedData.pouringEndHour && !updatedData.pouringEndMinute;
        
        if (allEmpty) {
          setTimeOfPouringValid(null);
        } else if (hasStartTime && hasEndTime) {
          setTimeOfPouringValid(true);
        } else {
          setTimeOfPouringValid(false);
        }
      }
      
      // Validate tapping time
      if (field === 'tappingMinute') {
        const hasTappingTime = !!(updatedData.tappingHour && updatedData.tappingMinute);
        const allEmpty = !updatedData.tappingHour && !updatedData.tappingMinute;
        
        if (allEmpty) {
          setTappingTimeValid(null);
        } else if (hasTappingTime) {
          setTappingTimeValid(true);
        } else {
          setTappingTimeValid(false);
        }
      }
      
      setEditFormData(updatedData);
      return;
    }
    
    if (field === 'tappingTime') {
      if (value.trim() === '') {
        setTappingTimeValid(null);
      } else {
        setTappingTimeValid(value.trim().length > 0);
      }
    }
    
    // Optional numeric fields - only validate if not empty
    if (field === 'tappingWt') {
      if (value.trim() === '') {
        setTappingWtValid(null);
      } else {
        setTappingWtValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'mg') {
      if (value.trim() === '') {
        setMgValid(null);
      } else {
        setMgValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'resMgConvertor') {
      if (value.trim() === '') {
        setResMgConvertorValid(null);
      } else {
        setResMgConvertorValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'recOfMg') {
      if (value.trim() === '') {
        setRecOfMgValid(null);
      } else {
        setRecOfMgValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'streamInoculant') {
      if (value.trim() === '') {
        setStreamInoculantValid(null);
      } else {
        setStreamInoculantValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'pTime') {
      if (value.trim() === '') {
        setPTimeValid(null);
      } else {
        setPTimeValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentEntries || currentEntries.length === 0) {
    return null;
  }

  return (
    <>
      <div className="process-entries-header">
        <div className="process-entries-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Process Control - Report
          </h2>
        </div>
        <button className="process-entries-back-btn" onClick={() => navigate('/process/report')}>
          <ArrowLeft size={18} />
          Back to Cards
        </button>
      </div>

      <div className="process-entries-info">
        <div className="process-entries-info-item">
          <span className="process-entries-info-label">Date:</span>
          <span className="process-entries-info-value">{formatDate(date)}</span>
        </div>
        <div className="process-entries-info-item">
          <span className="process-entries-info-label">DISA:</span>
          <span className="process-entries-info-value">{disa || '-'}</span>
        </div>
      </div>

      <Table
        key={tableKey}
        columns={[
          { key: 'partName', label: 'Part Name', width: '150px',align:'center' },
          { key: 'datecode', label: 'Date Code', width: '100px', align: 'center' },
          { key: 'heatcode', label: 'Heat Code', width: '100px', align: 'center' },
          { key: 'quantityOfMoulds', label: 'Qty. Of Moulds', width: '120px', align: 'center' },
          { key: 'metalCompositionC', label: 'C', width: '70px', align: 'center' },
          { key: 'metalCompositionSi', label: 'Si', width: '70px', align: 'center' },
          { key: 'metalCompositionMn', label: 'Mn', width: '70px', align: 'center' },
          { key: 'metalCompositionP', label: 'P', width: '70px', align: 'center' },
          { key: 'metalCompositionS', label: 'S', width: '70px', align: 'center' },
          { key: 'metalCompositionMgFL', label: 'Mg FL', width: '80px', align: 'center' },
          { key: 'metalCompositionCu', label: 'Cu', width: '70px', align: 'center' },
          { key: 'metalCompositionCr', label: 'Cr', width: '70px', align: 'center' },
          { key: 'timeOfPouring', label: 'Time Of Pouring', width: '130px', align: 'center' },
          { key: 'pouringTemperature', label: 'Pouring Temp', width: '110px', align: 'center' },
          { key: 'ppCode', label: 'PP Code', width: '90px', align: 'center' },
          { key: 'treatmentNo', label: 'Treatment No', width: '110px', align: 'center' },
          { key: 'fcNo', label: 'FC No', width: '80px', align: 'center' },
          { key: 'heatNo', label: 'Heat No', width: '90px', align: 'center' },
          { key: 'conNo', label: 'Con No', width: '80px', align: 'center' },
          { key: 'tappingTime', label: 'Tapping Time', width: '110px', align: 'center' },
          { key: 'correctiveAdditionC', label: 'Corr. Add C', width: '100px', align: 'center' },
          { key: 'correctiveAdditionSi', label: 'Corr. Add Si', width: '100px', align: 'center' },
          { key: 'correctiveAdditionMn', label: 'Corr. Add Mn', width: '110px', align: 'center' },
          { key: 'correctiveAdditionS', label: 'Corr. Add S', width: '100px', align: 'center' },
          { key: 'correctiveAdditionCr', label: 'Corr. Add Cr', width: '100px', align: 'center' },
          { key: 'correctiveAdditionCu', label: 'Corr. Add Cu', width: '110px', align: 'center' },
          { key: 'correctiveAdditionSn', label: 'Corr. Add Sn', width: '110px', align: 'center' },
          { key: 'tappingWt', label: 'Tapping Wt', width: '100px', align: 'center' },
          { key: 'mg', label: 'Mg', width: '70px', align: 'center' },
          { key: 'resMgConvertor', label: 'Res Mg Convertor', width: '140px', align: 'center' },
          { key: 'recOfMg', label: 'Rec Of Mg', width: '100px', align: 'center' },
          { key: 'streamInoculant', label: 'Stream Inoculant', width: '140px', align: 'center' },
          { key: 'pTime', label: 'P Time', width: '80px', align: 'center' },
          { key: 'remarks', label: 'Remarks', width: '200px',align: 'center' }
        ]}
        data={currentEntries}
        minWidth={3800} //Table width
        defaultAlign="left"
        renderActions={(item) => (
          <>
            <EditButton onClick={() => handleEdit(item)} />
            <DeleteButton onClick={() => handleDelete(item)} />
          </>
        )}
        noDataMessage="No process entries found"
      />

      {/* Edit Modal */}
      <EditCard
        isOpen={showEditModal}
        onClose={handleCloseEdit}
        departmentName="Process"
        onSave={handleSaveEdit}
      >
        <div className="process-edit-form">
          <div className="process-edit-row">
            <div className="process-edit-field">
              <label>Part Name</label>
              <input
                type="text"
                value={editFormData.partName || ''}
                onChange={(e) => handleInputChange('partName', e.target.value)}
                className={
                  partNameValid === null
                    ? ""
                    : partNameValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-edit-field">
              <label>Date Code</label>
              <input
                type="text"
                value={editFormData.datecode || ''}
                onChange={(e) => handleInputChange('datecode', e.target.value)}
                className={
                  datecodeValid === null
                    ? ""
                    : datecodeValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-edit-field">
              <label>Heat Code</label>
              <input
                type="text"
                value={editFormData.heatcode || ''}
                onChange={(e) => handleInputChange('heatcode', e.target.value)}
                className={
                  heatcodeValid === null
                    ? ""
                    : heatcodeValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
          </div>

          <div className="process-edit-row">
            <div className="process-edit-field">
              <label>Qty. Of Moulds</label>
              <input
                type="number"
                step="1"
                min="0"
                value={editFormData.quantityOfMoulds || ''}
                onChange={(e) => handleInputChange('quantityOfMoulds', e.target.value)}
                onInput={(e) => {
                  // Prevent decimal input - only allow integers
                  e.target.value = e.target.value.replace(/[^0-9]/g, '');
                }}
                className={
                  quantityOfMouldsValid === null
                    ? ""
                    : quantityOfMouldsValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-edit-field" style={{ gridColumn: '1 / -1' }}>
              <label>Time Of Pouring</label>
              <TimeRangeInput
                startHourValue={editFormData.pouringStartHour || ''}
                startMinuteValue={editFormData.pouringStartMinute || ''}
                endHourValue={editFormData.pouringEndHour || ''}
                endMinuteValue={editFormData.pouringEndMinute || ''}
                startHourName="pouringStartHour"
                startMinuteName="pouringStartMinute"
                endHourName="pouringEndHour"
                endMinuteName="pouringEndMinute"
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                validationState={timeOfPouringValid}
              />
            </div>
            <div className="process-edit-field">
              <label>Pouring Temp</label>
              <input
                type="text"
                inputMode="decimal"
                value={editFormData.pouringTemperature || ''}
                onChange={(e) => handleInputChange('pouringTemperature', e.target.value)}
                className={
                  pouringTempValid === null
                    ? ""
                    : pouringTempValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
          </div>

          <div className="process-edit-section">
            <h4>Metal Composition</h4>
            <div className="process-edit-row">
              <div className="process-edit-field">
                <label>C</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.metalCompositionC || ''}
                  onChange={(e) => handleInputChange('metalCompositionC', e.target.value)}
                  className={
                    metalCValid === null
                      ? ""
                      : metalCValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Si</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.metalCompositionSi || ''}
                  onChange={(e) => handleInputChange('metalCompositionSi', e.target.value)}
                  className={
                    metalSiValid === null
                      ? ""
                      : metalSiValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Mn</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.metalCompositionMn || ''}
                  onChange={(e) => handleInputChange('metalCompositionMn', e.target.value)}
                  className={
                    metalMnValid === null
                      ? ""
                      : metalMnValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>P</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.metalCompositionP || ''}
                  onChange={(e) => handleInputChange('metalCompositionP', e.target.value)}
                  className={
                    metalPValid === null
                      ? ""
                      : metalPValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
            </div>
            <div className="process-edit-row">
              <div className="process-edit-field">
                <label>S</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.metalCompositionS || ''}
                  onChange={(e) => handleInputChange('metalCompositionS', e.target.value)}
                  className={
                    metalSValid === null
                      ? ""
                      : metalSValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Mg FL</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.metalCompositionMgFL || ''}
                  onChange={(e) => handleInputChange('metalCompositionMgFL', e.target.value)}
                  className={
                    metalMgFLValid === null
                      ? ""
                      : metalMgFLValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Cu</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.metalCompositionCu || ''}
                  onChange={(e) => handleInputChange('metalCompositionCu', e.target.value)}
                  className={
                    metalCuValid === null
                      ? ""
                      : metalCuValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Cr</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.metalCompositionCr || ''}
                  onChange={(e) => handleInputChange('metalCompositionCr', e.target.value)}
                  className={
                    metalCrValid === null
                      ? ""
                      : metalCrValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
            </div>
          </div>

          <div className="process-edit-section">
            <h4>Corrective Addition</h4>
            <div className="process-edit-row">
              <div className="process-edit-field">
                <label>C</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.correctiveAdditionC || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionC', e.target.value)}
                  className={
                    corrCValid === null
                      ? ""
                      : corrCValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Si</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.correctiveAdditionSi || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionSi', e.target.value)}
                  className={
                    corrSiValid === null
                      ? ""
                      : corrSiValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Mn</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.correctiveAdditionMn || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionMn', e.target.value)}
                  className={
                    corrMnValid === null
                      ? ""
                      : corrMnValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>S</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.correctiveAdditionS || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionS', e.target.value)}
                  className={
                    corrSValid === null
                      ? ""
                      : corrSValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
            </div>
            <div className="process-edit-row">
              <div className="process-edit-field">
                <label>Cr</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.correctiveAdditionCr || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionCr', e.target.value)}
                  className={
                    corrCrValid === null
                      ? ""
                      : corrCrValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Cu</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.correctiveAdditionCu || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionCu', e.target.value)}
                  className={
                    corrCuValid === null
                      ? ""
                      : corrCuValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Sn</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.correctiveAdditionSn || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionSn', e.target.value)}
                  className={
                    corrSnValid === null
                      ? ""
                      : corrSnValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
            </div>
          </div>

          <div className="process-edit-section">
            <h4>Additional Information</h4>
            <div className="process-edit-row">
              <div className="process-edit-field">
                <label>PP Code</label>
                <input
                  type="text"
                  value={editFormData.ppCode || ''}
                  onChange={(e) => handleInputChange('ppCode', e.target.value)}
                  className={
                    ppCodeValid === null
                      ? ""
                      : ppCodeValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Treatment No</label>
                <input
                  type="text"
                  value={editFormData.treatmentNo || ''}
                  onChange={(e) => handleInputChange('treatmentNo', e.target.value)}
                  className={
                    treatmentNoValid === null
                      ? ""
                      : treatmentNoValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>FC No</label>
                <select
                  value={editFormData.fcNo || ''}
                  onChange={(e) => handleInputChange('fcNo', e.target.value)}
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
            </div>
            <div className="process-edit-row">
              <div className="process-edit-field">
                <label>Heat No</label>
                <input
                  type="text"
                  value={editFormData.heatNo || ''}
                  onChange={(e) => handleInputChange('heatNo', e.target.value)}
                  className={
                    heatNoValid === null
                      ? ""
                      : heatNoValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Con No</label>
                <input
                  type="text"
                  value={editFormData.conNo || ''}
                  onChange={(e) => handleInputChange('conNo', e.target.value)}
                  className={
                    conNoValid === null
                      ? ""
                      : conNoValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field" style={{ gridColumn: '1 / -1' }}>
                <label>Tapping Time</label>
                <TimeInput
                  hourValue={editFormData.tappingHour || ''}
                  minuteValue={editFormData.tappingMinute || ''}
                  hourName="tappingHour"
                  minuteName="tappingMinute"
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                  validationState={tappingTimeValid}
                />
              </div>
            </div>
          </div>

          <div className="process-edit-section">
            <h4>Treatment Details</h4>
            <div className="process-edit-row">
              <div className="process-edit-field">
                <label>Tapping Wt</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.tappingWt || ''}
                  onChange={(e) => handleInputChange('tappingWt', e.target.value)}
                  className={
                    tappingWtValid === null
                      ? ""
                      : tappingWtValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Mg</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.mg || ''}
                  onChange={(e) => handleInputChange('mg', e.target.value)}
                  className={
                    mgValid === null
                      ? ""
                      : mgValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Res Mg Convertor</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.resMgConvertor || ''}
                  onChange={(e) => handleInputChange('resMgConvertor', e.target.value)}
                  className={
                    resMgConvertorValid === null
                      ? ""
                      : resMgConvertorValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
            </div>
            <div className="process-edit-row">
              <div className="process-edit-field">
                <label>Rec of Mg</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.recOfMg || ''}
                  onChange={(e) => handleInputChange('recOfMg', e.target.value)}
                  className={
                    recOfMgValid === null
                      ? ""
                      : recOfMgValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Stream Inoculant</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.streamInoculant || ''}
                  onChange={(e) => handleInputChange('streamInoculant', e.target.value)}
                  className={
                    streamInoculantValid === null
                      ? ""
                      : streamInoculantValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>P Time</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.pTime || ''}
                  onChange={(e) => handleInputChange('pTime', e.target.value)}
                  className={
                    pTimeValid === null
                      ? ""
                      : pTimeValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
            </div>
          </div>

          <div className="process-edit-row">
            <div className="process-edit-field">
              <label>Remarks</label>
              <textarea
                value={editFormData.remarks || ''}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                rows="3"
                className={
                  remarksValid === null
                    ? ""
                    : remarksValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
          </div>
        </div>
      </EditCard>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmCard
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        departmentName="Process"
        loading={deleteLoading}
      />
    </>
  );
};

export default ProcessReportEntries;
