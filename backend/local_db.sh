#!/bin/bash

# This file starts a local PostgreSQL database using Docker.

# Install docker cli if not already (Ubuntu):
# sudo apt install docker.io

# Install an vsc extension to view the running db.

# Stop container and remove with:
# docker stop local-postgres && docker rm local-postgres

docker run --name local-postgres \
  -e POSTGRES_USER=testuser \
  -e POSTGRES_PASSWORD=testpassword \
  -e POSTGRES_DB=testdb \
  -p 5432:5432 \
  -d postgres:13
