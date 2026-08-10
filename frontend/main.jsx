import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/Components/alert';
import './app.css';
// Canonical validation/focus styles for every department form — imported last so
// it wins over the per-page stylesheets it replaces.
import './src/styles/ComponentStyles/FormValidation.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider position="top-right">
        <App />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);