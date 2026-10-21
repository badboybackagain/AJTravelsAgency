import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  X,
  ChevronDown,
  Loader2,
  Building,
  Plane,
  Train,
  Home,
  Compass,
  Check,
  Sparkles,
} from 'lucide-react';
import { searchLocations, detectLocationRegion } from '../services/locationSearchService';
import './SearchableLocationInput.css';

/**
 * Reusable, high-performance searchable location selector
 * Supports:
 * - Popular saved Pune & Mumbai database locations
 * - Live address, society, building, airport, landmark autocomplete
 * - Custom manually entered addresses
 * - Full keyboard navigation (Arrows, Enter, Escape)
 * - Desktop & mobile touch responsive design
 */
export const SearchableLocationInput = ({
  id,
  value,
  onSelect,
  placeholder = 'Choose location or type address...',
  popularLocations = [],
  puneLocations = [],
  mumbaiLocations = [],
  sidePreference = null, // 'PUNE_SIDE' | 'MUMBAI_SIDE' | null
  disabled = false,
  icon: LeadingIcon = MapPin,
  iconColor = '#0099FF',
  ariaLabel = 'Location Selector',
  allowCustomAddress = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedResults, setSavedResults] = useState([]);
  const [customResults, setCustomResults] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync displayed query with current value
  useEffect(() => {
    if (value) {
      if (typeof value === 'string') {
        // Find if matches a saved location
        const matched = popularLocations.find((l) => l.id === value || l.name === value);
        setQuery(matched ? matched.name : value);
      } else if (value.name || value.formattedAddress) {
        setQuery(value.name || value.formattedAddress);
      }
    } else {
      setQuery('');
    }
  }, [value, popularLocations]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Live Autocomplete with 260ms debounce
  const performSearch = (searchTerm) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!searchTerm || searchTerm.trim().length < 2) {
      setLoading(false);
      setCustomResults([]);
      return;
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchLocations({
          query: searchTerm,
          savedLocations: popularLocations,
          sidePreference,
        });
        setSavedResults(res.saved || []);
        setCustomResults(res.custom || []);
      } catch (err) {
        console.warn('Location search error:', err.message);
        setCustomResults([]);
      } finally {
        setLoading(false);
      }
    }, 260);
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    setIsOpen(true);
    setHighlightedIndex(-1);
    performSearch(text);
  };

  const handleFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      if (!query.trim()) {
        setCustomResults([]);
      } else {
        performSearch(query);
      }
    }
  };

  const handleSelectLocation = (loc) => {
    setIsOpen(false);
    setHighlightedIndex(-1);
    setQuery(loc.name || loc.formattedAddress);

    if (onSelect) {
      onSelect({
        id: loc.id || null,
        name: loc.name,
        formattedAddress: loc.formattedAddress || loc.name,
        city: loc.city || 'Pune',
        side: loc.side || (loc.city?.toLowerCase().includes('mumbai') ? 'MUMBAI_SIDE' : 'PUNE_SIDE'),
        isCustom: Boolean(loc.isCustom),
        source: loc.source || (loc.id ? 'database' : 'custom'),
        lat: loc.lat || null,
        lon: loc.lon || null,
        placeId: loc.placeId || null,
      });
    }
  };

  // Allow manual entry fallback when user presses Enter on unlisted address
  const handleSelectManualAddress = (manualText) => {
    const text = manualText.trim();
    if (!text) return;
    const detected = detectLocationRegion(text);
    handleSelectLocation({
      id: null,
      name: text,
      formattedAddress: text,
      city: detected.city,
      side: detected.side,
      isCustom: true,
      source: 'manual',
    });
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery('');
    setCustomResults([]);
    setHighlightedIndex(-1);
    if (onSelect) {
      onSelect(null);
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Compile list of currently visible selectable items for keyboard navigation
  const visibleItems = [];
  const hasQuery = query.trim().length >= 2;

  if (hasQuery) {
    savedResults.forEach((item) => visibleItems.push({ type: 'saved', item }));
    customResults.forEach((item) => visibleItems.push({ type: 'custom', item }));
    if (allowCustomAddress) {
      visibleItems.push({
        type: 'manual',
        item: {
          name: query.trim(),
          formattedAddress: query.trim(),
          isCustom: true,
        },
      });
    }
  } else {
    // When no query is typed, list popular Pune and Mumbai saved locations
    puneLocations.forEach((item) => visibleItems.push({ type: 'saved_pune', item }));
    mumbaiLocations.forEach((item) => visibleItems.push({ type: 'saved_mumbai', item }));
  }

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < visibleItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : visibleItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && visibleItems[highlightedIndex]) {
        handleSelectLocation(visibleItems[highlightedIndex].item);
      } else if (query.trim()) {
        handleSelectManualAddress(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const getItemIcon = (item) => {
    const t = (item.type || '').toLowerCase();
    const n = (item.name || '').toLowerCase();
    if (t === 'airport' || n.includes('airport') || n.includes('pnq') || n.includes('bom')) {
      return <Plane size={15} color="#0099FF" className="sli-item-icon" />;
    }
    if (t === 'station' || n.includes('station') || n.includes('railway') || n.includes('csmt')) {
      return <Train size={15} color="#F59E0B" className="sli-item-icon" />;
    }
    if (t === 'hotel' || n.includes('hotel') || n.includes('marriott') || n.includes('hyatt') || n.includes('radisson')) {
      return <Building size={15} color="#10B981" className="sli-item-icon" />;
    }
    if (t === 'society' || n.includes('society') || n.includes('apartment') || n.includes('township') || n.includes('residency')) {
      return <Home size={15} color="#6366F1" className="sli-item-icon" />;
    }
    if (item.source === 'database' || !item.isCustom) {
      return <MapPin size={15} color={iconColor} className="sli-item-icon" />;
    }
    return <Compass size={15} color="#64748B" className="sli-item-icon" />;
  };

  // Google Attribution requirement check
  const isGoogleActive = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  return (
    <div
      ref={containerRef}
      className={`sli-container ${disabled ? 'sli-disabled' : ''} ${className}`}
    >
      <div className="sli-input-wrapper">
        <LeadingIcon size={16} color={iconColor} className="sli-leading-icon" />

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          className="sli-input-control"
        />

        <div className="sli-actions-wrapper">
          {loading && <Loader2 size={15} className="sli-spinner" />}

          {query && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="sli-clear-btn"
              title="Clear selection"
              aria-label="Clear location input"
            >
              <X size={14} />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="sli-toggle-btn"
            aria-label="Toggle location dropdown"
          >
            <ChevronDown size={15} className={`sli-chevron ${isOpen ? 'open' : ''}`} />
          </button>
        </div>
      </div>

      {/* Autocomplete & Saved Locations Dropdown */}
      {isOpen && !disabled && (
        <div ref={listRef} className="sli-dropdown-menu" role="listbox">
          {/* STATE 1: USER IS TYPING SEARCH QUERY */}
          {hasQuery ? (
            <>
              {/* Matching Saved Popular Locations */}
              {savedResults.length > 0 && (
                <div className="sli-group">
                  <div className="sli-group-header">
                    <Sparkles size={12} color="#D97706" />
                    <span>Popular Route Locations</span>
                  </div>
                  {savedResults.map((loc, idx) => {
                    const itemGlobalIdx = idx;
                    const isHighlighted = highlightedIndex === itemGlobalIdx;
                    return (
                      <div
                        key={loc.id || `saved-${idx}`}
                        role="option"
                        aria-selected={isHighlighted}
                        className={`sli-item ${isHighlighted ? 'highlighted' : ''}`}
                        onClick={() => handleSelectLocation(loc)}
                      >
                        {getItemIcon(loc)}
                        <div className="sli-item-text">
                          <div className="sli-item-primary">{loc.name}</div>
                          <div className="sli-item-secondary">
                            {loc.side === 'PUNE_SIDE' ? 'Pune Hub' : 'Mumbai Hub'} • Popular Pickup / Drop
                          </div>
                        </div>
                        <span className="sli-tag saved-tag">Saved</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Live Address & Landmark Autocomplete */}
              {customResults.length > 0 && (
                <div className="sli-group">
                  <div className="sli-group-header">
                    <Search size={12} color="#0099FF" />
                    <span>Live Address & Landmark Suggestions</span>
                  </div>
                  {customResults.map((loc, idx) => {
                    const itemGlobalIdx = savedResults.length + idx;
                    const isHighlighted = highlightedIndex === itemGlobalIdx;
                    return (
                      <div
                        key={loc.placeId || `custom-${idx}`}
                        role="option"
                        aria-selected={isHighlighted}
                        className={`sli-item ${isHighlighted ? 'highlighted' : ''}`}
                        onClick={() => handleSelectLocation(loc)}
                      >
                        {getItemIcon(loc)}
                        <div className="sli-item-text">
                          <div className="sli-item-primary">{loc.name}</div>
                          <div className="sli-item-secondary">{loc.formattedAddress}</div>
                        </div>
                        <span className="sli-tag custom-tag">
                          {loc.side === 'PUNE_SIDE' ? 'Pune Area' : loc.side === 'MUMBAI_SIDE' ? 'Mumbai Area' : 'Address'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Fallback Option: Select Exact Typed Text */}
              {allowCustomAddress && query.trim() && (
                <div className="sli-group">
                  <div
                    role="option"
                    aria-selected={highlightedIndex === savedResults.length + customResults.length}
                    className={`sli-item manual-item ${
                      highlightedIndex === savedResults.length + customResults.length ? 'highlighted' : ''
                    }`}
                    onClick={() => handleSelectManualAddress(query)}
                  >
                    <MapPin size={15} color="#2563EB" className="sli-item-icon" />
                    <div className="sli-item-text">
                      <div className="sli-item-primary">
                        Use custom address: <strong>"{query}"</strong>
                      </div>
                      <div className="sli-item-secondary">
                        Doorstep chauffeur pickup/drop at this exact address
                      </div>
                    </div>
                    <span className="sli-tag manual-tag">Custom Address</span>
                  </div>
                </div>
              )}

              {/* No results message */}
              {savedResults.length === 0 && customResults.length === 0 && !loading && (
                <div className="sli-empty-state">
                  <p>No exact match found for "{query}".</p>
                  <button
                    type="button"
                    onClick={() => handleSelectManualAddress(query)}
                    className="sli-empty-btn"
                  >
                    Confirm "{query}" as custom location
                  </button>
                </div>
              )}
            </>
          ) : (
            /* STATE 2: EMPTY QUERY — SHOW POPULAR SAVED LOCATIONS */
            <>
              {/* Pune Side Popular Locations */}
              {puneLocations && puneLocations.length > 0 && (
                <div className="sli-group">
                  <div className="sli-group-header">
                    <MapPin size={12} color="#0099FF" />
                    <span>Popular Pune Side Locations</span>
                  </div>
                  {puneLocations.map((loc, idx) => {
                    const isHighlighted = highlightedIndex === idx;
                    return (
                      <div
                        key={loc.id}
                        role="option"
                        aria-selected={isHighlighted}
                        className={`sli-item ${isHighlighted ? 'highlighted' : ''}`}
                        onClick={() => handleSelectLocation(loc)}
                      >
                        {getItemIcon(loc)}
                        <div className="sli-item-text">
                          <div className="sli-item-primary">{loc.name}</div>
                          <div className="sli-item-secondary">Pune Corridor Hub</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Mumbai Side Popular Locations */}
              {mumbaiLocations && mumbaiLocations.length > 0 && (
                <div className="sli-group">
                  <div className="sli-group-header">
                    <MapPin size={12} color="#10B981" />
                    <span>Popular Mumbai Side Locations</span>
                  </div>
                  {mumbaiLocations.map((loc, idx) => {
                    const itemGlobalIdx = puneLocations.length + idx;
                    const isHighlighted = highlightedIndex === itemGlobalIdx;
                    return (
                      <div
                        key={loc.id}
                        role="option"
                        aria-selected={isHighlighted}
                        className={`sli-item ${isHighlighted ? 'highlighted' : ''}`}
                        onClick={() => handleSelectLocation(loc)}
                      >
                        {getItemIcon(loc)}
                        <div className="sli-item-text">
                          <div className="sli-item-primary">{loc.name}</div>
                          <div className="sli-item-secondary">Mumbai Corridor Hub</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Attribution Footer */}
          <div className="sli-footer">
            {isGoogleActive ? (
              <span className="sli-attribution">Powered by Google Places</span>
            ) : (
              <span className="sli-attribution">
                Search powered by OpenStreetMap • Type any street, society, or hotel
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
