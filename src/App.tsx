import Home from './pages/Home'
import ChinaTeams from './pages/ChinaTeams'
import { HashRouter, Routes, Route } from 'react-router'

export default function App() {
  return <HashRouter><Routes><Route path="/" element={<Home />} /><Route path="/china-teams" element={<ChinaTeams />} /></Routes></HashRouter>
}
