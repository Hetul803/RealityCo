#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=${PROJECT_ID:?Set PROJECT_ID}
REGION=${REGION:-us-central1}
API_SERVICE=${API_SERVICE:-reality-copilot-api}
WEB_SERVICE=${WEB_SERVICE:-reality-copilot-web}
DEPLOY_FRONTEND=${DEPLOY_FRONTEND:-true}

API_IMAGE="gcr.io/${PROJECT_ID}/${API_SERVICE}:latest"
WEB_IMAGE="gcr.io/${PROJECT_ID}/${WEB_SERVICE}:latest"

# 1) Deploy backend API
pushd backend >/dev/null
gcloud builds submit --tag "$API_IMAGE"
gcloud run deploy "$API_SERVICE" \
  --image "$API_IMAGE" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="${GEMINI_API_KEY:?Set GEMINI_API_KEY}",GEMINI_MODEL="${GEMINI_MODEL:-gemini-2.5-flash}",CORS_ORIGINS="${CORS_ORIGINS:-*}"
popd >/dev/null

API_URL=$(gcloud run services describe "$API_SERVICE" --region "$REGION" --format='value(status.url)')
echo "Backend deployed: $API_URL"

if [[ "$DEPLOY_FRONTEND" == "true" ]]; then
  # 2) Deploy frontend web app pointing at backend URL
  pushd frontend >/dev/null
  gcloud builds submit --tag "$WEB_IMAGE"
  gcloud run deploy "$WEB_SERVICE" \
    --image "$WEB_IMAGE" \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --set-env-vars NEXT_PUBLIC_API_BASE_URL="$API_URL"
  popd >/dev/null

  WEB_URL=$(gcloud run services describe "$WEB_SERVICE" --region "$REGION" --format='value(status.url)')
  echo "Frontend deployed: $WEB_URL"
fi
