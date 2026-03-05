import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Spinner from './components/Spinner'
import AuthGuard from './components/AuthGuard'
import { AuthProvider } from './lib/AuthContext'

const Landing = lazy(() => import('./routes/Landing'))
const Identity = lazy(() => import('./routes/Identity'))
const Card = lazy(() => import('./routes/Card'))
const Quiz = lazy(() => import('./routes/Quiz'))
const Results = lazy(() => import('./routes/Results'))
const Leaderboard = lazy(() => import('./routes/Leaderboard'))

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<Spinner fullScreen />}>
        <Routes>
          {/* Landing is accessible without auth — QAApp.getAuthToken() is primed here */}
          <Route path="/" element={<Landing />} />

          {/* All identity/card/quiz/results routes require a valid session */}
          <Route
            path="/identity"
            element={<AuthGuard><Identity /></AuthGuard>}
          />
          <Route
            path="/card"
            element={<AuthGuard><Card /></AuthGuard>}
          />
          <Route
            path="/quiz"
            element={<AuthGuard><Quiz /></AuthGuard>}
          />
          <Route
            path="/results"
            element={<AuthGuard><Results /></AuthGuard>}
          />
          <Route
            path="/leaderboard"
            element={<AuthGuard><Leaderboard /></AuthGuard>}
          />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
