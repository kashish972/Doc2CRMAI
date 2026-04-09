#!/bin/bash

echo "Doc2CRM AI - Setup Script"
echo "========================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please edit .env and add your MongoDB URI and OpenRouter API key"
    exit 1
fi

# Check for required environment variables
source .env

if [ -z "$MONGODB_URI" ] || [ "$MONGODB_URI" = "mongodb://localhost:27017/doc2crm-ai" ]; then
    echo "Warning: MONGODB_URI not set or using default"
fi

if [ -z "$OPENROUTER_API_KEY" ] || [ "$OPENROUTER_API_KEY" = "your-openrouter-api-key-here" ]; then
    echo "Error: OPENROUTER_API_KEY is not set"
    echo "Please get a free API key from https://openrouter.ai/"
    exit 1
fi

echo "Installing dependencies..."
npm install

echo ""
echo "Setup complete!"
echo "Run 'npm run dev' to start the development server"
