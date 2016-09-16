#!/usr/bin/env bash
sh setup.sh
cd wirewerks/server/app-server
node index.js --env production
