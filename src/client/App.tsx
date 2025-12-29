// ============================================
// SlideCast V2 - Root Application Component
// ============================================

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ErrorBoundary from './components/Common/ErrorBoundary';
import Navbar from './components/Layout/Navbar';
import Preloader from './components/Common/Preloader';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);
  
  if (loading) {
    return <Preloader />;
  }
  
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          {isAuthenticated && <Navbar />}
          
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} />
            <Route path="/editor/:projectId" element={isAuthenticated ? <EditorPage /> : <Navigate to="/login" />} />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
