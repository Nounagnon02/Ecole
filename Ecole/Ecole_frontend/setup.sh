#!/bin/bash
cd /home/prince-kangbode/Mes_projets/Ecole/Ecole/Ecole_frontend
echo "Installing npm dependencies..."
npm install 2>&1 | tail -5
echo "npm install exit code: $?"
npm install cmdk 2>&1 | tail -5
echo "cmdk install exit code: $?"
echo "=== Frontend setup complete ==="
