# AdvancedSoftwareDevelopment

### How to run locally:
1. `cd backend`
2. `sh local_db.sh` to create and start the database in docker.
3. `node dbInit.js` to load the tables.
4. `node server.js` to run the backend code.
5. In a new terminal, run `cd frontend`.
6. `npm start` to run the front end. If you get weird package errors, try deleting `node_modules` then run `npm install`.

To delete the database container, run `docker stop postgres && docker rm postgres`.

