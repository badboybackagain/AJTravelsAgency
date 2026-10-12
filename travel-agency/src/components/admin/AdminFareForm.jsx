import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Car,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { adminFareConfigApi, locationApi, routeApi, vehicleApi, API_BASE_URL } from '../../services/api';
import './admin.css';

export const AdminFareForm = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const isEditMode = Boolean(initialData?.id);

  // Lists for dropdowns
  const [routes, setRoutes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [existingVehicles, setExistingVehicles] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [routeMode, setRouteMode] = useState('existing'); // 'existing' | 'new'
  const [routeId, setRouteId] = useState('');
  const [pickupLocationId, setPickupLocationId] = useState('');
  const [dropLocationId, setDropLocationId] = useState('');

  // Vehicle State
  const [vehicleSelectionType, setVehicleSelectionType] = useState('new'); // 'new' | 'existing'
  const [vehicleId, setVehicleId] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState('SEDAN');
  const [seatingCapacity, setSeatingCapacity] = useState(4);
  const [vehicleImage, setVehicleImage] = useState('/assets/sedan.webp');
  const [vehicleDescription, setVehicleDescription] = useState('');

  // Fare State
  const [tripType, setTripType] = useState('ONE_WAY'); // 'ONE_WAY' | 'ROUND_TRIP'
  const [baseFare, setBaseFare] = useState('');
  const [perKmFare, setPerKmFare] = useState(0);
  const [minimumFare, setMinimumFare] = useState('');
  const [isFareActive, setIsFareActive] = useState(true);

  // Tolls State
  const [tolls, setTolls] = useState([
    { name: 'Mumbai-Pune Expressway Toll', amount: 320, isActive: true },
  ]);

  // Parking State
  const [parkingEnabled, setParkingEnabled] = useState(false);
  const [parkingAmount, setParkingAmount] = useState(100);
  const [parkingType, setParkingType] = useState('FIXED');

  // Waiting State
  const [waitingEnabled, setWaitingEnabled] = useState(false);
  const [freeMinutes, setFreeMinutes] = useState(30);
  const [perHourCharge, setPerHourCharge] = useState(150);

  // Availability State
  const [availStatus, setAvailStatus] = useState('AVAILABLE');
  const [availQuantity, setAvailQuantity] = useState(5);
  const [availFromTime, setAvailFromTime] = useState('00:00');
  const [availToTime, setAvailToTime] = useState('23:59');

  // Load dropdown data
  useEffect(() => {
    if (!isOpen) return;

    setLoadingInitial(true);
    setErrorMsg('');

    Promise.all([
      routeApi.adminGetAll().catch(() => ({ data: { data: [] } })),
      locationApi.getLocations().catch(() => ({ data: { data: [] } })),
      vehicleApi.adminGetAll().catch(() => ({ data: { data: [] } })),
    ])
      .then(([routesRes, locsRes, vehiclesRes]) => {
        const fetchedRoutes = routesRes.data?.data || [];
        const fetchedLocs = locsRes.data?.data || [];
        const fetchedVehicles = vehiclesRes.data?.data || [];

        setRoutes(fetchedRoutes);
        setLocations(fetchedLocs);
        setExistingVehicles(fetchedVehicles);

        if (initialData) {
          // Pre-populate Edit Mode
          setRouteId(initialData.routeId || '');
          setRouteMode('existing');

          if (initialData.vehicle) {
            setVehicleSelectionType('existing');
            setVehicleId(initialData.vehicle.id || '');
            setVehicleName(initialData.vehicle.name || '');
            setVehicleCategory(initialData.vehicle.category || 'SEDAN');
            setSeatingCapacity(initialData.vehicle.seatingCapacity || 4);
            setVehicleImage(initialData.vehicle.image || '/assets/sedan.webp');
            setVehicleDescription(initialData.vehicle.description || '');
          }

          setTripType(initialData.tripType || 'ONE_WAY');
          setBaseFare(initialData.baseFare !== undefined ? initialData.baseFare : '');
          setPerKmFare(initialData.perKmFare || 0);
          setMinimumFare(initialData.minimumFare || '');
          setIsFareActive(initialData.isActive !== undefined ? initialData.isActive : true);

          if (initialData.tolls && initialData.tolls.length > 0) {
            setTolls(initialData.tolls.map((t) => ({ name: t.name, amount: t.amount, isActive: t.isActive !== false })));
          } else {
            setTolls([]);
          }

          if (initialData.parking) {
            setParkingEnabled(Boolean(initialData.parking.enabled));
            setParkingAmount(initialData.parking.amount || 0);
            setParkingType(initialData.parking.chargingType || 'FIXED');
          }

          if (initialData.waiting) {
            setWaitingEnabled(Boolean(initialData.waiting.enabled));
            setFreeMinutes(initialData.waiting.freeMinutes || 30);
            setPerHourCharge(initialData.waiting.perHourCharge || 0);
          }

          if (initialData.availability) {
            setAvailStatus(initialData.availability.status || 'AVAILABLE');
            setAvailQuantity(initialData.availability.availableQuantity || 1);
            setAvailFromTime(initialData.availability.availableFromTime || '00:00');
            setAvailToTime(initialData.availability.availableToTime || '23:59');
          }
        } else {
          // Reset default create mode
          if (fetchedRoutes.length > 0) {
            setRouteId(fetchedRoutes[0].id);
          }
          setVehicleSelectionType('new');
          setVehicleId('');
          setVehicleName('Executive Sedan');
          setVehicleCategory('SEDAN');
          setSeatingCapacity(4);
          setVehicleImage('/assets/sedan.webp');
          setVehicleDescription('Air-conditioned sedan for 1-4 passengers with ample luggage room.');
          setBaseFare(2200);
          setMinimumFare(2200);
          setTolls([{ name: 'Mumbai-Pune Expressway Toll', amount: 320, isActive: true }]);
          setParkingEnabled(true);
          setParkingAmount(100);
          setWaitingEnabled(true);
          setFreeMinutes(30);
          setPerHourCharge(150);
          setAvailStatus('AVAILABLE');
          setAvailQuantity(5);
        }
      })
      .finally(() => setLoadingInitial(false));
  }, [isOpen, initialData]);

  // Handle selecting an existing vehicle from dropdown
  const handleExistingVehicleChange = (selectedVehId) => {
    setVehicleId(selectedVehId);
    const found = existingVehicles.find((v) => v.id === selectedVehId);
    if (found) {
      setVehicleName(found.name);
      setVehicleCategory(found.category);
      setSeatingCapacity(found.seatingCapacity);
      setVehicleImage(found.image || '/assets/sedan.webp');
      setVehicleDescription(found.description || '');
    }
  };

  // Toll item management
  const handleAddToll = () => {
    setTolls([...tolls, { name: '', amount: 0, isActive: true }]);
  };

  const handleRemoveToll = (index) => {
    setTolls(tolls.filter((_, i) => i !== index));
  };

  const handleTollChange = (index, field, value) => {
    const updated = [...tolls];
    updated[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setTolls(updated);
  };

  // Image Upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const res = await vehicleApi.uploadImage(formData);
      if (res.data?.imageUrl) {
        setVehicleImage(res.data.imageUrl);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload vehicle image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Live Fare Calculation preview
  const numBaseFare = parseFloat(baseFare) || 0;
  const totalTolls = tolls.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const totalParking = parkingEnabled ? parseFloat(parkingAmount) || 0 : 0;
  const totalWaiting = waitingEnabled ? parseFloat(perHourCharge) || 0 : 0;
  const calculatedTotal = numBaseFare + totalTolls + totalParking;

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!numBaseFare || numBaseFare <= 0) {
      setErrorMsg('Please enter a valid Base Fare.');
      return;
    }

    if (routeMode === 'existing' && !routeId) {
      setErrorMsg('Please select a valid Route.');
      return;
    }

    if (routeMode === 'new' && (!pickupLocationId || !dropLocationId)) {
      setErrorMsg('Please select both Pickup and Drop locations.');
      return;
    }

    if (!vehicleName.trim()) {
      setErrorMsg('Vehicle Name is required.');
      return;
    }

    const payload = {
      routeId: routeMode === 'existing' ? routeId : undefined,
      pickupLocationId: routeMode === 'new' ? pickupLocationId : undefined,
      dropLocationId: routeMode === 'new' ? dropLocationId : undefined,
      vehicle: {
        id: vehicleSelectionType === 'existing' ? vehicleId : undefined,
        name: vehicleName.trim(),
        category: vehicleCategory,
        seatingCapacity: parseInt(seatingCapacity, 10) || 4,
        image: vehicleImage,
        description: vehicleDescription,
        isActive: true,
      },
      fare: {
        tripType,
        baseFare: numBaseFare,
        perKmFare: parseFloat(perKmFare) || 0,
        minimumFare: parseFloat(minimumFare) || numBaseFare,
        isActive: isFareActive,
      },
      tolls: tolls.filter((t) => t.name.trim() !== ''),
      parking: {
        enabled: parkingEnabled,
        amount: parseFloat(parkingAmount) || 0,
        chargingType: parkingType,
      },
      waiting: {
        enabled: waitingEnabled,
        freeMinutes: parseInt(freeMinutes, 10) || 30,
        perHourCharge: parseFloat(perHourCharge) || 0,
      },
      availability: {
        status: availStatus,
        availableQuantity: parseInt(availQuantity, 10) || 1,
        availableFromTime: availFromTime || '00:00',
        availableToTime: availToTime || '23:59',
      },
    };

    setSubmitting(true);
    try {
      if (isEditMode) {
        await adminFareConfigApi.update(initialData.id, payload);
      } else {
        await adminFareConfigApi.create(payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save fare configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal-card compact">
        
        {/* Modal Header */}
        <div className="admin-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#E0F2FE',
              color: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {isEditMode ? 'Edit Fare Configuration' : 'Create Unified Fare Configuration'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>
                Manage Route, Fleet Vehicle, Base Fare, Tolls, Parking, Stay & Availability in one flow
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="admin-btn-secondary"
            style={{ width: '32px', height: '32px', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="admin-modal-body">
          
          {errorMsg && (
            <div style={{
              backgroundColor: '#FFE4E6',
              border: '1px solid #FECDD3',
              color: '#BE123C',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {loadingInitial ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
              <Loader2 size={30} className="animate-spin text-sky-500" style={{ margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Loading form configuration...</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Section 1: Route Details */}
              <div className="admin-form-section" style={{ margin: 0, padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div className="admin-form-section-title" style={{ margin: 0 }}>
                    <div className="admin-section-num">1</div>
                    <span>Route Selection</span>
                  </div>

                  {!isEditMode && (
                    <div className="admin-filter-pills" style={{ padding: '0.15rem' }}>
                      <button
                        type="button"
                        onClick={() => setRouteMode('existing')}
                        className={`admin-filter-btn ${routeMode === 'existing' ? 'active' : ''}`}
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}
                      >
                        Select Existing
                      </button>
                      <button
                        type="button"
                        onClick={() => setRouteMode('new')}
                        className={`admin-filter-btn ${routeMode === 'new' ? 'active' : ''}`}
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}
                      >
                        New Pickup/Drop
                      </button>
                    </div>
                  )}
                </div>

                {routeMode === 'existing' ? (
                  <div className="admin-input-group" style={{ margin: 0 }}>
                    <select
                      value={routeId}
                      onChange={(e) => setRouteId(e.target.value)}
                      className="admin-input-control"
                      style={{ height: '38px', fontSize: '0.84rem' }}
                    >
                      <option value="">-- Choose Intercity Route --</option>
                      {routes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.routeName} ({r.pickupLocation?.name || 'Pickup'} ➔ {r.dropLocation?.name || 'Drop'})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="admin-form-grid-2">
                    <div className="admin-input-group" style={{ margin: 0 }}>
                      <label className="admin-input-label">Pickup Location</label>
                      <select
                        value={pickupLocationId}
                        onChange={(e) => setPickupLocationId(e.target.value)}
                        className="admin-input-control"
                        style={{ height: '38px', fontSize: '0.84rem' }}
                      >
                        <option value="">-- Select Pickup --</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} ({loc.city})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-input-group" style={{ margin: 0 }}>
                      <label className="admin-input-label">Drop Location</label>
                      <select
                        value={dropLocationId}
                        onChange={(e) => setDropLocationId(e.target.value)}
                        className="admin-input-control"
                        style={{ height: '38px', fontSize: '0.84rem' }}
                      >
                        <option value="">-- Select Drop --</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} ({loc.city})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Vehicle Details */}
              <div className="admin-form-section" style={{ margin: 0, padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div className="admin-form-section-title" style={{ margin: 0 }}>
                    <div className="admin-section-num">2</div>
                    <span>Vehicle Details</span>
                  </div>

                  {!isEditMode && existingVehicles.length > 0 && (
                    <div className="admin-filter-pills" style={{ padding: '0.15rem' }}>
                      <button
                        type="button"
                        onClick={() => setVehicleSelectionType('new')}
                        className={`admin-filter-btn ${vehicleSelectionType === 'new' ? 'active' : ''}`}
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}
                      >
                        New Vehicle
                      </button>
                      <button
                        type="button"
                        onClick={() => setVehicleSelectionType('existing')}
                        className={`admin-filter-btn ${vehicleSelectionType === 'existing' ? 'active' : ''}`}
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}
                      >
                        Choose from Fleet
                      </button>
                    </div>
                  )}
                </div>

                {vehicleSelectionType === 'existing' && !isEditMode && (
                  <div className="admin-input-group" style={{ marginBottom: '0.75rem' }}>
                    <select
                      value={vehicleId}
                      onChange={(e) => handleExistingVehicleChange(e.target.value)}
                      className="admin-input-control"
                      style={{ height: '38px', fontSize: '0.84rem' }}
                    >
                      <option value="">-- Pick from Fleet Vehicles --</option>
                      {existingVehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.category} • {v.seatingCapacity} Seats)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="admin-form-grid-3" style={{ marginBottom: '0.75rem' }}>
                  <div className="admin-input-group" style={{ margin: 0 }}>
                    <label className="admin-input-label">Vehicle Name *</label>
                    <input
                      type="text"
                      value={vehicleName}
                      onChange={(e) => setVehicleName(e.target.value)}
                      placeholder="e.g. Executive Sedan / Ertiga"
                      required
                      className="admin-input-control"
                      style={{ height: '38px', fontSize: '0.84rem' }}
                    />
                  </div>

                  <div className="admin-input-group" style={{ margin: 0 }}>
                    <label className="admin-input-label">Category</label>
                    <select
                      value={vehicleCategory}
                      onChange={(e) => setVehicleCategory(e.target.value)}
                      className="admin-input-control"
                      style={{ height: '38px', fontSize: '0.84rem' }}
                    >
                      <option value="HATCHBACK">HATCHBACK</option>
                      <option value="SEDAN">SEDAN</option>
                      <option value="SUV">SUV</option>
                      <option value="INNOVA_CRYSTA">INNOVA CRYSTA</option>
                      <option value="TEMPO_TRAVELLER">TEMPO TRAVELLER</option>
                      <option value="TWENTY_SEATER">20 SEATER BUS</option>
                    </select>
                  </div>

                  <div className="admin-input-group" style={{ margin: 0 }}>
                    <label className="admin-input-label">Seating Capacity</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={seatingCapacity}
                      onChange={(e) => setSeatingCapacity(e.target.value)}
                      className="admin-input-control"
                      style={{ height: '38px', fontSize: '0.84rem' }}
                    />
                  </div>
                </div>

                {/* Vehicle Image */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={vehicleImage.startsWith('http') || vehicleImage.startsWith('/uploads') ? `${vehicleImage.startsWith('/uploads') ? API_BASE_URL : ''}${vehicleImage}` : vehicleImage}
                    alt="Vehicle"
                    style={{ width: '48px', height: '34px', borderRadius: '6px', objectFit: 'contain', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '2px', flexShrink: 0 }}
                    onError={(e) => { e.target.src = '/assets/sedan.webp'; }}
                  />
                  <label className="admin-btn-secondary" style={{ flex: 1, height: '36px', cursor: 'pointer', fontSize: '0.78rem' }}>
                    <Upload size={13} />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Custom Image'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              {/* Section 3: Pricing & Trip Mode */}
              <div className="admin-form-section" style={{ margin: 0, padding: '1rem 1.25rem' }}>
                <div className="admin-form-section-title" style={{ marginBottom: '0.75rem' }}>
                  <div className="admin-section-num">3</div>
                  <span>Trip Mode & Base Pricing</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setTripType('ONE_WAY')}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: tripType === 'ONE_WAY' ? '#0284C7' : '#E2E8F0',
                      backgroundColor: tripType === 'ONE_WAY' ? '#F0F9FF' : '#FFFFFF',
                      color: tripType === 'ONE_WAY' ? '#0369A1' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    One Way Trip Fare
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType('ROUND_TRIP')}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: tripType === 'ROUND_TRIP' ? '#0284C7' : '#E2E8F0',
                      backgroundColor: tripType === 'ROUND_TRIP' ? '#F0F9FF' : '#FFFFFF',
                      color: tripType === 'ROUND_TRIP' ? '#0369A1' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Round Trip Fare
                  </button>
                </div>

                <div className="admin-form-grid-2" style={{ marginBottom: '0.75rem' }}>
                  <div className="admin-input-group" style={{ margin: 0 }}>
                    <label className="admin-input-label">Base Fare (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={baseFare}
                      onChange={(e) => setBaseFare(e.target.value)}
                      placeholder="e.g. 2200"
                      required
                      className="admin-input-control"
                      style={{ height: '38px', fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}
                    />
                  </div>

                  <div className="admin-input-group" style={{ margin: 0 }}>
                    <label className="admin-input-label">Expressway Toll (₹)</label>
                    <input
                      type="number"
                      step="1"
                      value={tolls[0]?.amount || 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setTolls([{ name: 'Expressway Toll', amount: val, isActive: true }]);
                      }}
                      placeholder="e.g. 320"
                      className="admin-input-control"
                      style={{ height: '38px', fontSize: '0.84rem' }}
                    />
                  </div>
                </div>

                {/* Parking & Waiting Inline Options */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={parkingEnabled}
                      onChange={(e) => setParkingEnabled(e.target.checked)}
                    />
                    <span>Airport Parking (+₹{parkingAmount})</span>
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B' }}>Active Status:</span>
                    <button
                      type="button"
                      onClick={() => setIsFareActive(!isFareActive)}
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: isFareActive ? '#BBF7D0' : '#E2E8F0',
                        backgroundColor: isFareActive ? '#DCFCE7' : '#F1F5F9',
                        color: isFareActive ? '#15803D' : '#64748B',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {isFareActive ? '● Active' : '○ Disabled'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="admin-btn-secondary"
                  style={{ height: '40px', padding: '0 1.25rem', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="admin-btn-primary"
                  style={{ height: '40px', padding: '0 1.5rem', fontSize: '0.84rem' }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>{isEditMode ? 'Update Fare' : 'Save Fare'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
