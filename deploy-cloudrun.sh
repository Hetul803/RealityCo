#!/bin/bash

# Cloud Run Deployment Script for Reality Copilot

echo "🚀 Deploying Reality Copilot to Cloud Run..."

# Variables
PROJECT_ID="your-gcp-project-id"
REGION="us-central1"
SERVICE_NAME="reality-copilot"
IMAGE_NAME="reality-copilot"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Set the project
echo "📋 Setting project: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Build and push the image
echo "🏗️ Building Docker image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$IMAGE_NAME .

# Deploy to Cloud Run
echo "🌐 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$IMAGE_NAME \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --concurrency 10 \
  --max-instances 10 \
  --set-env-vars PORT=8080 \
  --set-env-vars GEMINI_API_KEY=$GEMINI_API_KEY

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo "✅ Deployment complete!"
echo "🌐 Your app is live at: $SERVICE_URL"
echo "📝 Don't forget to set your GEMINI_API_KEY in the Cloud Run service configuration!"
