# Deployment Guide

## 🚀 Vercel Deployment (Frontend)

### Prerequisites
- Node.js 18+
- Vercel account
- GitHub repository connected to Vercel

### Step 1: Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository: `Hetul803/RealityCo`

### Step 2: Configure Environment Variables
In Vercel dashboard, add these environment variables:

```
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com
```

### Step 3: Deploy Frontend
The frontend will automatically deploy to Vercel with these settings:
- **Framework**: Next.js
- **Build Command**: `cd frontend && npm run build`
- **Output Directory**: `frontend/.next`
- **Node Version**: 18.x

### Step 4: Deploy Backend Separately
For the backend, you have options:

#### Option A: Vercel Serverless Functions
1. Move backend API routes to `frontend/pages/api/`
2. Update environment variables
3. Redeploy

#### Option B: External Backend Service
Deploy backend to:
- **Railway** (recommended for Python APIs)
- **Render** (good free tier)
- **Google Cloud Run** (enterprise ready)
- **Heroku** (classic choice)

### Step 5: Update Frontend Environment
Set `NEXT_PUBLIC_API_BASE_URL` to your deployed backend URL.

## 🌐 Vercel Quick Deploy Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel --prod

# Link existing project
vercel link
```

## ☁️ Google Cloud Run Deployment (Full App)

### Prerequisites
- Google Cloud account with billing enabled
- gcloud CLI installed
- Docker installed

### Step 1: Setup Google Cloud
```bash
# Set your project ID
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### Step 2: Deploy with Script
```bash
# Set your Gemini API key
export GEMINI_API_KEY="your-gemini-api-key"

# Run the deployment script
./deploy-cloudrun.sh
```

### Step 3: Manual Deployment (Alternative)
```bash
# Build and push Docker image
gcloud builds submit --tag gcr.io/$PROJECT_ID/reality-copilot .

# Deploy to Cloud Run
gcloud run deploy reality-copilot \
  --image gcr.io/$PROJECT_ID/reality-copilot \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --set-env-vars GEMINI_API_KEY=$GEMINI_API_KEY
```

### Step 4: Get Service URL
```bash
gcloud run services describe reality-copilot --region us-central1 --format 'value(status.url)'
```

## 🔧 Configuration Files

### Vercel Configuration (`vercel.json`)
- Optimized for Next.js
- Automatic API proxying
- Build optimizations

### Docker Configuration (`Dockerfile`)
- Multi-stage build for production
- Frontend + Backend in one container
- Health checks included

## 🚀 Recommended Deployment Strategy

### For Hackathon/Demo:
**Use Cloud Run** - Full app in one place, easy to manage

### For Production:
**Separate deployments**:
- Frontend: Vercel (CDN, global distribution)
- Backend: Cloud Run or Railway (scalable, managed)

## 🔧 Troubleshooting

### Vercel Issues
- Ensure Node.js 18+ is selected
- Check `NEXT_PUBLIC_API_BASE_URL` environment variable
- Verify build logs in Vercel dashboard

### Cloud Run Issues
- Check container logs: `gcloud logs read`
- Verify environment variables in Cloud Run console
- Ensure GEMINI_API_KEY is set correctly

### General Issues
- Never commit `.env` files
- Use platform dashboards for secrets
- Test API endpoints separately first
