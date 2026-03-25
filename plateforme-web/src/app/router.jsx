import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import { AcceuilPage } from '../features/acceuil';
import { ConnexionPage, InscriptionPage } from '../features/authentification';
import {
  AnnuaireMecaniciensPage,
  BilanMecanicienPage,
  ListeRendezVousClientPage,
  ProfileClientPage,
  RechercheOrganisationsPage,
} from '../features/client';
import {
  DashboardProPage,
  GestionProfilProPage,
  GestionServicesProPage,
  ReservationPubliquePage,
} from '../features/organizations';
import {
  GestionDisponibilitesMecaniciensProPage,
  GestionMecaniciensProPage,
  ListeRendezVousMecanicienPage,
  ProfileMecanicienPage,
} from '../features/personnel';
import { GestionDisponibilitesProPage, PlanningProPage } from '../features/planification';
import { GestionRendezVousProPage } from '../features/rendezvous';
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
          <Route path="/pro/:slug/reservation" element={<ReservationPubliquePage />} />

          <Route
            path="/pro/dashboard"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <DashboardProPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pro/profil"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <GestionProfilProPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pro/mecaniciens"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <GestionMecaniciensProPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pro/mecaniciens/disponibilites"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <GestionDisponibilitesMecaniciensProPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pro/rendez-vous"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <GestionRendezVousProPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pro/planning"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <PlanningProPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pro/services"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <GestionServicesProPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pro/disponibilites"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <GestionDisponibilitesProPage />
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
            path="/profil/client/rendez-vous"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <RechercheOrganisationsPage />
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
              <ProtectedRoute allowedRoles={['mecanicien', 'employe']}>
                <ProfileMecanicienPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil/mecanicien/BilanMecanicien"
            element={
              <ProtectedRoute allowedRoles={['mecanicien', 'employe']}>
                <BilanMecanicienPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil/mecanicien/rendez-vous-mecanicien"
            element={
              <ProtectedRoute allowedRoles={['mecanicien', 'employe']}>
                <ListeRendezVousMecanicienPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}
