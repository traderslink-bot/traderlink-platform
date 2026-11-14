"""Render one public URL from the saved ranking archive on standard input."""

import json
from pathlib import Path
import runpy
import sys

renderer = runpy.run_path(str(Path(__file__).with_name("render-daily-gainers-preview.py")))
archive = json.load(sys.stdin)
page = renderer["site_page"](archive["sessions"], archive["aliases"], sys.argv[1], indexable=True)
if page is not None:
    sys.stdout.write(page)
