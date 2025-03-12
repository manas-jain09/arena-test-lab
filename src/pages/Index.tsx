
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/admin/dashboard');
    } else {
      navigate('/login');
    }
  }, [navigate, user]);

  return null;
};

export default Index;
