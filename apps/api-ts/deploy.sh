#!/bin/bash

# Build the TypeScript project
echo "Building TypeScript project..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "Build failed. Exiting."
    exit 1
fi

# Deploy to Cloudflare Workers (if using Wrangler)
echo "Deploying to Cloudflare Workers..."
npx wrangler deploy

echo "Deployment complete!"
