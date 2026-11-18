import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

/**
 * Universal DateInput component
 * Resolves the mobile visibility issue where native <input type="date">
 * renders completely blank on iOS Safari and mobile Chrome when empty.
 * 
 * - Displays a clear DD/MM/YYYY placeholder hint on mobile & desktop when empty
 * - Preserves native mobile date-picker wheels/dialogs
 * - Keeps date validation, formats (YYYY-MM-DD), and min/max restrictions intact
 * - Displays crisp calendar icon on right side across all devices
 */
export const DateInput = ({
  value = '',
  onChange,
  min,
  max,
  className = '',
  wrapperClassName = '',
  id,
  name,
  required = false,
  disabled = false,
  placeholder = 'DD/MM/YYYY',
  iconColor = '#0099FF',
  iconSize = 15,
  style = {},
  wrapperStyle = {},
  ariaLabel,
  onClick,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = Boolean(value);

  const handleClick = (e) => {
    if (onClick) onClick(e);
    try {
      if (typeof e.target.showPicker === 'function') {
        e.target.showPicker();
      }
    } catch (err) {
      // showPicker may throw if picker is already open or restricted by browser
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <div
      className={`date-input-wrapper ${wrapperClassName}`}
      style={wrapperStyle}
    >
      <input
        type="date"
        id={id}
        name={name}
        min={min}
        max={max}
        value={value || ''}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-label={ariaLabel || placeholder}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`date-input-field ${className} ${hasValue ? 'has-value' : 'is-empty'} ${isFocused ? 'is-focused' : ''}`}
        style={{
          color: hasValue || isFocused ? '#0F172A' : 'transparent',
          ...style,
        }}
        {...props}
      />
      {!hasValue && !isFocused && (
        <span className="date-input-placeholder" aria-hidden="true">
          {placeholder}
        </span>
      )}
      <span className="date-input-icon" aria-hidden="true">
        <Calendar size={iconSize} color={iconColor} />
      </span>
    </div>
  );
};

export default DateInput;
