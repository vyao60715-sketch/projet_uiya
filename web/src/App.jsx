import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'

import Connexion from './pages/auth/Connexion'
import Dashboard from './pages/dashboard/Dashboard'
import Biens from './pages/biens/Biens'
import NouveauBien from './pages/biens/NouveauBien'
import FicheBien from './pages/biens/FicheBien'
import Demandes from './pages/demandes/Demandes'
import Maintenance from './pages/maintenance/Maintenance'
import Inventaire from './pages/inventaire/Inventaire'
import Rapports from './pages/rapports/Rapports'
import Utilisateurs from './pages/administration/Utilisateurs'
import Referentiels from './pages/referentiels/Referentiels'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/biens" element={<PrivateRoute><Biens /></PrivateRoute>} />
          <Route path="/biens/nouveau" element={<PrivateRoute><NouveauBien /></PrivateRoute>} />
          <Route path="/biens/scan/:uuid" element={<PrivateRoute><FicheBien /></PrivateRoute>} />
          <Route path="/biens/:id" element={<PrivateRoute><FicheBien /></PrivateRoute>} />
          <Route path="/demandes" element={<PrivateRoute><Demandes /></PrivateRoute>} />
          <Route path="/maintenance" element={<PrivateRoute><Maintenance /></PrivateRoute>} />
          <Route path="/inventaire" element={<PrivateRoute><Inventaire /></PrivateRoute>} />
          <Route path="/rapports" element={<PrivateRoute><Rapports /></PrivateRoute>} />
          <Route path="/administration" element={<PrivateRoute roles={['admin', 'administrateur']}><Utilisateurs /></PrivateRoute>} />
          <Route path="/referentiels" element={<PrivateRoute roles={['admin', 'gestionnaire']}><Referentiels /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
