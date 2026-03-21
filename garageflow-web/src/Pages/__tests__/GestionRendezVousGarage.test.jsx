import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
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
    expect(screen.getAllByText(/Sara Disponible/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Specialite coherente/i).length).toBeGreaterThan(0);
  });

  it('garde la confirmation bloquee tant que l affectation n est pas complete puis la permet apres saisie', async () => {
    const user = userEvent.setup();
    renderPage();

    const confirmButton = await screen.findByRole('button', { name: /^Confirmer$/i });
    expect(confirmButton).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Utiliser/i }));
    const durationSelect = screen
      .getAllByRole('combobox')
      .find((element) => within(element).queryByRole('option', { name: /1\.00 h/i }));
    expect(durationSelect).toBeTruthy();
    await user.selectOptions(durationSelect, '1.00');

    await user.type(screen.getByRole('spinbutton'), '120');

    await waitFor(() => {
      expect(confirmButton).toBeEnabled();
    });
  });
});
