#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# deploy-gcp.sh — Deploy OneFourFive API to GCP Cloud Run
#
# Usage:
#   ./scripts/deploy-gcp.sh                          # uses defaults
#   GCP_PROJECT=my-proj ./scripts/deploy-gcp.sh     # custom project
#   GCP_REGION=europe-west1 ./scripts/deploy-gcp.sh # custom region
#
# Environment variables:
#   GCP_PROJECT   — GCP project ID (default: current gcloud config)
#   GCP_REGION    — Cloud Run region (default: us-central1)
#   SERVICE_NAME  — Cloud Run service name (default: onefourfive-api)
#   MIN_INSTANCES — Minimum instances, 0 for scale-to-zero (default: 0)
#   MAX_INSTANCES — Maximum instances (default: 10)
#   MEMORY        — Memory allocation (default: 256Mi)
#   ALLOW_UNAUTH  — Allow unauthenticated access: true/false (default: true)
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - Billing enabled on the GCP project
#   - Cloud Run API enabled (script will prompt if not)
# -----------------------------------------------------------------------------

set -euo pipefail

# Colorized output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# -----------------------------------------------------------------------------
# Configuration (override via environment variables)
# -----------------------------------------------------------------------------
GCP_PROJECT="${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null || echo '')}"
GCP_REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-onefourfive-api}"
MIN_INSTANCES="${MIN_INSTANCES:-0}"
MAX_INSTANCES="${MAX_INSTANCES:-10}"
MEMORY="${MEMORY:-256Mi}"
ALLOW_UNAUTH="${ALLOW_UNAUTH:-true}"

# -----------------------------------------------------------------------------
# Preflight checks
# -----------------------------------------------------------------------------
if ! command -v gcloud &> /dev/null; then
    log_error "gcloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if [[ -z "$GCP_PROJECT" ]]; then
    log_error "No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

log_info "Deploying to GCP Cloud Run"
log_info "  Project:       $GCP_PROJECT"
log_info "  Region:        $GCP_REGION"
log_info "  Service:       $SERVICE_NAME"
log_info "  Min instances: $MIN_INSTANCES"
log_info "  Max instances: $MAX_INSTANCES"
log_info "  Memory:        $MEMORY"
echo ""

# -----------------------------------------------------------------------------
# Enable required APIs (idempotent)
# -----------------------------------------------------------------------------
log_info "Ensuring Cloud Run API is enabled..."
gcloud services enable run.googleapis.com --project="$GCP_PROJECT" --quiet

log_info "Ensuring Artifact Registry API is enabled..."
gcloud services enable artifactregistry.googleapis.com --project="$GCP_PROJECT" --quiet

log_info "Ensuring Cloud Build API is enabled..."
gcloud services enable cloudbuild.googleapis.com --project="$GCP_PROJECT" --quiet

# -----------------------------------------------------------------------------
# Build and deploy from source
# -----------------------------------------------------------------------------
AUTH_FLAG=""
if [[ "$ALLOW_UNAUTH" == "true" ]]; then
    AUTH_FLAG="--allow-unauthenticated"
else
    AUTH_FLAG="--no-allow-unauthenticated"
fi

log_info "Deploying from source (Cloud Build will build the container)..."

gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --project="$GCP_PROJECT" \
    --region="$GCP_REGION" \
    --memory="$MEMORY" \
    --min-instances="$MIN_INSTANCES" \
    --max-instances="$MAX_INSTANCES" \
    --concurrency=80 \
    --timeout=30s \
    --set-env-vars="NODE_ENV=production" \
    $AUTH_FLAG

# -----------------------------------------------------------------------------
# Output service URL
# -----------------------------------------------------------------------------
echo ""
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --project="$GCP_PROJECT" \
    --region="$GCP_REGION" \
    --format='value(status.url)')

log_info "Deployment complete!"
log_info "Service URL: $SERVICE_URL"
log_info "Health check: ${SERVICE_URL}/health"
log_info "API docs: ${SERVICE_URL}/api-docs"
echo ""
log_warn "Remember to set JWT_SECRET for production:"
log_warn "  gcloud run services update $SERVICE_NAME --region=$GCP_REGION --set-env-vars='JWT_SECRET=your-secret'"
log_warn "  Or use Secret Manager (recommended):"
log_warn "  gcloud run services update $SERVICE_NAME --region=$GCP_REGION --set-secrets='JWT_SECRET=jwt-secret:latest'"
