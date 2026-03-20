import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardGarage from '../DashboardGarage';

vi.mock('../../shared/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../api/mecaniciens', () => ({
  fetchGarageMecaniciensRequest: vi.fn(),
  fetchMecanicienDisponibilitesRequest: vi.fn(),
}));

vi.mock('../../api/rendezVous', () => ({
  fetchRendezVousRequest: vi.fn(),
}));

vi.mock('../../api/services', () => ({
  fetchGarageServicesRequest: vi.fn(),
}));

vi.mock('../../api/disponibilites', () => ({
  fetchGarageDisponibilitesRequest: vi.fn(),
}));

const { useAuth } = await import('../../shared/auth/AuthContext');
const { fetchGarageMecaniciensRequest, fetchMecanicienDisponibilitesRequest } = await import('../../api/mecaniciens');
const { fetchRendezVousRequest } = await import('../../api/rendezVous');
const { fetchGarageServicesRequest } = await import('../../api/services');
const { fetchGarageDisponibilitesRequest } = await import('../../api/disponibilites');

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardGarage />
    </MemoryRouter>
  );
}

describe('DashboardGarage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      currentGarage: {
        id: 1,
        slug: 'garage-central',
        name: 'Garage Central',
        address: '123 rue Test',
        phone: '555-1111',
        description: '',
      },
      loading: false,
      error: null,
      user: {
        role: 'owner',
        email: 'owner@test.com',
        garage_id: 1,
      },
      refreshCurrentGarage: vi.fn().mockResolvedValue(),
    });
    fetchGarageMecaniciensRequest.mockResolvedValue([
      { id: 10, first_name: 'Jean', last_name: 'Test' },
    ]);
    fetchMecanicienDisponibilitesRequest.mockResolvedValue([]);
    fetchGarageServicesRequest.mockResolvedValue([]);
    fetchGarageDisponibilitesRequest.mockResolvedValue([]);
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
    expect(screen.getByText(/Diffusion a completer avant partage large/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apercu public/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Partager/i })).toBeInTheDocument();
    expect(screen.getByText(/Demandes via lien/i)).toBeInTheDocument();
  });

  it('affiche les cartes actionnables du dashboard une fois les donnees chargees', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(fetchRendezVousRequest).toHaveBeenCalled();
    });

    expect(screen.getByText(/A confirmer aujourd hui/i)).toBeInTheDocument();
    expect(screen.getByText(/Temps moyen de reponse/i)).toBeInTheDocument();
    expect(screen.getByText(/Ce qui manque pour etre operationnel/i)).toBeInTheDocument();
  });
});
