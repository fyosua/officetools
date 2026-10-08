#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

git pull origin main

# Install dependencies
~/.bun/bin/bun install

# Build Svelte frontend
cd client && ~/.bun/bin/bun run build && cd ..

# Set proper permissions
chmod 600 .env
chmod 700 processing/

# Install systemd files
sudo cp officetools.service /etc/systemd/system/officetools.service
sudo systemctl daemon-reload
sudo systemctl restart officetools
sudo systemctl status officetools --no-pager

echo "✅ officetools.yosuaf.com deployed (v$(git describe --tags 2>/dev/null || echo 'dev'))"