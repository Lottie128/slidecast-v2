import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      setLoading(false);
    } else {
      setIsAuthenticated(true);
      setLoading(false);
    }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return { isAuthenticated, loading, logout };
};
