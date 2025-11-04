import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Auth from './pages/Auth';
import HomeInfo from './components/HomeInfo';
import Dashboard from './pages/Dashboard';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomeInfo />} />
          <Route path="auth" element={<Auth />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
