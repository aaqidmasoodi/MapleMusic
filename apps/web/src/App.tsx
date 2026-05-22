import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { useAuthStore } from './stores/auth.store'
import { audioEngine } from './lib/audio-engine'
import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AuthPage } from './pages/auth/AuthPage'
import { ExplorePage } from './pages/ExplorePage'
import { RadioPage } from './pages/RadioPage'
import { LibraryPage } from './pages/LibraryPage'
import { PlaylistPage } from './pages/PlaylistPage'
import { ProfilePage } from './pages/ProfilePage'

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    void initialize()
    audioEngine.start()
  }, [initialize])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/library" replace />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/radio" element={<RadioPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/playlist/:id" element={<PlaylistPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/library" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
