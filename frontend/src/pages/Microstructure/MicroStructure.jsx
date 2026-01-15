import { useState, useRef, useEffect } from 'react';
import { Save, RefreshCw, Loader2 } from 'lucide-react';
import { SuccessPopup } from '../../Components/PopUp';
import { DisaDropdown } from '../../Components/Buttons';
import '../../styles/PageStyles/MicroStructure/MicroStructure.css';
import '../../styles/PageStyles/Impact/Impact.css';

const MicroStructure = () => {

  // ====================== State ======================
  const [formData, setFormData] = useState({
    date: '',
    disa: '',
    partName: '',
    dateCode: '',
    heatCode: '',
    nodularity: '',
    graphiteType: '',
    countNosFrom: '',
    countNosTo: '',
    sizeFrom: '',
    sizeTo: '',
    ferriteFrom: '',
    ferriteTo: '',
    pearliteFrom: '',
    pearliteTo: '',
    carbide: '',
    remarks: ''
  });

  // VALIDATION STATES
  const [disaValid, setDisaValid] = useState(null);
  const [partNameValid, setPartNameValid] = useState(null);
  const [dateCodeValid, setDateCodeValid] = useState(null);
  const [heatCodeValid, setHeatCodeValid] = useState(null);
  const [nodularityValid, setNodularityValid] = useState(null);
  const [graphiteTypeValid, setGraphiteTypeValid] = useState(null);
  const [countNosFromValid, setCountNosFromValid] = useState(null);
  const [countNosToValid, setCountNosToValid] = useState(null);
  const [sizeFromValid, setSizeFromValid] = useState(null);
  const [sizeToValid, setSizeToValid] = useState(null);
  const [ferriteFromValid, setFerriteFromValid] = useState(null);
  const [ferriteToValid, setFerriteToValid] = useState(null);
  const [pearliteFromValid, setPearliteFromValid] = useState(null);
  const [pearliteToValid, setPearliteToValid] = useState(null);
  const [carbideValid, setCarbideValid] = useState(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [dateLoading, setDateLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');

  // Success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Refs
  const submitButtonRef = useRef(null);
  const firstInputRef = useRef(null);

  // ====================== Fetch current date ======================
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setDateLoading(true);

        const dateData = await api.get('/v1/micro-structure/current-date');
        if (dateData.success && dateData.date) {
          setFormData(prev => ({ ...prev, date: dateData.date }));
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);

        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        setFormData(prev => ({ ...prev, date: `${y}-${m}-${d}` }));
      } finally {
        setDateLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // ====================== Format date ======================
  const formatDisplayDate = (iso) => {
    if (!iso || typeof iso !== 'string' || !iso.includes('-')) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  // ====================== Handle input change ======================
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "date") return;

    // --- VALIDATE DISA: required ---
    if (name === "disa") {
      setDisaValid(value.trim() !== '');
    }

    // --- VALIDATE PART NAME: alphabets and spaces ---
    if (name === "partName") {
      const pattern = /^[A-Za-z\s]+$/;
      setPartNameValid(
        value.trim() === "" ? null : pattern.test(value)
      );
    }

    // --- VALIDATE DATE CODE: specific format (e.g., 6F25) ---
    if (name === "dateCode") {
      const pattern = /^[0-9][A-Z][0-9]{2}$/;
      setDateCodeValid(
        value.trim() === "" ? null : pattern.test(value)
      );
    }

    // --- VALIDATE HEAT CODE: required ---
    if (name === "heatCode") {
      setHeatCodeValid(
        value.trim() === "" ? null : value.trim().length > 0
      );
    }

    // --- VALIDATE NODULARITY: number 0-100 ---
    if (name === "nodularity") {
      const num = parseFloat(value);
      setNodularityValid(
        value.trim() === "" ? null : !isNaN(num) && num >= 0 && num <= 100
      );
    }

    // --- VALIDATE GRAPHITE TYPE: number 0-100 ---
    if (name === "graphiteType") {
      const num = parseFloat(value);
      setGraphiteTypeValid(
        value.trim() === "" ? null : !isNaN(num) && num >= 0 && num <= 100
      );
    }

    // --- VALIDATE COUNT NOS FROM & TO: numbers only ---
    if (name === "countNosFrom") {
      const num = parseFloat(value);
      setCountNosFromValid(
        value.trim() === "" ? null : !isNaN(num) && num >= 0
      );
    }

    if (name === "countNosTo") {
      const num = parseFloat(value);
      setCountNosToValid(
        value.trim() === "" ? null : !isNaN(num) && num >= 0
      );
    }

    // --- VALIDATE SIZE FROM & TO: numbers only ---
    if (name === "sizeFrom") {
      const num = parseFloat(value);
      setSizeFromValid(
        value.trim() === "" ? null : !isNaN(num) && num >= 0
      );
    }

    if (name === "sizeTo") {
      const num = parseFloat(value);
      setSizeToValid(
        value.trim() === "" ? null : !isNaN(num) && num >= 0
      );
    }

    // --- VALIDATE FERRITE FROM & TO: number 0-100 ---
    if (name === "ferriteFrom") {
      const num = parseFloat(value);
      setFerriteFromValid(
        value.trim() === "" ? null : !isNaN(num) && num >= 0 && num <= 100
      );
    }

    if (name === "ferriteTo") {
      const num = parseFloat(value);
      setFerriteToValid(
        value.trim() === "" ? null : !isNaN(num) && num >= 0 && num <= 100
      );
    }

    // --- VALIDATE PEARLITE FROM & TO: number 0-100 ---
    if (name === "pearliteFrom") {
      const num = parseFloat(value);
      setPearliteFromValid(
        value.trim() === "" ? null : !isNaN(num) && num >= 0 && num <= 100
      );
    }

    if (name === "pearliteTo") {
      const num = parseFloat(value);
      setPearliteToValid(
        value.trim() === "" ? null : !isNaN(num) && num >= 0 && num <= 100
      );
    }

    // --- VALIDATE CARBIDE: number 0-100 ---
    if (name === "carbide") {
      const num = parseFloat(value);
      setCarbideValid(
        value.trim() === "" ? null : !isNaN(num) && num >= 0 && num <= 100
      );
    }

    // Auto-uppercase dateCode
    const finalValue = name === 'dateCode' ? value.toUpperCase() : value;

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  // ====================== Enter Key Navigation ======================
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = e.target.form;
      const inputs = Array.from(form.querySelectorAll('input, textarea, select'));
      const currentIndex = inputs.indexOf(e.target);
      const nextInput = inputs[currentIndex + 1];

      if (nextInput) {
        nextInput.focus();
      } else {
        if (submitButtonRef.current) submitButtonRef.current.focus();
      }
    }
  };

  // ====================== Submit ======================
  const handleSubmitButtonKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    // Clear any previous error
    setSubmitError('');

    // Validate required fields
    const requiredFields = [
      { name: 'disa', value: formData.disa, label: 'DISA', setState: setDisaValid },
      { name: 'partName', value: formData.partName, label: 'Part Name', setState: setPartNameValid },
      { name: 'dateCode', value: formData.dateCode, label: 'Date Code', setState: setDateCodeValid },
      { name: 'heatCode', value: formData.heatCode, label: 'Heat Code', setState: setHeatCodeValid },
      { name: 'nodularity', value: formData.nodularity, label: 'Nodularity', setState: setNodularityValid },
      { name: 'graphiteType', value: formData.graphiteType, label: 'Graphite Type', setState: setGraphiteTypeValid },
      { name: 'countNosFrom', value: formData.countNosFrom, label: 'Count Nos From', setState: setCountNosFromValid },
      { name: 'countNosTo', value: formData.countNosTo, label: 'Count Nos To', setState: setCountNosToValid },
      { name: 'sizeFrom', value: formData.sizeFrom, label: 'Size From', setState: setSizeFromValid },
      { name: 'sizeTo', value: formData.sizeTo, label: 'Size To', setState: setSizeToValid },
      { name: 'ferriteFrom', value: formData.ferriteFrom, label: 'Ferrite From', setState: setFerriteFromValid },
      { name: 'ferriteTo', value: formData.ferriteTo, label: 'Ferrite To', setState: setFerriteToValid },
      { name: 'pearliteFrom', value: formData.pearliteFrom, label: 'Pearlite From', setState: setPearliteFromValid },
      { name: 'pearliteTo', value: formData.pearliteTo, label: 'Pearlite To', setState: setPearliteToValid },
      { name: 'carbide', value: formData.carbide, label: 'Carbide', setState: setCarbideValid }
    ];

    const emptyFields = requiredFields.filter(field => !field.value || field.value.toString().trim() === '');

    if (emptyFields.length > 0) {
      // Highlight all empty required fields in red
      emptyFields.forEach(field => {
        field.setState(false);
      });

      // Set error message
      setSubmitError('Please fill in all required fields');

      // Clear error message after 3 seconds
      setTimeout(() => {
        setSubmitError('');
      }, 3000);

      return;
    }

    try {
      setSubmitLoading(true);
      const data = await api.post('/v1/micro-structure', formData);

      if (data.success) {
        // Show success popup
        setShowSuccessPopup(true);

        const dateData = await api.get('/v1/micro-structure/current-date');
        const currentDate = dateData.success && dateData.date ? dateData.date : formData.date;

        // Reset form
        setFormData({
          date: currentDate,
          disa: '',
          partName: '',
          dateCode: '',
          heatCode: '',
          nodularity: '',
          graphiteType: '',
          countNosFrom: '',
          countNosTo: '',
          sizeFrom: '',
          sizeTo: '',
          ferriteFrom: '',
          ferriteTo: '',
          pearliteFrom: '',
          pearliteTo: '',
          carbide: '',
          remarks: ''
        });

        // Reset validation states
        setDisaValid(null);
        setPartNameValid(null);
        setDateCodeValid(null);
        setHeatCodeValid(null);
        setNodularityValid(null);
        setGraphiteTypeValid(null);
        setCountNosFromValid(null);
        setCountNosToValid(null);
        setSizeFromValid(null);
        setSizeToValid(null);
        setFerriteFromValid(null);
        setFerriteToValid(null);
        setPearliteFromValid(null);
        setPearliteToValid(null);
        setCarbideValid(null);

        setTimeout(() => {
          firstInputRef.current?.focus();
        }, 100);
      }
    } catch (error) {
      console.error('Error creating micro structure test:', error);
      alert('Failed to create entry: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitLoading(false);
    }
  };

  // ====================== Reset ======================
  const handleReset = async () => {
    try {
      const dateData = await api.get('/v1/micro-structure/current-date');
      const currentDate = dateData.success && dateData.date ? dateData.date : formData.date;

      setFormData({
        date: currentDate,
        disa: '',
        partName: '',
        dateCode: '',
        heatCode: '',
        nodularity: '',
        graphiteType: '',
        countNosFrom: '',
        countNosTo: '',
        sizeFrom: '',
        sizeTo: '',
        ferriteFrom: '',
        ferriteTo: '',
        pearliteFrom: '',
        pearliteTo: '',
        carbide: '',
        remarks: ''
      });

      setDisaValid(null);
      setPartNameValid(null);
      setDateCodeValid(null);
      setHeatCodeValid(null);
      setNodularityValid(null);
      setGraphiteTypeValid(null);
      setCountNosFromValid(null);
      setCountNosToValid(null);
      setSizeFromValid(null);
      setSizeToValid(null);
      setFerriteFromValid(null);
      setFerriteToValid(null);
      setPearliteFromValid(null);
      setPearliteToValid(null);
      setCarbideValid(null);

    } catch (error) {
      console.error('Error resetting form:', error);

      setFormData({
        date: formData.date,
        disa: '',
        partName: '',
        dateCode: '',
        heatCode: '',
        nodularity: '',
        graphiteType: '',
        countNosFrom: '',
        countNosTo: '',
        sizeFrom: '',
        sizeTo: '',
        ferriteFrom: '',
        ferriteTo: '',
        pearliteFrom: '',
        pearliteTo: '',
        carbide: '',
        remarks: ''
      });

      setDisaValid(null);
      setPartNameValid(null);
      setDateCodeValid(null);
      setHeatCodeValid(null);
      setNodularityValid(null);
      setGraphiteTypeValid(null);
      setCountNosFromValid(null);
      setCountNosToValid(null);
      setSizeFromValid(null);
      setSizeToValid(null);
      setFerriteFromValid(null);
      setFerriteToValid(null);
      setPearliteFromValid(null);
      setPearliteToValid(null);
      setCarbideValid(null);
    }
  };

  // ====================== JSX ======================
  return (
    <>
      <div className="microstructure-header">
        <div className="microstructure-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            Micro Structure - Entry Form
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          {dateLoading ? 'Loading date...' : `DATE : ${formatDisplayDate(formData.date)}`}
        </div>
      </div>

      <form className="microstructure-form-grid">
        <div className="microstructure-first-row">
          {/* Row 1: DISA | Part Name | Date Code | Heat Code | Nodularity | Graphite */}
          <div className="microstructure-form-group disa">
            <label>
              DISA <span className="required-indicator">*</span>
            </label>
            <DisaDropdown
              ref={firstInputRef}
              name="disa"
              value={formData.disa}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className={
                disaValid === null
                  ? ""
                  : disaValid
                  ? "valid-input"
                  : "invalid-input"
              }
            />
          </div>

          <div className="microstructure-form-group part-name micro-input-md">
            <label>
              Part Name <span className="required-indicator">*</span>
            </label>
            <input
              type="text"
              name="partName"
              value={formData.partName}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g: Engine Block"
              autoComplete="off"
              className={
                partNameValid === null
                  ? ""
                  : partNameValid
                  ? "valid-input"
                  : "invalid-input"
              }
            />
          </div>

          <div className="microstructure-form-group date-code micro-input-sm">
            <label>Date Code <span className="required-indicator">*</span></label>
            <input
              type="text"
              name="dateCode"
              value={formData.dateCode}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g: 6F25"
              autoComplete="off"
              className={
                dateCodeValid === null
                  ? ""
                  : dateCodeValid
                  ? "valid-input"
                  : "invalid-input"
              }
            />
          </div>

          <div className="microstructure-form-group heat-code micro-input-md">
            <label>Heat Code <span className="required-indicator">*</span></label>
            <input
              type="text"
              name="heatCode"
              value={formData.heatCode}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g: HC-2024-001"
              autoComplete="off"
              className={
                heatCodeValid === null
                  ? ""
                  : heatCodeValid
                  ? "valid-input"
                  : "invalid-input"
              }
            />
          </div>

          <div className="microstructure-form-group nodularity">
            <label>Nodularity % <span className="required-indicator">*</span></label>
            <input
              type="number"
              name="nodularity"
              value={formData.nodularity}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g: 85"
              min="0"
              max="100"
              step="0.1"
              autoComplete="off"
              className={
                nodularityValid === null
                  ? ""
                  : nodularityValid
                  ? "valid-input"
                  : "invalid-input"
              }
            />
          </div>

          <div className="microstructure-form-group graphite-type micro-input-sm">
            <label>Graphite Type % <span className="required-indicator">*</span></label>
            <input
              type="number"
              name="graphiteType"
              value={formData.graphiteType}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g: 15"
              min="0"
              max="100"
              step="0.1"
              autoComplete="off"
              className={
                graphiteTypeValid === null
                  ? ""
                  : graphiteTypeValid
                  ? "valid-input"
                  : "invalid-input"
              }
            />
          </div>
        </div>

        <div className="microstructure-range-row">
          <div className="microstructure-form-group count-nos-range">
            <label>Count Nos/mm² <span className="required-indicator">*</span></label>
            <div className="microstructure-range-inputs">
              <input
                type="number"
                name="countNosFrom"
                value={formData.countNosFrom}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="From"
                min="0"
                step="1"
                autoComplete="off"
                className={
                  countNosFromValid === null
                    ? ""
                    : countNosFromValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
              <span className="range-separator">-</span>
              <input
                type="number"
                name="countNosTo"
                value={formData.countNosTo}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="To"
                min="0"
                step="1"
                autoComplete="off"
                className={
                  countNosToValid === null
                    ? ""
                    : countNosToValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
          </div>

          <div className="microstructure-form-group size-range">
            <label>Size <span className="required-indicator">*</span></label>
            <div className="microstructure-range-inputs">
              <input
                type="number"
                name="sizeFrom"
                value={formData.sizeFrom}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="From"
                min="0"
                step="0.1"
                autoComplete="off"
                className={
                  sizeFromValid === null
                    ? ""
                    : sizeFromValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
              <span className="range-separator">-</span>
              <input
                type="number"
                name="sizeTo"
                value={formData.sizeTo}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="To"
                min="0"
                step="0.1"
                autoComplete="off"
                className={
                  sizeToValid === null
                    ? ""
                    : sizeToValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
          </div>

          <div className="microstructure-form-group ferrite-range">
            <label>Ferrite % <span className="required-indicator">*</span></label>
            <div className="microstructure-range-inputs">
              <input
                type="number"
                name="ferriteFrom"
                value={formData.ferriteFrom}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="From"
                min="0"
                max="100"
                step="0.1"
                autoComplete="off"
                className={
                  ferriteFromValid === null
                    ? ""
                    : ferriteFromValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
              <span className="range-separator">-</span>
              <input
                type="number"
                name="ferriteTo"
                value={formData.ferriteTo}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="To"
                min="0"
                max="100"
                step="0.1"
                autoComplete="off"
                className={
                  ferriteToValid === null
                    ? ""
                    : ferriteToValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
          </div>

          <div className="microstructure-form-group pearlite-range">
            <label>Pearlite % <span className="required-indicator">*</span></label>
            <div className="microstructure-range-inputs">
              <input
                type="number"
                name="pearliteFrom"
                value={formData.pearliteFrom}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="From"
                min="0"
                max="100"
                step="0.1"
                autoComplete="off"
                className={
                  pearliteFromValid === null
                    ? ""
                    : pearliteFromValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
              <span className="range-separator">-</span>
              <input
                type="number"
                name="pearliteTo"
                value={formData.pearliteTo}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="To"
                min="0"
                max="100"
                step="0.1"
                autoComplete="off"
                className={
                  pearliteToValid === null
                    ? ""
                    : pearliteToValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
          </div>
        </div>

        <div className="microstructure-form-group carbide">
          <label>Carbide % <span className="required-indicator">*</span></label>
          <input
            type="number"
            name="carbide"
            value={formData.carbide}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g: 5"
            min="0"
            max="100"
            step="0.1"
            autoComplete="off"
            className={
              carbideValid === null
                ? ""
                : carbideValid
                ? "valid-input"
                : "invalid-input"
            }
          />
        </div>

        {/* Empty cell to maintain grid alignment */}
        <div className="microstructure-form-group"></div>

        {/* Row 4: Remarks - Full width */}
        <div className="microstructure-form-group full-width remarks">
          <label>Remarks</label>
          <input
            type="text"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter any additional notes or observations..."
            maxLength={80}
            autoComplete="off"
          />
        </div>
      </form>

      <div className="microstructure-submit-container">
        <button
          className="microstructure-reset-btn"
          onClick={handleReset}
          type="button"
        >
          <RefreshCw size={18} />
          Reset Form
        </button>

        <div className="microstructure-submit-right">
          {submitError && (
            <span className="microstructure-submit-error">{submitError}</span>
          )}
          <button
            ref={submitButtonRef}
            className="microstructure-submit-btn"
            type="button"
            onClick={handleSubmit}
            onKeyDown={handleSubmitButtonKeyDown}
            disabled={submitLoading}
          >
            {submitLoading ? <Loader2 size={20} className="animate-spin" /> : <Save size={18} />}
            {submitLoading ? 'Saving...' : 'Submit Entry'}
          </button>
        </div>
      </div>

      {/* Success Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        departmentName="Micro Structure"
      />
    </>
  );
};

export default MicroStructure;
