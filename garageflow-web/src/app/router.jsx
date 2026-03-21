import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import { AcceuilPage } from '../features/acceuil';
import { ConnexionPage, InscriptionPage } from '../features/authentification';
import {
  AnnuaireMecaniciensPage,
  BilanMecanicienPage,
  GestionVehiculeClientPage,
  ListeRendezVousClientPage,
  ProfileClientPage,
  RechercheGaragesPage,
} from '../features/client';
import {
  DashboardGaragePage,
  GestionProfilGaragePage,
  GestionServicesGaragePage,
  ReservationPubliqueGaragePage,
} from '../features/garages';
import {
  GestionDisponibilitesMecaniciensGaragePage,
  GestionMecaniciensGaragePage,
  ListeRendezVousMecanicienPage,
  ProfileMecanicienPage,
} from '../features/personnel';
import { GestionDisponibilitesGaragePage, PlanningGaragePage } from '../features/planification';
import { GestionRendezVousGaragePage } from '../features/rendezvous';
import { MenuLayout } from '../shared/layout';
import { ProtectedRoute } from '../shared/routing';

export default function AppRouter() {
  return (
    <Router>
      <div>
        <MenuLayout />

        <Routes>
          <Route path="/" element={<Navigate to="/acceuil" replace />} />
          <Route path="/acceuil" element={<AcceuilPage />} />
          <Route path="/connexion" element={<ConnexionPage />} />
          <Route path="/inscription" element={<InscriptionPage />} />
          <Route path="/garage/:slug/reservation" element={<ReservationPubliqueGaragePage />} />

          <Route
            path="/garage/dashboard"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <DashboardGaragePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/garage/profil"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <GestionProfilGaragePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/garage/mecaniciens"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <GestionMecaniciensGaragePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/garage/mecaniciens/disponibilites"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <GestionDisponibilitesMecaniciensGaragePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/garage/rendez-vous"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <GestionRendezVousGaragePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/garage/planning"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <PlanningGaragePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/garage/services"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <GestionServicesGaragePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/garage/disponibilites"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <GestionDisponibilitesGaragePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profil/client"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <ProfileClientPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil/client/vehicules"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <GestionVehiculeClientPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil/client/rendez-vous"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <RechercheGaragesPage />
              </ProtectedRoute>
            }
          />
          <Route path="/profil/client/paiement" element={<Navigate to="/profil/client" replace />} />
          <Route
            path="/profil/client/AnnuaireMecanicien"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <AnnuaireMecaniciensPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil/client/rendez-vous-client"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <ListeRendezVousClientPage />
              </ProtectedRoute>
            }
          />
          <Route path="/profil/client/factures" element={<Navigate to="/profil/client" replace />} />

          <Route
            path="/profil/mecanicien"
            element={
              <ProtectedRoute allowedRoles={['mecanicien']}>
                <ProfileMecanicienPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil/mecanicien/BilanMecanicien"
            element={
              <ProtectedRoute allowedRoles={['mecanicien']}>
                <BilanMecanicienPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil/mecanicien/vehicules"
            element={
              <ProtectedRoute allowedRoles={['mecanicien']}>
                <GestionVehiculeClientPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil/mecanicien/rendez-vous-mecanicien"
            element={
              <ProtectedRoute allowedRoles={['mecanicien']}>
                <ListeRendezVousMecanicienPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}
