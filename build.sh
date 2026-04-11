#!/usr/bin/env bash
set -e

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Install backend deps
cd backend
pip install -r requirements.txt
