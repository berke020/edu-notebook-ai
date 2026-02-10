import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import EduNotebook from './components/EduNotebook';
import Home from './components/Home';
import Auth from './components/Auth';
import Landing from './components/Landing';
import PresentationShare from './components/PresentationShare';
import ShareQr from './components/ShareQr';
import { supabase } from './services/supabaseClient';

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] text-[#E6E9EF]">
        Yükleniyor...
      </div>
    );
  }

  const RoomWrapper = () => {
    const { id } = useParams();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const initialFocusMode = params.get('focus') === '1';
    return (
      <EduNotebook
        initialSessionId={id}
        initialFocusMode={initialFocusMode}
        onBackHome={() => navigate('/app')}
        onLogout={async () => {
          await supabase.auth.signOut();
          navigate('/');
        }}
      />
    );
  };

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={session ? <Navigate to="/app" replace /> : <Auth onAuthed={() => navigate('/app')} />} />
      <Route
        path="/app"
        element={
          session ? (
            <Home onLogout={async () => { await supabase.auth.signOut(); navigate('/'); }} />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
      <Route path="/room/:id" element={session ? <RoomWrapper /> : <Navigate to="/auth" replace />} />
      <Route path="/share/:id" element={<PresentationShare />} />
      <Route path="/share/:id/qr" element={<ShareQr />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
