// src/components/MesFactures.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Container, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoice } from '@fortawesome/free-solid-svg-icons';

import { fetchFactures } from '../features/facturesSlice';

function MesFactures() {
  const dispatch = useDispatch();
  const { factures, loading, error } = useSelector((state) => state.factures);

  useEffect(() => {
    // Récupère la liste des factures au montage
    dispatch(fetchFactures());
  }, [dispatch]);

  return (
    <Container className="mt-5">
      <h2 className="text-center mb-4">
        <FontAwesomeIcon icon={faFileInvoice} className="me-2" /> Mes Factures
      </h2>

      {loading && <p>Chargement des factures...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && factures.length > 0 ? (
        <Row className="g-4">
          {factures.map((facture, index) => (
            <Col xs={12} md={6} lg={4} key={index}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Body>
                  {/* Adaptez les noms de champs en fonction de votre API */}
                  <p>
                    <strong>Numéro de facture :</strong> {facture.id}
                  </p>
                  <p>
                    <strong>Date d'émission : </strong>
                      {new Date(facture.date_emission).toLocaleString()}
                  </p>

                  <p>
                    <strong>Montant :</strong>{' '}
                    {facture.montant
                      ? Number(facture.montant).toFixed(2)
                      : '0.00'}{' '}
                    $
                  </p>
                  <p>
                    <strong>Carte :</strong> **** **** ****{' '}
                    {facture.card_number
                      ? facture.card_number.slice(-4)
                      : ''}
                  </p>
                  <p>
                    <strong>Véhicule :</strong> {facture.vehicule}
                  </p>
                  <p>
                    <strong>Symptômes :</strong> {facture.symptomes}
                  </p>
                  {/* Ajoutez ou retirez des champs selon la réponse réelle */}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        !loading && (
          <p className="text-center">
            Aucune facture disponible.
          </p>
        )
      )}
    </Container>
  );
}

export default MesFactures;
