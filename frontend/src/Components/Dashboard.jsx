import React from 'react';
import '../styles/ComponentStyles/Dashboard.css';

const Dashboard = ({ children }) => {
  return (
    <div className="dashboard-page-container">
      <main className="dashboard-page-content">
        {children}
      </main>
    </div>
  );
};

export default Dashboard;