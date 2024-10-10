import React from 'react';
import { render, screen } from '@testing-library/react';
import OrderCard from '../components/OrderCard';

describe('OrderCard', () => {
  const mockOrder = {
    time: '12:25',
    type: 'delivery',
    number: '0431',
    customer: 'Thomas R.',
    items: {
      PLATS: ['1 Pizza Végétariana', '1 Pizza Margarita'],
      DESSERTS: ['1 Tiramisu']
    },
    status: 'in-progress'
  };

  test('muestra la información del pedido correctamente', () => {
    render(<OrderCard {...mockOrder} />);

    expect(screen.getByText('12:25')).toBeInTheDocument();
    expect(screen.getByText('Thomas R.')).toBeInTheDocument();
    expect(screen.getByText('1 Pizza Végétariana')).toBeInTheDocument();
  });

  test('muestra el botón "Comenzar" si el estado es "in-progress"', () => {
    render(<OrderCard {...mockOrder} />);
    expect(screen.getByText(/Comenzar/i)).toBeInTheDocument();
  });
});
