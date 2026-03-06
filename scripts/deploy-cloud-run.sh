#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=${PROJECT_ID:?Set PROJECT_ID}
REGION=${REGION:-us-central1}
SERVICE=${SERVICE:-reality-copilot-api}
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE}:latest"

pushd backend >/dev/null

gcloud builds submit --tag "$IMAGE"
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="$GEMINI_API_KEY",GEMINI_MODEL="${GEMINI_MODEL:-gemini-2.5-flash}"

popd >/dev/null

echo "Deployed $SERVICE to Cloud Run"
