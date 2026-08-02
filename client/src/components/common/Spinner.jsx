import React from 'react';

const Spinner = ({ size = 20, color = '#1a2b4c', show = true }) => {
  if (!show) return null;
  return (
    <div
      className="inline-spinner"
      style={{
        width: size,
        height: size,
        borderColor: `${color}33`,
        borderTopColor: color,
      }}
    ></div>
  );
};

export default Spinner;