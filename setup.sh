#!/usr/bin/env bash
echo *** Setup client ***

cd wirewerks/client/ui/src
npm install

cd ..
npm install

cd ../../..

echo *** Setup server ***
cd wirewerks/server/ww-libsass
npm install
cd node_sass
npm install
cd ../../../..

cd wirewerks/server/app-server
npm install
