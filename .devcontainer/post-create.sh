#!/bin/bash

# Database initialize
sudo service postgresql start
psql -U postgres -h 127.0.0.1 -c "CREATE ROLE puser LOGIN password 'localdbpassword';" -c "CREATE DATABASE testdb1 ENCODING 'UTF8' OWNER puser TEMPLATE template0;"

# Dependencies intialize
npx -y cypress install
npm install -g pino-pretty

# NPM initialize
npm install