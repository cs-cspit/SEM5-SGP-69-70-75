
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from '@/components/LoginForm';
import Registration from '@/components/Registration';
import Dashboard from '@/components/Dashboard';
import MenuManagement from '@/components/MenuManagement';
import OrderManagement from '@/components/OrderManagement';
import AdvanceOrders from '@/components/AdvanceOrders';
import HeldOrders from '@/components/HeldOrders';
import TotalOrders from '@/components/TotalOrders';
import Reports from '@/components/Reports';
import Notifications from '@/components/Notifications';
import { AppProvider } from '@/contexts/AppContext';

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [showRegistration, setShowRegistration] = useState(false);
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('userRole') || '';
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username') || '';
  });

  const handleLogin = (user: string, role: string) => {
    setUsername(user);
    setUserRole(role);
    setIsLoggedIn(true);
    setShowRegistration(false);
    // Persist login state
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', role);
    localStorage.setItem('username', user);
  };

  const handleRegister = (user: string, role: string) => {
    setShowRegistration(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole('');
    setUsername('');
    setShowRegistration(false);
    // Clear login state but preserve app data
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
  };

  const showRegistrationForm = () => {
    setShowRegistration(true);
  };

  const backToLogin = () => {
    setShowRegistration(false);
  };

  if (!isLoggedIn) {
    if (showRegistration) {
      return <Registration onRegister={handleRegister} onBackToLogin={backToLogin} />;
    }
    return <LoginForm onLogin={handleLogin} onRegister={showRegistrationForm} />;
  }

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {username}</span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-600 capitalize">{userRole} Dashboard</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>

        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/menu" element={<MenuManagement />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/advances" element={<AdvanceOrders />} />
          <Route path="/held-orders" element={<HeldOrders />} />
          <Route path="/total-orders" element={<TotalOrders />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </div>
    </AppProvider>
  );
};

export default Index;
