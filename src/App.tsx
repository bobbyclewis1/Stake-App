import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './supabase/auth'
import { ThemeProvider } from './components/ThemeProvider'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { BoardsPage } from './pages/BoardsPage'
import { Toaster } from './components/ui/toaster'
import { Board } from './components/Board'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" />
  }

  return <>{children}</>
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="tempoflow-theme">
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/boards"
              element={
                <ProtectedRoute>
                  <BoardsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/boards/:boardId"
              element={
                <PrivateRoute>
                  <Board />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App
