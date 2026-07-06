#!/bin/bash
cd /home/prince-kangbode/Mes_projets/Ecole/Ecole/Ecole_backend
exec composer update --no-interaction --prefer-dist 2>&1 | tail -30
