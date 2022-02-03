import os
import time
import subprocess
from datetime import datetime

# ! EJECUTAR ESTE ARCHIVO DESDE RAIZ. El comando debe ser [ python3 src/vigilaBot.py ]

while True:
    print(datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
          'Inicio de bot WP desde Python')
    os.system('node src/botwp.js')
    time.sleep(6)
