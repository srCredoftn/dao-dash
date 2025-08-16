import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AuthenticatedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import DaoDetail from "./pages/DaoDetail";
import Login from "./pages/Login";
import AdminUsers from "./pages/AdminUsers";
import Profile from "./pages/Profile";
import UserManagement from "./pages/UserManagement";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/"
              element={
                <AuthenticatedRoute>
                  <Index />
                </AuthenticatedRoute>
              }
            />
            <Route
              path="/dao/:id"
              element={
                <AuthenticatedRoute>
                  <DaoDetail />
                </AuthenticatedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AuthenticatedRoute requiredRoles={["admin"]}>
                  <AdminUsers />
                </AuthenticatedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthenticatedRoute>
                  <Profile />
                </AuthenticatedRoute>
              }
            />
            <Route
              path="/user-management"
              element={
                <AuthenticatedRoute requiredRoles={["admin"]}>
                  <UserManagement />
                </AuthenticatedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
