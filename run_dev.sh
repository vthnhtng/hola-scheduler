#!/bin/bash

# Create MySQL Docker Container
./run_mysql_container.sh

# Migrate Database
npx prisma migrate dev

# Seed data
npx prisma db seed

# Run application server 
npm run dev