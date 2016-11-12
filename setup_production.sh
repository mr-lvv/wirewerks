#!/usr/bin/env bash
sh setup.sh

cd wirewerks/client/ui

# Copying common since links don't work on heroku build (EPERM error)
echo *** Copying Common ***
cp -R ../../common ./src/common

echo *** Creating Distribution Builld ***
echo node index.js
