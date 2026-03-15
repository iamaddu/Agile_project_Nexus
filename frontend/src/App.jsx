import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login            from './pages/Login';
import Register         from './pages/Register';
import ForgotPassword   from './pages/ForgotPassword';
import ResetPassword    from './pages/ResetPassword';
import Dashboard        from './pages/Dashboard';
import AddTokens        from './pages/AddTokens';
import FindMentor       from './pages/FindMentor';
import BookSession      from './pages/BookSession';
import MySessions       from './pages/MySessions';
import SessionWorkspace from './pages/SessionWorkspace';
import Quiz             from './pages/Quiz';
import Certificate      from './pages/Certificate';
import BecomeMentor     from './pages/BecomeMentor';
import Profile          from './pages/Profile';
import Admin            from './pages/Admin';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh',
      color:'var(--n-400)', fontFamily:'var(--f)', fontSize:14, gap:10 }}>
      <div style={{ width:20, height:20, border:'2px solid var(--border)',
        borderTop:'2px solid var(--brand)', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
      Loading…
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/"                       element={<Navigate to="/login" replace />} />
          <Route path="/login"                  element={<Login />} />
          <Route path="/register"               element={<Register />} />
          <Route path="/forgot-password"        element={<ForgotPassword />} />
          <Route path="/reset-password/:token"  element={<ResetPassword />} />
          <Route path="/dashboard"              element={<Protected><Dashboard /></Protected>} />
          <Route path="/add-tokens"             element={<Protected><AddTokens /></Protected>} />
          <Route path="/find-mentor"            element={<Protected><FindMentor /></Protected>} />
          <Route path="/book/:mentorId"         element={<Protected><BookSession /></Protected>} />
          <Route path="/my-sessions"            element={<Protected><MySessions /></Protected>} />
          <Route path="/session/:sessionId"     element={<Protected><SessionWorkspace /></Protected>} />
          <Route path="/quiz/:sessionId"        element={<Protected><Quiz /></Protected>} />
          <Route path="/certificate/:sessionId" element={<Protected><Certificate /></Protected>} />
          <Route path="/become-mentor"          element={<Protected><BecomeMentor /></Protected>} />
          <Route path="/profile"               element={<Protected><Profile /></Protected>} />
          <Route path="/admin"                  element={<Protected><Admin /></Protected>} />
          <Route path="*"                       element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
