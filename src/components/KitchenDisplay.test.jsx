import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import KitchenDisplay from './pages/KitchenDisplay';

// Mockeamos fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([
      {
        time: '12:25',
        type: 'delivery',
        number: '0431',
        customer: 'Thomas R.',
        items: {
          PLATS: ['1 Pizza Végétariana', '1 Pizza Margarita', '2 Burger Triple Steak'],
          DESSERTS: ['1 Tiramisu', '2 Ensalada de frutas']
        },
        status: 'in-progress'
      }
    ])
  })
);

describe('KitchenDisplay', () => {
  test('muestra "Cargando pedidos..." mientras se obtienen los datos', () => {
    render(<KitchenDisplay />);
    expect(screen.getByText(/Cargando pedidos.../i)).toBeInTheDocument();
  });

  test('muestra los pedidos una vez que se cargan', async () => {
    render(<KitchenDisplay />);

    await waitFor(() => {
      expect(screen.getByText('Thomas R.')).toBeInTheDocument();
    });
  });

  test('muestra un mensaje de error si falla la API', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Error al obtener los pedidos'))
    );

    render(<KitchenDisplay />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Error al obtener los pedidos/i)).toBeInTheDocument();
    });
  });
});
