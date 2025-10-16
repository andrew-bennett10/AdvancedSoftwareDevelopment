# AdvancedSoftwareDevelopment

### Project Structure
backend/  
Contains database configuration and setup logic. Also contains the `server.js` file, which handles server requests and interfaces between clients and the database.

frontent/  
Contains all client-facing pages and logic. Also contains various unit test files.

/  
The project directory contains the README and azure-pipeline file.

### Contributions  
Record parts of code you are responsible for.  

Andrew Bennett
- backend/dbInit.js (added)
- backend/local_db.sh (added)
- backend/server.js (functions: update-account, change-password, delete-account)
- frontend/Account.js (added)
- frontend/Account.test.js (unit tests for account system)
- frontend/Home.js (session management)
- frontend/SignUp.js (session improvements)
- frontend/NavigationBar.js (added)


### How to run locally:
1. `cd backend`
2. `sh local_db.sh` to create and start the database in docker.
3. `node dbInit.js` to load the tables.
4. `node server.js` to run the backend code.
5. In a new terminal, run `cd frontend`.
6. `npm start` to run the front end. If you get weird package errors, try deleting `node_modules` then run `npm install`.

To delete the database container, run `docker stop postgres && docker rm postgres`.


