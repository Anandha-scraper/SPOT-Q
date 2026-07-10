import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/Components/alert';
import './app.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider position="top-right">
        <App />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);