import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import AccountSettings from './pages/AccountSettings';
import { ThemeProvider } from './context/ThemeContext';
import { ChatThemeProvider } from './context/ChatThemeContext';
import { UserProvider } from './context/UserContext';
import { AgentProvider } from './context/AgentContext';
import './App.css';

// Wrapper to pass navigation props cleanly
function LandingWrapper() {
  const navigate = useNavigate();
  return <LandingPage onGetStarted={() => navigate('/auth')} />;
}

function App() {
  return (
    <UserProvider>
      <ThemeProvider>
        <ChatThemeProvider>
          <AgentProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingWrapper />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<AccountSettings />} />
              </Routes>
            </BrowserRouter>
          </AgentProvider>
        </ChatThemeProvider>
      </ThemeProvider>
    </UserProvider>
  );
}

// ... rest of file (export)

export default App;
