import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Car,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { adminFareConfigApi, locationApi, routeApi, vehicleApi, API_BASE_URL } from '../../services/api';

// In-memory cache for instant dropdown loading across modal opens
let cachedRoutes = null;
let cachedLocations = null;
let cachedVehicles = null;
let prefetchPromise = null;

export const prefetchFareFormData = () => {
  if (prefetchPromise) return prefetchPromise;
  prefetchPromise = Promise.all([
    routeApi.adminGetAll().catch(() => ({ data: { data: [] } })),
    locationApi.getLocations().catch(() => ({ data: { data: [] } })),
    vehicleApi.adminGetAll().catch(() => ({ data: { data: [] } })),
  ])
    .then(([routesRes, locsRes, vehiclesRes]) => {
      cachedRoutes = routesRes.data?.data || [];
      cachedLocations = locsRes.data?.data || [];
      cachedVehicles = vehiclesRes.data?.data || [];
      return { cachedRoutes, cachedLocations, cachedVehicles };
    })
    .catch(() => ({
      cachedRoutes: cachedRoutes || [],
      cachedLocations: cachedLocations || [],
      cachedVehicles: cachedVehicles || [],
    }));
  return prefetchPromise;
};

export const AdminFareForm = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const isEditMode = Boolean(initialData?.id);

  // Lists for dropdowns (initialized from cache if available for instant 0ms render)
  const [routes, setRoutes] = useState(cachedRoutes || []);
  const [locations, setLocations] = useState(cachedLocations || []);
  const [existingVehicles, setExistingVehicles] = useState(cachedVehicles || []);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [routeMode, setRouteMode] = useState('existing'); // 'existing' | 'new'
  const [routeId, setRouteId] = useState('');
  const [pickupLocationId, setPickupLocationId] = useState('');
  const [dropLocationId, setDropLocationId] = useState('');
  const [pickupInput, setPickupInput] = useState('');
  const [dropInput, setDropInput] = useState('');

  // Vehicle State (defaults to selecting existing fleet vehicle)
  const [vehicleSelectionType, setVehicleSelectionType] = useState('existing'); // 'existing' | 'new'
  const [vehicleId, setVehicleId] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState('SEDAN');
  const [seatingCapacity, setSeatingCapacity] = useState('');
  const [vehicleImage, setVehicleImage] = useState('');
  const [vehicleDescription, setVehicleDescription] = useState('');

  // Fare State
  const [tripType, setTripType] = useState('ONE_WAY'); // 'ONE_WAY' | 'ROUND_TRIP'
  const [baseFare, setBaseFare] = useState('');
  const [perKmFare, setPerKmFare] = useState('');
  const [minimumFare, setMinimumFare] = useState('');
  const [isFareActive, setIsFareActive] = useState(true);

  // Tolls State
  const [tolls, setTolls] = useState([]);

  // Parking State
  const [parkingEnabled, setParkingEnabled] = useState(false);
  const [parkingAmount, setParkingAmount] = useState('');
  const [parkingType, setParkingType] = useState('FIXED');

  // Waiting State
  const [waitingEnabled, setWaitingEnabled] = useState(false);
  const [freeMinutes, setFreeMinutes] = useState(30);
  const [perHourCharge, setPerHourCharge] = useState('');

  // Availability State
  const [availStatus, setAvailStatus] = useState('AVAILABLE');
  const [availQuantity, setAvailQuantity] = useState(1);
  const [availFromTime, setAvailFromTime] = useState('00:00');
  const [availToTime, setAvailToTime] = useState('23:59');

  // Synchronously populate inputs on open or initialData change (zero UI delay)
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');

    if (initialData) {
      setRouteId(initialData.routeId || '');
      setRouteMode('existing');
      setPickupLocationId(initialData.route?.pickupLocationId || '');
      setDropLocationId(initialData.route?.dropLocationId || '');
      setPickupInput(initialData.route?.pickupLocation?.name || '');
      setDropInput(initialData.route?.dropLocation?.name || '');

      if (initialData.vehicle) {
        setVehicleSelectionType('existing');
        setVehicleId(initialData.vehicle.id || '');
        setVehicleName(initialData.vehicle.name || '');
        setVehicleCategory(initialData.vehicle.category || 'SEDAN');
        setSeatingCapacity(initialData.vehicle.seatingCapacity !== undefined ? initialData.vehicle.seatingCapacity : '');
        setVehicleImage(initialData.vehicle.image || '');
        setVehicleDescription(initialData.vehicle.description || '');
      }

      setTripType(initialData.tripType || 'ONE_WAY');
      setBaseFare(initialData.baseFare !== undefined ? initialData.baseFare : '');
      setPerKmFare(initialData.perKmFare !== undefined && initialData.perKmFare > 0 ? initialData.perKmFare : '');
      setMinimumFare(initialData.minimumFare || '');
      setIsFareActive(initialData.isActive !== undefined ? initialData.isActive : true);

      if (initialData.tolls && initialData.tolls.length > 0) {
        setTolls(initialData.tolls.map((t) => ({ name: t.name, amount: t.amount, isActive: t.isActive !== false })));
      } else {
        setTolls([]);
      }

      if (initialData.parking) {
        setParkingEnabled(Boolean(initialData.parking.enabled));
        setParkingAmount(initialData.parking.amount !== undefined ? initialData.parking.amount : '');
        setParkingType(initialData.parking.chargingType || 'FIXED');
      } else {
        setParkingEnabled(false);
        setParkingAmount('');
        setParkingType('FIXED');
      }

      if (initialData.waiting) {
        setWaitingEnabled(Boolean(initialData.waiting.enabled));
        setFreeMinutes(initialData.waiting.freeMinutes !== undefined ? initialData.waiting.freeMinutes : 30);
        setPerHourCharge(initialData.waiting.perHourCharge !== undefined ? initialData.waiting.perHourCharge : '');
      } else {
        setWaitingEnabled(false);
        setFreeMinutes(30);
        setPerHourCharge('');
      }

      if (initialData.availability) {
        setAvailStatus(initialData.availability.status || 'AVAILABLE');
        setAvailQuantity(initialData.availability.availableQuantity || 1);
        setAvailFromTime(initialData.availability.availableFromTime || '00:00');
        setAvailToTime(initialData.availability.availableToTime || '23:59');
      }
    } else {
      // Clean Create Mode - NO default pre-filled data
      setRouteId('');
      setRouteMode('existing');
      setPickupLocationId('');
      setDropLocationId('');
      setPickupInput('');
      setDropInput('');
      setVehicleSelectionType('existing');
      setVehicleId('');
      setVehicleName('');
      setVehicleCategory('SEDAN');
      setSeatingCapacity('');
      setVehicleImage('');
      setVehicleDescription('');
      setTripType('ONE_WAY');
      setBaseFare('');
      setMinimumFare('');
      setPerKmFare('');
      setIsFareActive(true);
      setTolls([]);
      setParkingEnabled(false);
      setParkingAmount('');
      setParkingType('FIXED');
      setWaitingEnabled(false);
      setFreeMinutes(30);
      setPerHourCharge('');
      setAvailStatus('AVAILABLE');
      setAvailQuantity(1);
    }
  }, [isOpen, initialData]);

  // Load dropdown data asynchronously in background without blocking form UI
  useEffect(() => {
    if (!isOpen) return;

    const applyDefaultSelection = (rList, vList) => {
      // Do not auto-select route or vehicle in create mode; admin selects explicitly
    };

    if (cachedRoutes && cachedLocations && cachedVehicles) {
      setRoutes(cachedRoutes);
      setLocations(cachedLocations);
      setExistingVehicles(cachedVehicles);
      applyDefaultSelection(cachedRoutes, cachedVehicles);
      return;
    }

    prefetchFareFormData().then(({ cachedRoutes: r, cachedLocations: l, cachedVehicles: v }) => {
      setRoutes(r);
      setLocations(l);
      setExistingVehicles(v);
      applyDefaultSelection(r, v);
    });
  }, [isOpen, initialData]);

  // Handle selecting an existing vehicle from dropdown
  const handleExistingVehicleChange = (selectedVehId) => {
    setVehicleId(selectedVehId);
    if (!selectedVehId) {
      setVehicleName('');
      setVehicleCategory('SEDAN');
      setSeatingCapacity('');
      setVehicleImage('');
      setVehicleDescription('');
      return;
    }
    const found = existingVehicles.find((v) => v.id === selectedVehId);
    if (found) {
      setVehicleName(found.name);
      setVehicleCategory(found.category);
      setSeatingCapacity(found.seatingCapacity !== undefined ? found.seatingCapacity : '');
      setVehicleImage(found.image || '');
      setVehicleDescription(found.description || '');
    }
  };

  const handlePickupInputChange = (val) => {
    setPickupInput(val);
    const matched = locations.find((loc) => loc.name.toLowerCase() === val.trim().toLowerCase());
    if (matched) {
      setPickupLocationId(matched.id);
    } else {
      setPickupLocationId('');
    }
  };

  const handleDropInputChange = (val) => {
    setDropInput(val);
    const matched = locations.find((loc) => loc.name.toLowerCase() === val.trim().toLowerCase());
    if (matched) {
      setDropLocationId(matched.id);
    } else {
      setDropLocationId('');
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

    if (routeMode === 'new') {
      if (!pickupInput.trim() || !dropInput.trim()) {
        setErrorMsg('Please specify both Pickup and Drop locations.');
        return;
      }
    }

    if (vehicleSelectionType === 'existing' && !vehicleId && !isEditMode) {
      setErrorMsg('Please select a vehicle from Fleet Vehicles.');
      return;
    }

    if (!vehicleName.trim()) {
      setErrorMsg('Vehicle Name is required.');
      return;
    }

    const payload = {
      routeId: routeMode === 'existing' ? routeId : undefined,
      pickupLocationId: routeMode === 'new' && pickupLocationId ? pickupLocationId : undefined,
      dropLocationId: routeMode === 'new' && dropLocationId ? dropLocationId : undefined,
      pickupLocationName: routeMode === 'new' && !pickupLocationId ? pickupInput.trim() : undefined,
      dropLocationName: routeMode === 'new' && !dropLocationId ? dropInput.trim() : undefined,
      vehicle: {
        id: (vehicleSelectionType === 'existing' && vehicleId) ? vehicleId : (isEditMode ? vehicleId : undefined),
        name: vehicleName.trim(),
        category: vehicleCategory,
        seatingCapacity: parseInt(seatingCapacity, 10) || 4,
        image: vehicleImage || undefined,
        description: vehicleDescription || undefined,
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

  // Lock background scrolling and close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="admin-modal-backdrop admin-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        overflowY: 'auto',
      }}
    >
      <div
        className="admin-modal-card admin-modal-container"
        style={{
          maxWidth: '780px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Modal Header */}
        <div className="admin-modal-header" style={{ flexShrink: 0, padding: '0.85rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#E0F2FE',
              color: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              flexShrink: 0
            }}>
              <Sparkles size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isEditMode ? 'Edit Fare Configuration' : 'Create Unified Fare Configuration'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Manage Route, Fleet Vehicle, Base Fare, Tolls, Parking, Stay & Availability in one flow
              </p>
            </div>
          </div>
        </div>

        {/* Modal Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden'
          }}
        >
            {/* Modal Body (Scrollable) */}
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
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
                      style={{ height: '40px', fontSize: '0.86rem', fontWeight: 600 }}
                    >
                      <option value="">-- Select Existing Route --</option>
                      {routes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.routeName} ({r.pickupLocation?.name} → {r.dropLocation?.name})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="admin-form-grid-2" style={{ margin: 0 }}>
                    <div className="admin-input-group" style={{ margin: 0 }}>
                      <label className="admin-input-label">
                        Pickup Location / City <span className="admin-required">*</span>
                      </label>
                      <input
                        type="text"
                        list="fare-pickup-locations"
                        value={pickupInput}
                        onChange={(e) => handlePickupInputChange(e.target.value)}
                        placeholder="Select or enter custom pickup (e.g. Pune, Wakad)"
                        className="admin-input-control"
                        style={{ height: '38px', fontSize: '0.84rem' }}
                      />
                      <datalist id="fare-pickup-locations">
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.name}>
                            {loc.name} ({loc.city})
                          </option>
                        ))}
                      </datalist>
                    </div>

                    <div className="admin-input-group" style={{ margin: 0 }}>
                      <label className="admin-input-label">
                        Drop Location / City <span className="admin-required">*</span>
                      </label>
                      <input
                        type="text"
                        list="fare-drop-locations"
                        value={dropInput}
                        onChange={(e) => handleDropInputChange(e.target.value)}
                        placeholder="Select or enter custom drop (e.g. Mumbai, Shirdi)"
                        className="admin-input-control"
                        style={{ height: '38px', fontSize: '0.84rem' }}
                      />
                      <datalist id="fare-drop-locations">
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.name}>
                            {loc.name} ({loc.city})
                          </option>
                        ))}
                      </datalist>
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
                        onClick={() => {
                          setVehicleSelectionType('existing');
                        }}
                        className={`admin-filter-btn ${vehicleSelectionType === 'existing' ? 'active' : ''}`}
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}
                      >
                        Choose from Fleet
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVehicleSelectionType('new');
                          setVehicleId('');
                        }}
                        className={`admin-filter-btn ${vehicleSelectionType === 'new' ? 'active' : ''}`}
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}
                      >
                        New Vehicle
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
                      style={{ height: '38px', fontSize: '0.84rem', fontWeight: 600, borderColor: '#10B981', backgroundColor: '#F0FDF4' }}
                    >
                      <option value="">-- Pick from Fleet Vehicles --</option>
                      {existingVehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.category} • {v.seatingCapacity} Seats)
                        </option>
                      ))}
                    </select>
                    {vehicleId && (
                      <div style={{ fontSize: '0.7rem', color: '#047857', marginTop: '0.25rem', fontWeight: 600 }}>
                        ✓ Reusing existing Fleet Vehicle record. To manage full fleet specs, use the Fleet Vehicles tab.
                      </div>
                    )}
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

                {/* Vehicle Image Preview (Read-Only) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  {vehicleImage ? (
                    <>
                      <img
                        src={vehicleImage.startsWith('http') || vehicleImage.startsWith('/uploads') ? `${vehicleImage.startsWith('/uploads') ? API_BASE_URL : ''}${vehicleImage}` : vehicleImage}
                        alt="Vehicle"
                        style={{ width: '48px', height: '34px', borderRadius: '6px', objectFit: 'contain', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '2px', flexShrink: 0 }}
                        onError={(e) => { e.target.src = '/assets/sedan.webp'; }}
                      />
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                        Assigned Fleet Photo: <code style={{ color: '#0284C7', fontWeight: 600 }}>{vehicleImage.split('/').pop()}</code>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                      No vehicle photo assigned yet. Select a vehicle from the fleet or assign photo.
                    </div>
                  )}
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
                      value={tolls[0]?.amount !== undefined ? tolls[0].amount : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setTolls([]);
                        } else {
                          setTolls([{ name: 'Expressway Toll', amount: parseFloat(val) || 0, isActive: true }]);
                        }
                      }}
                      placeholder="e.g. 320"
                      className="admin-input-control"
                      style={{ height: '38px', fontSize: '0.84rem' }}
                    />
                  </div>
                </div>

                {/* Extra Kilometre Rate & Status */}
                <div className="admin-form-grid-2" style={{ marginBottom: '0.75rem' }}>
                  <div className="admin-input-group" style={{ margin: 0 }}>
                    <label className="admin-input-label">Extra Kilometre Rate (₹ / km)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={perKmFare}
                      onChange={(e) => setPerKmFare(e.target.value)}
                      placeholder="e.g. 14"
                      className="admin-input-control"
                      style={{ height: '38px', fontSize: '0.84rem' }}
                    />
                    <span style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '0.2rem', display: 'block' }}>
                      Chargeable when customer journey exceeds route included distance
                    </span>
                  </div>

                  <div className="admin-input-group" style={{ margin: 0 }}>
                    <label className="admin-input-label">Fare Status</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '38px' }}>
                      <button
                        type="button"
                        onClick={() => setIsFareActive(!isFareActive)}
                        style={{
                          height: '38px',
                          padding: '0 1rem',
                          borderRadius: '8px',
                          border: '1.5px solid',
                          borderColor: isFareActive ? '#BBF7D0' : '#E2E8F0',
                          backgroundColor: isFareActive ? '#DCFCE7' : '#F1F5F9',
                          color: isFareActive ? '#15803D' : '#64748B',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <span>{isFareActive ? '● Active & Bookable' : '○ Disabled'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Configurable Parking Pricing */}
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: parkingEnabled ? '0.65rem' : 0 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={parkingEnabled}
                        onChange={(e) => setParkingEnabled(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#0284C7' }}
                      />
                      <span>Parking Charges Apply</span>
                    </label>
                    <span style={{ fontSize: '0.72rem', color: parkingEnabled ? '#0284C7' : '#94A3B8', fontWeight: 600 }}>
                      {parkingEnabled ? 'Configured' : 'Not Applicable / Included'}
                    </span>
                  </div>

                  {parkingEnabled && (
                    <div className="admin-form-grid-2" style={{ marginTop: '0.5rem' }}>
                      <div className="admin-input-group" style={{ margin: 0 }}>
                        <label className="admin-input-label">Parking Amount (₹)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={parkingAmount}
                          onChange={(e) => setParkingAmount(e.target.value)}
                          placeholder="e.g. 100"
                          className="admin-input-control"
                          style={{ height: '36px', fontSize: '0.84rem' }}
                        />
                      </div>
                      <div className="admin-input-group" style={{ margin: 0 }}>
                        <label className="admin-input-label">Charging Rule</label>
                        <select
                          value={parkingType}
                          onChange={(e) => setParkingType(e.target.value)}
                          className="admin-input-control"
                          style={{ height: '36px', fontSize: '0.84rem' }}
                        >
                          <option value="FIXED">Fixed Amount</option>
                          <option value="AIRPORT_ENTRY">Airport Entry Parking</option>
                          <option value="ACTUALS">At Actuals (Receipt)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Configurable Stay / Driver Waiting Allowance */}
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: waitingEnabled ? '0.65rem' : 0 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={waitingEnabled}
                        onChange={(e) => setWaitingEnabled(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#0284C7' }}
                      />
                      <span>Stay / Driver Waiting Allowance Applies</span>
                    </label>
                    <span style={{ fontSize: '0.72rem', color: waitingEnabled ? '#D97706' : '#94A3B8', fontWeight: 600 }}>
                      {waitingEnabled ? 'Configured' : 'Not Applicable / Included'}
                    </span>
                  </div>

                  {waitingEnabled && (
                    <div className="admin-form-grid-2" style={{ marginTop: '0.5rem' }}>
                      <div className="admin-input-group" style={{ margin: 0 }}>
                        <label className="admin-input-label">Hourly Stay Charge (₹ / hr)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={perHourCharge}
                          onChange={(e) => setPerHourCharge(e.target.value)}
                          placeholder="e.g. 150"
                          className="admin-input-control"
                          style={{ height: '36px', fontSize: '0.84rem' }}
                        />
                      </div>
                      <div className="admin-input-group" style={{ margin: 0 }}>
                        <label className="admin-input-label">Free Waiting Included (Minutes)</label>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={freeMinutes}
                          onChange={(e) => setFreeMinutes(e.target.value)}
                          placeholder="e.g. 30"
                          className="admin-input-control"
                          style={{ height: '36px', fontSize: '0.84rem' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              </div>

            </div>

            {/* Sticky Modal Footer (Always Visible at Bottom) */}
            <div className="admin-modal-footer" style={{ justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="admin-btn-secondary"
                style={{ height: '40px', padding: '0 1.5rem', fontSize: '0.84rem' }}
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

      </div>
    </div>
  );
};
