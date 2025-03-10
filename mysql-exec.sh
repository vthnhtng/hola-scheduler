#!/bin/bash

# Replace 'mysql-container' with the name or ID of your MySQL container
CONTAINER_NAME=mysql-container

# Execute the command to enter the MySQL container
docker exec -it mysql-hola mysql -u root -p