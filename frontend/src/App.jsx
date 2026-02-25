import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import './App.css';

// Wrapper to pass navigation props cleanly
function LandingWrapper() {
  const navigate = useNavigate();
  return <LandingPage onGetStarted={() => navigate('/dashboard')} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingWrapper />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
