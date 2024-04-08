#!/bin/bash

sudo service postgresql start
psql -U postgres -c "CREATE ROLE puser LOGIN password 'localdbpassword';CREATE DATABASE testdb1 ENCODING 'UTF8' OWNER puser TEMPLATE template0;"
npx cypress install