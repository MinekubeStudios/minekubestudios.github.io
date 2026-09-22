NÁHLED V PROHLÍŽEČI
===================
Zkopíruj sem soubory z ../src/renderer/ a přidej mock-api.js:

  cp ../src/renderer/login.css .
  cp ../src/renderer/login.js .
  sed 's#<script src="login.js"></script>#<script src="mock-api.js"></script>\n<script src="login.js"></script>#' ../src/renderer/login.html > index.html
  python3 -m http.server 8080

Nebo spusť ./build-preview.sh
