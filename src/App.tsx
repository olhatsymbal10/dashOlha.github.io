/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AdminApp } from './admin/AdminApp';

// Placeholder per l'app cliente
const ClientApp = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
    <h1 className="text-3xl font-bold mb-4">Prenotazione Massaggi</h1>
    <p className="text-gray-600 mb-8 text-center">Interfaccia cliente non implementata in questo mockup.</p>
    <Link 
      to="/admin/login" 
      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
    >
      Vai alla Dashboard Admin
    </Link>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClientApp />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
