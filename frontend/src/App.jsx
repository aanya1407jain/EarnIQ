import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Quiz from './pages/Quiz.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Profile from './pages/Profile.jsx';
import Spinner from './components/Spinner.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <Spinner />;

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/auth"        element={<AuthPage />} />
        <Route path="/quiz"        element={<Protected><Quiz /></Protected>} />
        <Route path="/dashboard"   element={<Protected><Dashboard /></Protected>} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile"     element={<Protected><Profile /></Protected>} />
        <Route path="*"            element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
