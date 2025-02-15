import React from "react";
import "./QuantityInput.css";

const QuantityInput = ({ value, onChange }) => {
  const handleDecrement = () => {
    if (value > 1) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    onChange(value + 1);
  };

  return (
    <div className="quantity-input">
      <button type="button" className="quantity-btn" onClick={handleDecrement}>
        -
      </button>
      <input
        type="number"
        className="quantity-display"
        value={value}
        onChange={(e) => {
          const newValue = parseInt(e.target.value, 10);
          if (!isNaN(newValue) && newValue >= 1) {
            onChange(newValue);
          }
        }}
        min="1"
      />
      <button type="button" className="quantity-btn" onClick={handleIncrement}>
        +
      </button>
    </div>
  );
};

export default QuantityInput;
