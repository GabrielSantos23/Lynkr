#!/bin/bash

# Build the project
echo "Building the project..."
npm run build

# Deploy to Cloudflare with environment variables
echo "Deploying to Cloudflare Workers..."
npx wrangler deploy

# Set environment variables from .env.cloudflare
echo "Setting environment variables..."
while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip empty lines and comments
  if [[ -z "$line" ]] || [[ "$line" =~ ^# ]]; then
    continue
  fi
  
  # Extract key and value
  key=$(echo "$line" | cut -d= -f1)
  value=$(echo "$line" | cut -d= -f2-)
  
  # Skip if key is empty
  if [[ -z "$key" ]]; then
    continue
  fi
  
  echo "Setting $key..."
  npx wrangler secret put "$key" --name zyvon-server <<< "$value"
done < .env.cloudflare

echo "Deployment complete!" 