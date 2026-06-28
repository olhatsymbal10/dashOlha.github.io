/**
 * Entry point per la sezione Admin.
 */
import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { PinLogin } from './components/PinLogin';
import { ProtectedRoute } from './components/ProtectedRoute';
import { BookingList } from './components/BookingList';
import { ReviewList } from './components/ReviewsList';
import { TrashBin } from './components/TrashBin';
import { NotificationBell } from './components/NotificationBell';
import { logoutAdmin } from './utils/adminAuth';
import { LogOut, Calendar, Star, Trash2 } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'bookings' | 'reviews' | 'trash'>('bookings');

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Admin */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full min-h-[48px] min-w-[48px] flex items-center justify-center"
              aria-label="Logout"
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-3xl mx-auto px-4 flex gap-4 border-t border-gray-100">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'bookings' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar size={18} />
            Prenotazioni
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'reviews' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Star size={18} />
            Recensioni
          </button>
          <button
            onClick={() => setActiveTab('trash')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'trash' 
                ? 'border-red-600 text-red-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Trash2 size={18} />
            Cestino
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {activeTab === 'bookings' ? <BookingList /> : activeTab === 'reviews' ? <ReviewList /> : <TrashBin />}
      </main>
    </div>
  );
};

export const AdminApp: React.FC = () => {
  return (
    <Routes>
      <Route path="login" element={<PinLogin />} />
      <Route element={<ProtectedRoute />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="" element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
};
