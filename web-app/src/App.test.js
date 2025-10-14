import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';

test('renders login page when not authenticated', () => {
  render(<Router><App /></Router>);
  const linkElement = screen.getByText(/Portail de connexion/i);
  expect(linkElement).toBeInTheDocument();
});
