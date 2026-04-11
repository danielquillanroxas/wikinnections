#!/usr/bin/env bash
set -e

echo "==> Node version: $(node --version)"
echo "==> Python version: $(python --version)"

# Build frontend
cd frontend
npm install
npm run build
cd ..

echo "==> Frontend built, checking dist:"
ls -la frontend/dist/

# Install backend deps
cd backend
pip install -r requirements.txt
