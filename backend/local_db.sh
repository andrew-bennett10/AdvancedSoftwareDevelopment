#!/bin/bash

# This file starts a local PostgreSQL database using Docker.

# Install docker cli if not already (Ubuntu):
# sudo apt install docker.io

# Install an vsc extension to view the running db.

# Stop container and remove with:
# docker stop local-postgres && docker rm local-postgres

docker run --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  -d postgres:13
