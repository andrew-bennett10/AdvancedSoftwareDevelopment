# Advanced Software Development – Trading Card Companion

Repository: https://github.com/rjschweitz/AdvancedSoftwareDevelopment

## Project at a Glance
- **Backend (`/backend`)** – Express API with PostgreSQL integration. Handles account management, favourites CRUD, and database bootstrap scripts.
- **Frontend (`/frontend`)** – React (Create React App) client featuring login/signup, account settings, binders, and the Pokédex-inspired favourites experience.
- **Pipeline (`azure-pipelines.yml`)** – Azure DevOps pipeline that installs dependencies, provisions a Postgres test container, runs the database migration script, and executes the React unit test suite in CI.

## Local Setup
1. **Start the database**
   ```bash
   cd backend
   bash local_db.sh
   ```
   This launches a Docker container named `local-postgres` with the expected `testuser/testpassword` credentials.

2. **Prepare schema & seed data**
   ```bash
   npm install
   npm run db:init
   npm run db:seed
   ```

3. **Run the backend**
   ```bash
   npm start
   ```
   The API listens on `http://localhost:3001` and exposes `/signup`, `/login`, `/update-account`, `/change-password`, `/delete-account`, and `/api/favourites` endpoints.

4. **Run the frontend**
   ```bash
   cd ../frontend
   npm install
   npm start
   ```
   Visit `http://localhost:3000`. The home page includes a live card search that feeds into the favourites workflow.

5. **Clean up**
   ```bash
   docker stop local-postgres && docker rm local-postgres
   ```

## Automated Testing
- **Local run**: `cd frontend && CI=true npm test -- --watchAll=false`
- **CI run**: The Azure pipeline (`azure-pipelines.yml`) executes the same command after building the project. The log includes coverage output to demonstrate at least one successful test run, addressing the presentation rubric’s automated testing criteria.
- Current test coverage highlights:
  - `Account.test.js` – authentication guard & account interactions.
  - `App.test.js` – shell routing defaults.
  - `components/FavouriteButton.test.js` – add-to-favourites workflow, including API integration and event dispatch.

## Release 1 Demo Checklist
- **Feature completeness**: The Pokédex-style favourites page, live Pokémon TCG card search, and account workflows match the user stories targeted for this sprint.
- **User experience**: Consistent layout between login, dashboard, and favourites. Navigation shortcuts are built directly into the Pokédex header for quick demos.
- **Validation**: Forms enforce required fields and confirm password matches. The favourites API guards against missing identifiers.
- **Reusability**: `FavouriteButton` encapsulates API calls and broadcast events so other pages can favourite cards with minimal wiring.
- **Coding style**: ESLint/Prettier defaults from CRA plus project-specific conventions keep components tidy. Tests document the intended behaviour of key flows.

## Team Responsibilities
_Update the table as needed before the presentation to reflect final contributions._

| Team Member          | Focus Areas |
|----------------------|-------------|
| Reuben Schweitzer    | Pokédex favourites experience, Pokémon TCG search, FavouriteButton component, automated testing pipeline updates |
| Matthis Fontaine     | Initial project scaffolding, early backend routes, deployment setup |
| Andrew Bennett       | Account management flows, account unit tests, navigation scaffolding |
| LithiumMage          | (Update with contributions) |
| Mattvilliage         | (Update with contributions) |

## Demo Tips
- Run the Azure pipeline or show its latest successful execution to satisfy the “Automated Testing Demo” rubric item.
- From the home page: search for “Charizard”, add it to favourites, then open `/favourites?mode=server` to display the synced card list.
- Mention that categories persist in `localStorage` and the backend provides durable storage for favourites themselves.

For questions or follow-up, capture the pipeline log and a short screen recording of the UI prior to the presentation so you can demonstrate even if network access is limited.
