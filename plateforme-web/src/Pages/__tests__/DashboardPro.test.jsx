import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPro from '../../features/organizations/pages/DashboardProPage';

vi.mock('../../shared/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../features/personnel/api', () => ({
  fetchOrganizationMecaniciensRequest: vi.fn(),
  fetchMecanicienDisponibilitesRequest: vi.fn(),
}));

vi.mock('../../features/rendezvous/api', () => ({
  fetchRendezVousRequest: vi.fn(),
}));

vi.mock('../../features/organizations/api', () => ({
  fetchOrganizationServicesRequest: vi.fn(),
}));

vi.mock('../../features/planification/api', () => ({
  fetchOrganizationDisponibilitesRequest: vi.fn(),
}));

const { useAuth } = await import('../../shared/auth');
const { fetchOrganizationMecaniciensRequest, fetchMecanicienDisponibilitesRequest } = await import('../../features/personnel/api');
const { fetchRendezVousRequest } = await import('../../features/rendezvous/api');
const { fetchOrganizationServicesRequest } = await import('../../features/organizations/api');
const { fetchOrganizationDisponibilitesRequest } = await import('../../features/planification/api');

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPro />
    </MemoryRouter>
  );
}

describe('DashboardPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      currentOrganization: {
        id: 1,
        slug: 'org-centrale',
        name: 'Organisation centrale',
        address: '123 rue Test',
        phone: '555-1111',
        description: '',
      },
      loading: false,
      error: null,
      user: {
        role: 'owner',
        email: 'owner@test.com',
        organization_id: 1,
      },
      refreshCurrentOrganization: vi.fn().mockResolvedValue(),
    });
    fetchOrganizationMecaniciensRequest.mockResolvedValue([
      { id: 10, first_name: 'Jean', last_name: 'Test' },
    ]);
    fetchMecanicienDisponibilitesRequest.mockResolvedValue([]);
    fetchOrganizationServicesRequest.mockResolvedValue([]);
    fetchOrganizationDisponibilitesRequest.mockResolvedValue([]);
    fetchRendezVousRequest.mockResolvedValue([
      {
        id: 100,
        status: 'pending',
        date: '2099-10-10T10:00:00',
        client_name: 'Client A',
        service_details: { nom: 'Vidange' },
        has_pending_reschedule: false,
      },
      {
        id: 101,
        status: 'modification_requested',
        date: '2099-10-10T11:00:00',
        client_name: 'Client B',
        service_details: { nom: 'Diagnostic' },
        has_pending_reschedule: true,
      },
    ]);
  });

  it('affiche les alertes prioritaires et les manques de diffusion publique', async () => {
    renderDashboard();

    expect(await screen.findByText('Alertes prioritaires')).toBeInTheDocument();
    expect(screen.getByText(/Diffusion à compléter avant partage large/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Aperçu public/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Partager/i })).toBeInTheDocument();
    expect(screen.getByText(/Demandes via lien/i)).toBeInTheDocument();
  });

  it('affiche les cartes actionnables du dashboard une fois les donnees chargees', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(fetchRendezVousRequest).toHaveBeenCalled();
    });

    expect(screen.getByText(/À confirmer aujourd’hui/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Temps moyen de réponse/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Ce qui manque pour être opérationnel/i)).toBeInTheDocument();
  });
});
