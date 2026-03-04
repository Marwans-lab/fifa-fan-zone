import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Spinner from './components/Spinner'

const Landing = lazy(() => import('./routes/Landing'))
const Identity = lazy(() => import('./routes/Identity'))
const Card = lazy(() => import('./routes/Card'))
const Quiz = lazy(() => import('./routes/Quiz'))
const Results = lazy(() => import('./routes/Results'))

export default function App() {
  return (
    <Suspense fallback={<Spinner fullScreen />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/identity" element={<Identity />} />
        <Route path="/card" element={<Card />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </Suspense>
  )
}
