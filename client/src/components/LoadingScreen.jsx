import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="bank-loader">
        <div className="bank-loader-icon">🏦</div>
        <div className="spinner"></div>
        <h2>SecureBank</h2>
        <p>Loading your banking experience...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;