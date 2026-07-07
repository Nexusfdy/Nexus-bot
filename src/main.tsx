import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import LoginScreen from './components/LoginScreen.tsx';
import ResetPasswordScreen from './components/ResetPasswordScreen.tsx';
import './index.css';

function Root() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('adminToken'));
  
  // Basic routing for reset password
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('token');
  const isResetRoute = window.location.pathname === '/reset-password' && resetToken;

  useEffect(() => {
    const handleAuthError = () => {
      setIsAuthenticated(false);
    };
    window.addEventListener('auth_error', handleAuthError);
    return () => window.removeEventListener('auth_error', handleAuthError);
  }, []);

  const handleLogin = (token: string) => {
    localStorage.setItem('adminToken', token);
    setIsAuthenticated(true);
    // clean up url if it was reset route
    if (isResetRoute) {
      window.history.replaceState({}, document.title, '/');
    }
  };

  if (isResetRoute && !isAuthenticated) {
    return <ResetPasswordScreen token={resetToken} onLogin={handleLogin} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
