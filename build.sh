#!/usr/bin/env bash
set -e

# Install Node.js if not present (Render Python runtime doesn't include it)
if ! command -v node &> /dev/null; then
  echo "Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Install backend deps
cd backend
pip install -r requirements.txt
