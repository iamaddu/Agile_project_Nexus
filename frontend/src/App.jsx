import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import AddTokens from './pages/AddTokens';
import FindMentor from './pages/FindMentor';
import BookSession from './pages/BookSession';
import MySessions from './pages/MySessions';
import SessionWorkspace from './pages/SessionWorkspace';
import Quiz from './pages/Quiz';
import Certificate from './pages/Certificate';
import BecomeMentor from './pages/BecomeMentor';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'#8888aa', fontFamily:'Syne,sans-serif', fontSize:14 }}>
      Loading…
    </div>
  );
  return user ? children : <Navigate to="/login" />;
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password/:token', element: <ResetPassword /> },
  { path: '/dashboard', element: <Protected><Dashboard /></Protected> },
  { path: '/add-tokens', element: <Protected><AddTokens /></Protected> },
  { path: '/find-mentor', element: <Protected><FindMentor /></Protected> },
  { path: '/book/:mentorId', element: <Protected><BookSession /></Protected> },
  { path: '/my-sessions', element: <Protected><MySessions /></Protected> },
  { path: '/session/:sessionId', element: <Protected><SessionWorkspace /></Protected> },
  { path: '/quiz/:sessionId', element: <Protected><Quiz /></Protected> },
  { path: '/certificate/:sessionId', element: <Protected><Certificate /></Protected> },
  { path: '/become-mentor', element: <Protected><BecomeMentor /></Protected> },
  { path: '/profile', element: <Protected><Profile /></Protected> },
  { path: '/admin', element: <Protected><Admin /></Protected> },
], {
  future: { v7_relativeSplatPath: true }
});

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
