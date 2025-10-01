// Idk why this doesn't work, might try get bennett to speedrun fixing it

// import React from 'react';
// import { render, screen, waitFor, fireEvent } from '@testing-library/react';
// import { MemoryRouter } from 'react-router-dom';
// import Binders from './Binders';
// import CreateBinder from './createBinder';
// import EditBinder from './editBinder';

// // Mock global fetch for all tests
// beforeEach(() => {
//   jest.clearAllMocks();
//   localStorage.clear();
//   global.fetch = jest.fn();
//   window.alert = jest.fn();
// });

// afterAll(() => {
//   jest.restoreAllMocks();
// });

// test('Binders page displays list of binders and shows View/Edit buttons', async () => {
//   const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
//   localStorage.setItem('userData', JSON.stringify(mockUser));

//   // Mock GET /binders
//   global.fetch.mockResolvedValueOnce({
//     ok: true,
//     json: async () => ({
//       binders: [{ id: 1, name: 'MyBinder', typeOfCard: 'pokemon' }]
//     })
//   });

//   render(
//     <MemoryRouter>
//       <Binders />
//     </MemoryRouter>
//   );

//   await waitFor(() => {
//     expect(screen.getByText(/MyBinder - pokemon/i)).toBeInTheDocument();
//   });

//   // Buttons present
//   expect(screen.getByText(/View/i)).toBeInTheDocument();
//   expect(screen.getByText(/Edit/i)).toBeInTheDocument();
// });

// test('CreateBinder posts to create-binder and shows success alert', async () => {
//   const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
//   localStorage.setItem('userData', JSON.stringify(mockUser));

//   // Mock POST /create-binder
//   global.fetch.mockResolvedValueOnce({
//     ok: true,
//     json: async () => ({ binder: { id: 2, name: 'New', typeOfCard: 'item' } })
//   });

//   render(
//     <MemoryRouter>
//       <CreateBinder />
//     </MemoryRouter>
//   );

//   // Fill form
//   fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'New' } });
//   fireEvent.change(screen.getByLabelText(/Type of Card/i), { target: { value: 'item' } });

//   fireEvent.click(screen.getByText(/Create Binder/i));

//   await waitFor(() => {
//     expect(global.fetch).toHaveBeenCalledWith(
//       'http://localhost:12343/create-binder',
//       expect.objectContaining({
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ name: 'New', typeOfCard: 'item' })
//       })
//     );
//   });

//   expect(window.alert).toHaveBeenCalled(); // success alert called
// });

// test('EditBinder loads binder details and submits edit', async () => {
//   const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
//   localStorage.setItem('userData', JSON.stringify(mockUser));

//   // Mock GET /binders/:id
//   global.fetch
//     .mockResolvedValueOnce({
//       ok: true,
//       json: async () => ({ binder: { id: 3, name: 'EditMe', typeofcard: 'energy' } })
//     })
//     // Mock POST /edit-binder
//     .mockResolvedValueOnce({
//       ok: true,
//       json: async () => ({ binder: { id: 3, name: 'Edited', typeOfCard: 'trainer' } })
//     });

//   render(
//     <MemoryRouter initialEntries={[{ pathname: '/edit-binder', state: { id: 3 } }]}>
//       <EditBinder />
//     </MemoryRouter>
//   );

//   // Wait for prefilled values from GET
//   await waitFor(() => {
//     expect(screen.getByDisplayValue(/EditMe/i)).toBeInTheDocument();
//     expect(screen.getByDisplayValue(/energy/i)).toBeInTheDocument();
//   });

//   // Change values and submit
//   fireEvent.change(screen.getByLabelText(/New Name/i), { target: { value: 'Edited' } });
//   fireEvent.change(screen.getByLabelText(/New Type of Card/i), { target: { value: 'trainer' } });

//   fireEvent.click(screen.getByText(/Edit Binder/i));

//   await waitFor(() => {
//     // second fetch is POST /edit-binder
//     expect(global.fetch).toHaveBeenCalledWith(
//       'http://localhost:12343/edit-binder',
//       expect.objectContaining({
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(expect.objectContaining({
//           id: 3,
//           name: 'Edited',
//           typeOfCard: 'trainer'
//         }))
//       })
//     );
//   });

//   expect(window.alert).toHaveBeenCalled(); // success alert
// });