import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import AccountSettings from './pages/AccountSettings';
import { ThemeProvider } from './context/ThemeContext';
import { ChatThemeProvider } from './context/ChatThemeContext';
import { UserProvider } from './context/UserContext';
import { AgentProvider } from './context/AgentContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Wrapper to pass navigation props cleanly
function LandingWrapper() {
  const navigate = useNavigate();
  return <LandingPage onGetStarted={() => navigate('/auth')} />;
}

// Protected Route component
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  // Show a blank/loading screen while checking auth session initially
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center" style={{ background: '#050505' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <ThemeProvider>
          <ChatThemeProvider>
            <AgentProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<LandingWrapper />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
                </Routes>
              </BrowserRouter>
            </AgentProvider>
          </ChatThemeProvider>
        </ThemeProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
