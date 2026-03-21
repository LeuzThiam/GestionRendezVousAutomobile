import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import GestionRendezVousGarage from '../../features/rendezvous/pages/GestionRendezVousGaragePage';

vi.mock('../../features/personnel/api', () => ({
  fetchGarageMecaniciensRequest: vi.fn(),
  fetchMecanicienDisponibilitesRequest: vi.fn(),
}));

vi.mock('../../features/rendezvous/api', () => ({
  fetchRendezVousRequest: vi.fn(),
  updateRendezVousRequest: vi.fn(),
}));

const { fetchGarageMecaniciensRequest, fetchMecanicienDisponibilitesRequest } = await import('../../features/personnel/api');
const { fetchRendezVousRequest } = await import('../../features/rendezvous/api');

function renderPage() {
  return render(
    <MemoryRouter>
      <GestionRendezVousGarage />
    </MemoryRouter>
  );
}

describe('GestionRendezVousGarage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchGarageMecaniciensRequest.mockResolvedValue([
      {
        id: 1,
        username: 'mecano-faible',
        first_name: 'Marc',
        last_name: 'Charge',
        is_active: true,
        specialites: '',
        rdv_today_count: 5,
        rdv_upcoming_count: 6,
      },
      {
        id: 2,
        username: 'mecano-bon',
        first_name: 'Sara',
        last_name: 'Disponible',
        is_active: true,
        specialites: 'vidange, diagnostic',
        rdv_today_count: 0,
        rdv_upcoming_count: 1,
      },
    ]);
    fetchMecanicienDisponibilitesRequest.mockResolvedValue([
      {
        id: 20,
        mecanicien: 2,
        jour_semaine: 5,
        jour_label: 'Samedi',
        heure_debut: '09:00',
        heure_fin: '12:00',
      },
    ]);
    fetchRendezVousRequest.mockResolvedValue([
      {
        id: 99,
        status: 'pending',
        date: '2099-10-10T10:00:00',
        requested_date: null,
        description: 'Vidange moteur',
        client_name: 'Client Garage',
        client_email: 'client@test.com',
        garage_name: 'Garage Central',
        mecanicien: null,
        vehicle: { marque: 'Toyota', modele: 'Corolla' },
        service: 7,
        service_details: { id: 7, nom: 'Vidange' },
        estimatedTime: null,
        quote: null,
        reason: '',
        reschedule_history: [],
      },
    ]);
  });

  it('propose un meilleur choix de mecanicien sur une demande en attente', async () => {
    renderPage();

    expect(await screen.findByText(/Meilleur choix suggere/i)).toBeInTheDocument();
    expect(screen.getByText(/Sara Disponible/i)).toBeInTheDocument();
    expect(screen.getByText(/Specialite coherente/i)).toBeInTheDocument();
  });

  it('bloque la confirmation tant que l affectation n est pas complete', async () => {
    const user = userEvent.setup();
    renderPage();

    const confirmButton = await screen.findByRole('button', { name: /^Confirmer$/i });
    expect(confirmButton).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Utiliser/i }));
    await user.selectOptions(screen.getByLabelText(/Duree estimee/i), '1.00');
    await user.type(screen.getByLabelText(/^Devis$/i), '120');

    await waitFor(() => {
      expect(screen.getByText(/Finalisez l affectation/i)).toBeInTheDocument();
    });
  });
});
