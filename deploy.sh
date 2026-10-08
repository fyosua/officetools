#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

git pull origin main
source venv/bin/activate
pip install -r requirements.txt

chmod 600 .env
chmod 700 processing/

sudo systemctl daemon-reload
sudo systemctl restart officetools
sudo systemctl status officetools --no-pager

echo "✅ officetools.yosuaf.com deployed (v$(git describe --tags 2>/dev/null || echo 'dev'))"
