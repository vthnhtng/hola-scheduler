#!/bin/bash
echo "run npm install"
npm install
# Create MySQL Docker Container

echo "run mysql container"
./run_mysql_container.sh

echo "run migrations"
# Migrate Database
npx prisma migrate dev


sleep 5
echo "run seed"
# Seed data
npx prisma db seed

# Run application server 
npm run dev