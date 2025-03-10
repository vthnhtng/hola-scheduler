#!/bin/bash

# Stop and remove existing containers if they are running
docker-compose down

# Start fresh containers
docker-compose up -d
