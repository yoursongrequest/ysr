import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import HomePage from '@/pages/HomePage';
import ArtistPage from '@/pages/ArtistPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import AdminDashboard from '@/pages/AdminDashboard';
import ProfilePage from '@/pages/ProfilePage';
import SetlistPage from '@/pages/SetlistPage';
import CalendarPage from '@/pages/CalendarPage';
import LiveDashboardPage from '@/pages/LiveDashboardPage';
import PayoutsPage from '@/pages/PayoutsPage';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-black text-white">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/artist/:artistId" element={<ArtistPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/admin/setlist" element={
              <ProtectedRoute>
                <SetlistPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/calendar" element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/live" element={
              <ProtectedRoute>
                <LiveDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/payouts" element={
              <ProtectedRoute>
                <PayoutsPage />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;