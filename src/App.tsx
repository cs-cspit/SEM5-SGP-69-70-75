
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SupabaseAppProvider } from "@/contexts/SupabaseAppContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Auth from "@/components/Auth";
import Dashboard from "@/components/Dashboard";
import MenuManagement from "@/components/MenuManagement";
import OrderManagement from "@/components/OrderManagement";
import AdvanceOrders from "@/components/AdvanceOrders";
import HeldOrders from "@/components/HeldOrders";
import Notifications from "@/components/Notifications";
import Reports from "@/components/Reports";
import Navbar from "@/components/Navbar";
import { useSupabaseApp } from "@/contexts/SupabaseAppContext";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useSupabaseApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/menu" element={<MenuManagement />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/advances" element={<AdvanceOrders />} />
          <Route path="/held-orders" element={<HeldOrders />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SupabaseAppProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </SupabaseAppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
