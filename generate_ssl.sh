#!/bin/bash

# Generates a Self-Signed SSL Certificate
# Usage: ./generate_ssl.sh

set -e

DOMAIN="localhost" # Or your IP address if needed

echo "🔒 Generating Self-Signed SSL Certificate for $DOMAIN..."

mkdir -p certs

# Generate Private Key and CSR
openssl req -newkey rsa:2048 -nodes -keyout certs/selfsigned.key -x509 -days 365 -out certs/selfsigned.crt -subj "/C=US/ST=State/L=City/O=PolyBot/CN=$DOMAIN"

echo "=========================================="
echo "✅ Certificate Generated!"
echo "Key: ./certs/selfsigned.key"
echo "Cert: ./certs/selfsigned.crt"
echo "=========================================="
echo "To use this with Next.js locally (dev), you might need a local proxy."
echo "For production, point your Nginx/Apache config to these files."
