#!/usr/bin/env bash
# Sestaví náhled z rendereru + falešného API
set -e
cd "$(dirname "$0")"
cp ../src/renderer/login.css .
cp ../src/renderer/login.js .
sed 's#<script src="login.js"></script>#<script src="mock-api.js"></script>\n<script src="login.js"></script>#' \
  ../src/renderer/login.html > index.html
echo "Hotovo. Spusť:  python3 -m http.server 8080"
