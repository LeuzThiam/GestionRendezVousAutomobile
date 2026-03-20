import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";

// Profils
import ProfileClient from "./Pages/ProfileClient.jsx";
import ProfileMecanicien from "./Pages/ProfileMecanicien.jsx";

// Composants annexes
import GestionVehicule from "./Pages/GestionVehicule.jsx";
import RendezVous from "./Pages/RendezVous.jsx";
import BilanMecanicien from "./Pages/BilanMecanicien.jsx";
import ListeRendezVousClient from "./Pages/ListeRendezVousClient.jsx";
import ListeRendezVousMecanicien from "./Pages/ListeRendezVousMecanicien.jsx";
import AnnuaireMecaniciens from "./Pages/AnnuaireMecaniciens.jsx";

// Menu (Navbar)
import Menu from "./Pages/Menu.jsx";

// Pages principales
import Acceuil from "./Pages/Acceuil.jsx";
import Inscription from "./Pages/Inscription.jsx";
import Connexion from "./Pages/Connexion.jsx";
import DashboardGarage from "./Pages/DashboardGarage.jsx";
import GestionDisponibilitesGarage from "./Pages/GestionDisponibilitesGarage.jsx";
import GestionMecaniciensGarage from "./Pages/GestionMecaniciensGarage.jsx";
import GestionProfilGarage from "./Pages/GestionProfilGarage.jsx";
import GestionRendezVousGarage from "./Pages/GestionRendezVousGarage.jsx";
import GestionServicesGarage from "./Pages/GestionServicesGarage.jsx";
import PlanningGarage from "./Pages/PlanningGarage.jsx";
import ReservationPubliqueGarage from "./Pages/ReservationPubliqueGarage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

// Styles
import "bootstrap/dist/css/bootstrap.min.css";
import "./Pages/style.css";

function App() {
  return (
    <Router>
      <div>
        {/* Menu disponible sur toutes les pages */}
        <Menu />

        <Routes>
          {/* 1) Page d’accueil */}
          <Route path="/acceuil" element={<Acceuil />} />

          {/* 2) Page de connexion */}
          <Route path="/connexion" element={<Connexion />} />

          {/* 3) Page d’inscription */}
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/garage/:slug/reservation" element={<ReservationPubliqueGarage />} />
          <Route
            path="/garage/dashboard"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <DashboardGarage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/garage/profil"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <GestionProfilGarage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/garage/mecaniciens"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <GestionMecaniciensGarage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/garage/rendez-vous"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <GestionRendezVousGarage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/garage/planning"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <PlanningGarage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/garage/services"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <GestionServicesGarage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/garage/disponibilites"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <GestionDisponibilitesGarage />
              </ProtectedRoute>
            }
          />

          {/* 4) Redirection de "/" vers "/acceuil" */}
          <Route path="/" element={<Navigate to="/acceuil" replace />} />

          {/* PROFIL CLIENT */}
          <Route
            path="/profil/client"
            element={
              <ProtectedRoute allowedRoles={["client"]}>
                <ProfileClient />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil/client/vehicules"
            element={
              <ProtectedRoute allowedRoles={["client"]}>
                <GestionVehicule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil/client/rendez-vous"
            element={
              <ProtectedRoute allowedRoles={["client"]}>
                <RendezVous />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil/client/paiement"
            element={<Navigate to="/profil/client" replace />}
          />
          <Route
            path="/profil/client/AnnuaireMecanicien"
            element={
              <ProtectedRoute allowedRoles={["client"]}>
                <AnnuaireMecaniciens />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil/client/rendez-vous-client"
            element={
              <ProtectedRoute allowedRoles={["client"]}>
                <ListeRendezVousClient />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil/client/factures"
            element={<Navigate to="/profil/client" replace />}
          />

          {/* PROFIL MECANICIEN */}
          <Route
            path="/profil/mecanicien"
            element={
              <ProtectedRoute allowedRoles={["mecanicien"]}>
                <ProfileMecanicien />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil/mecanicien/BilanMecanicien"
            element={
              <ProtectedRoute allowedRoles={["mecanicien"]}>
                <BilanMecanicien />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil/mecanicien/vehicules"
            element={
              <ProtectedRoute allowedRoles={["mecanicien"]}>
                <GestionVehicule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil/mecanicien/rendez-vous-mecanicien"
            element={
              <ProtectedRoute allowedRoles={["mecanicien"]}>
                <ListeRendezVousMecanicien />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
