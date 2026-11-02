import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  LuMapPin,
  LuSearch,
  LuCheck,
  LuX,
  LuChevronDown,
  LuRotateCcw,
  LuBuilding,
  LuMap,
} from "react-icons/lu";
import { INDIA_STATES_AND_CITIES, ALL_INDIAN_STATES } from "../data/indiaLocations";
import "./indiaLocationPicker.css";

/**
 * IndiaLocationPicker:
 * - Types any word -> live suggestions of all 28 states & 8 UTs from India
 * - Selects a state -> search cities belonging to that selected state
 * - Types city name -> shows all city suggestions of that state
 * - Selects both -> updates as "<City>, <State>"
 */
export default function IndiaLocationPicker({
  currentValue = "",
  onSelectLocation,
  onCancel,
  compact = false,
  autoFocus = true,
}) {
  const [selectedState, setSelectedState] = useState("");
  const [stateQuery, setStateQuery] = useState("");
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  const [selectedCity, setSelectedCity] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const stateInputRef = useRef(null);
  const cityInputRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize from currentValue if it matches "City, State"
  useEffect(() => {
    if (currentValue && currentValue.includes(",")) {
      const parts = currentValue.split(",").map((s) => s.trim());
      if (parts.length >= 2) {
        const potentialState = parts[parts.length - 1];
        const potentialCity = parts.slice(0, parts.length - 1).join(", ");
        const matchedState = ALL_INDIAN_STATES.find(
          (st) => st.toLowerCase() === potentialState.toLowerCase()
        );
        if (matchedState) {
          setSelectedState(matchedState);
          setSelectedCity(potentialCity);
          setStateQuery(matchedState);
          setCityQuery(potentialCity);
          return;
        }
      }
    }
    if (autoFocus && stateInputRef.current) {
      stateInputRef.current.focus();
    }
  }, [currentValue, autoFocus]);

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowStateDropdown(false);
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered States suggestions based on user typing
  const filteredStates = useMemo(() => {
    const q = stateQuery.trim().toLowerCase();
    if (!q) {
      return ALL_INDIAN_STATES;
    }
    return ALL_INDIAN_STATES.filter((st) => st.toLowerCase().includes(q));
  }, [stateQuery]);

  // Filtered Cities suggestions for selected state based on user typing
  const filteredCities = useMemo(() => {
    if (!selectedState) return [];
    const availableCities = INDIA_STATES_AND_CITIES[selectedState] || [];
    const q = cityQuery.trim().toLowerCase();
    if (!q) {
      return availableCities;
    }
    return availableCities.filter((ct) => ct.toLowerCase().includes(q));
  }, [selectedState, cityQuery]);

  // When user clicks a State suggestion
  const handleSelectState = (state) => {
    setSelectedState(state);
    setStateQuery(state);
    setShowStateDropdown(false);
    setSelectedCity("");
    setCityQuery("");
    setShowCityDropdown(true);

    // Focus City input after state is selected
    setTimeout(() => {
      if (cityInputRef.current) {
        cityInputRef.current.focus();
      }
    }, 50);
  };

  // When user clicks a City suggestion
  const handleSelectCity = (city) => {
    setSelectedCity(city);
    setCityQuery(city);
    setShowCityDropdown(false);

    // Format: City followed by State (e.g. "Bengaluru, Karnataka")
    const formattedLocation = `${city}, ${selectedState}`;
    if (onSelectLocation) {
      onSelectLocation(formattedLocation);
    }
  };

  // Reset to re-select State
  const handleResetState = () => {
    setSelectedState("");
    setStateQuery("");
    setSelectedCity("");
    setCityQuery("");
    setShowCityDropdown(false);
    setShowStateDropdown(true);
    setTimeout(() => {
      if (stateInputRef.current) stateInputRef.current.focus();
    }, 50);
  };

  return (
    <div
      ref={containerRef}
      className={`mz-loc-picker-root ${compact ? "is-compact" : ""}`}
    >
      <div className="mz-loc-picker-header">
        <div className="mz-loc-picker-header-title">
          <LuMapPin className="mz-loc-icon" size={16} />
          <span>Update Location (India States & Cities)</span>
        </div>
        {onCancel && (
          <button
            type="button"
            className="mz-loc-btn-cancel-top"
            onClick={onCancel}
            title="Cancel"
            aria-label="Cancel location update"
          >
            <LuX size={15} />
          </button>
        )}
      </div>

      <div className="mz-loc-picker-body">
        {/* STEP 1: Select State from India */}
        {!selectedState ? (
          <div className="mz-loc-step-block">
            <label className="mz-loc-label">
              <span className="mz-loc-step-num">1</span>
              <span>Search & Select Indian State:</span>
            </label>
            <div className="mz-loc-input-wrap">
              <LuMap className="mz-loc-input-icon" size={15} />
              <input
                ref={stateInputRef}
                type="text"
                className="mz-loc-input"
                placeholder="Type any word (e.g. Karnataka, Delhi, Maharashtra, Tamil Nadu)..."
                value={stateQuery}
                onChange={(e) => {
                  setStateQuery(e.target.value);
                  setShowStateDropdown(true);
                }}
                onFocus={() => setShowStateDropdown(true)}
              />
              {stateQuery && (
                <button
                  type="button"
                  className="mz-loc-clear-btn"
                  onClick={() => {
                    setStateQuery("");
                    setShowStateDropdown(true);
                    stateInputRef.current?.focus();
                  }}
                >
                  <LuX size={13} />
                </button>
              )}
            </div>

            {/* States Suggestion Dropdown */}
            {showStateDropdown && (
              <div className="mz-loc-dropdown">
                <div className="mz-loc-dropdown-header">
                  <span>
                    {filteredStates.length} Indian States & UTs found
                  </span>
                  <span className="mz-loc-dropdown-hint">Click to choose state</span>
                </div>
                <div className="mz-loc-dropdown-list">
                  {filteredStates.length > 0 ? (
                    filteredStates.map((st) => (
                      <div
                        key={st}
                        className="mz-loc-dropdown-item"
                        onMouseDown={() => handleSelectState(st)}
                      >
                        <div className="mz-loc-item-main">
                          <span className="mz-loc-item-flag">📍</span>
                          <span className="mz-loc-item-name">{st}</span>
                        </div>
                        <span className="mz-loc-item-citycount">
                          {INDIA_STATES_AND_CITIES[st]?.length || 0} cities
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="mz-loc-dropdown-empty">
                      No Indian state matching "{stateQuery}".
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* STEP 2: State Locked -> Search & Select City */
          <div className="mz-loc-step-block">
            <div className="mz-loc-selected-state-row">
              <div className="mz-loc-state-badge">
                <span className="mz-loc-state-badge-label">Selected State:</span>
                <span className="mz-loc-state-badge-val">📍 {selectedState}</span>
              </div>
              <button
                type="button"
                className="mz-loc-btn-change-state"
                onClick={handleResetState}
                title="Choose a different state"
              >
                <LuRotateCcw size={12} />
                <span>Change State</span>
              </button>
            </div>

            <label className="mz-loc-label" style={{ marginTop: "12px" }}>
              <span className="mz-loc-step-num">2</span>
              <span>Search & Select City in {selectedState}:</span>
            </label>
            <div className="mz-loc-input-wrap">
              <LuBuilding className="mz-loc-input-icon" size={15} />
              <input
                ref={cityInputRef}
                type="text"
                className="mz-loc-input"
                placeholder={`Type city name (e.g. ${
                  INDIA_STATES_AND_CITIES[selectedState]?.[0] || "City"
                }, ${
                  INDIA_STATES_AND_CITIES[selectedState]?.[1] || "Town"
                })...`}
                value={cityQuery}
                onChange={(e) => {
                  setCityQuery(e.target.value);
                  setShowCityDropdown(true);
                }}
                onFocus={() => setShowCityDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && cityQuery.trim()) {
                    e.preventDefault();
                    handleSelectCity(cityQuery.trim());
                  }
                }}
              />
              {cityQuery && (
                <button
                  type="button"
                  className="mz-loc-clear-btn"
                  onClick={() => {
                    setCityQuery("");
                    setShowCityDropdown(true);
                    cityInputRef.current?.focus();
                  }}
                >
                  <LuX size={13} />
                </button>
              )}
            </div>

            {/* Cities Suggestion Dropdown */}
            {showCityDropdown && (
              <div className="mz-loc-dropdown">
                <div className="mz-loc-dropdown-header">
                  <span>
                    Cities in {selectedState} ({filteredCities.length} available)
                  </span>
                  <span className="mz-loc-dropdown-hint">Click city to confirm</span>
                </div>
                <div className="mz-loc-dropdown-list">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((ct) => (
                      <div
                        key={ct}
                        className={`mz-loc-dropdown-item ${
                          selectedCity.toLowerCase() === ct.toLowerCase()
                            ? "is-active"
                            : ""
                        }`}
                        onMouseDown={() => handleSelectCity(ct)}
                      >
                        <div className="mz-loc-item-main">
                          <LuMapPin size={13} className="mz-loc-item-icon" />
                          <span className="mz-loc-item-name">{ct}</span>
                        </div>
                        <span className="mz-loc-item-preview">
                          {ct}, {selectedState}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="mz-loc-dropdown-empty">
                      <span>No predefined city matching "{cityQuery}".</span>
                      {cityQuery.trim() && (
                        <button
                          type="button"
                          className="mz-loc-btn-custom-city"
                          onMouseDown={() => handleSelectCity(cityQuery.trim())}
                        >
                          Use "{cityQuery.trim()}, {selectedState}"
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected Location Preview Badge */}
        {selectedCity && selectedState && (
          <div className="mz-loc-preview-box">
            <div className="mz-loc-preview-left">
              <LuCheck className="mz-loc-preview-check" size={16} />
              <div>
                <span className="mz-loc-preview-label">Selected Location:</span>
                <span className="mz-loc-preview-value">
                  {selectedCity}, {selectedState}
                </span>
              </div>
            </div>
            <span className="mz-loc-preview-pill">City, State</span>
          </div>
        )}
      </div>

      {onCancel && (
        <div className="mz-loc-footer-actions">
          <button
            type="button"
            className="mz-loc-btn-footer-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          {selectedCity && selectedState && (
            <button
              type="button"
              className="mz-loc-btn-footer-confirm"
              onClick={() => handleSelectCity(selectedCity)}
            >
              Apply "{selectedCity}, {selectedState}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
