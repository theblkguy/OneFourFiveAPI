# Deploy to GCP Cloud Run

This guide covers deploying OneFourFive API to [Google Cloud Run](https://cloud.google.com/run), a fully managed serverless platform for containerized applications.

## Why Cloud Run?

- **Serverless:** Scales to zero when idle (cost-effective for low-traffic APIs)
- **Container-native:** Uses the existing Dockerfile—no code changes required
- **Automatic HTTPS:** Built-in TLS with managed certificates
- **Pay-per-use:** Billed only for actual request handling time
- **Fast cold starts:** Node.js apps typically start in < 1s

## Prerequisites

1. **Google Cloud account** with billing enabled
2. **gcloud CLI** installed and authenticated:
   ```bash
   # Install: https://cloud.google.com/sdk/docs/install
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
3. **Docker** (optional—Cloud Build can build for you)

## Deployment Options

### Option A: Deploy from Source (Recommended)

Cloud Run can build and deploy directly from source code—no local Docker required.

```bash
# From project root
gcloud run deploy onefourfive-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,JWT_SECRET=your-secure-secret-here"
```

This command:
1. Uploads source to Cloud Build
2. Builds the container using the Dockerfile
3. Pushes to Artifact Registry
4. Deploys to Cloud Run

### Option B: Build Locally, Push to Artifact Registry

```bash
# Configure Docker for Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build and tag
docker build -t us-central1-docker.pkg.dev/YOUR_PROJECT/onefourfive/api:latest .

# Push
docker push us-central1-docker.pkg.dev/YOUR_PROJECT/onefourfive/api:latest

# Deploy
gcloud run deploy onefourfive-api \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT/onefourfive/api:latest \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,JWT_SECRET=your-secure-secret-here"
```

### Option C: Use the Deployment Script

A convenience script is provided at `scripts/deploy-gcp.sh`:

```bash
# Make executable (once)
chmod +x scripts/deploy-gcp.sh

# Deploy (uses defaults)
./scripts/deploy-gcp.sh

# Or with custom project/region
GCP_PROJECT=my-project GCP_REGION=europe-west1 ./scripts/deploy-gcp.sh
```

## Environment Variables

Configure these via `--set-env-vars` or the Cloud Console:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8080` | Cloud Run sets this automatically |
| `JWT_SECRET` | **Yes** | — | Secret for JWT signing (use Secret Manager in production) |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiration (e.g., `7d`, `24h`) |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per 15-minute window |
| `PROGRESSION_RATE_LIMIT_MAX` | No | `100` | Progression endpoint rate limit |

### Using Secret Manager (Recommended for Production)

Don't pass secrets as plain environment variables. Use [Secret Manager](https://cloud.google.com/secret-manager):

```bash
# Create secret
echo -n "your-actual-secret" | gcloud secrets create jwt-secret --data-file=-

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Deploy with secret reference
gcloud run deploy onefourfive-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets "JWT_SECRET=jwt-secret:latest"
```

## Cloud Run Configuration

### Recommended Settings

```bash
gcloud run deploy onefourfive-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80 \
  --timeout 30s \
  --set-env-vars "NODE_ENV=production"
```

| Setting | Value | Rationale |
|---------|-------|-----------|
| `--memory` | `256Mi` | Sufficient for this API; increase if needed |
| `--cpu` | `1` | Single CPU handles typical load |
| `--min-instances` | `0` | Scale to zero when idle (cost savings) |
| `--max-instances` | `10` | Prevent runaway scaling/costs |
| `--concurrency` | `80` | Requests per instance (Node.js handles many concurrent requests well) |
| `--timeout` | `30s` | Max request duration |

### Always-On (Avoid Cold Starts)

For production with consistent traffic, keep at least one instance warm:

```bash
--min-instances 1
```

This incurs cost even when idle but eliminates cold start latency.

## CI/CD with Cloud Build

Create `cloudbuild.yaml` in project root for automated deployments:

```yaml
steps:
  # Build the container
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'us-central1-docker.pkg.dev/$PROJECT_ID/onefourfive/api:$COMMIT_SHA', '.']

  # Push to Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'us-central1-docker.pkg.dev/$PROJECT_ID/onefourfive/api:$COMMIT_SHA']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'onefourfive-api'
      - '--image=us-central1-docker.pkg.dev/$PROJECT_ID/onefourfive/api:$COMMIT_SHA'
      - '--region=us-central1'
      - '--allow-unauthenticated'

images:
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/onefourfive/api:$COMMIT_SHA'

options:
  logging: CLOUD_LOGGING_ONLY
```

Set up a trigger in Cloud Build to run on pushes to `main`.

## Health Checks

Cloud Run uses the container's health check. The Dockerfile already includes:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:3000/health || exit 1
```

Cloud Run also performs its own startup and liveness probes. The `/health` endpoint returns:

```json
{ "status": "ok", "service": "chord-progression-api" }
```

## Custom Domain

1. Verify domain ownership in Cloud Console
2. Map the domain:
   ```bash
   gcloud run domain-mappings create \
     --service onefourfive-api \
     --domain api.yourdomain.com \
     --region us-central1
   ```
3. Add the provided DNS records to your domain registrar

## Monitoring & Logging

- **Logs:** Cloud Console → Cloud Run → onefourfive-api → Logs (or `gcloud run logs read onefourfive-api`)
- **Metrics:** Request count, latency, errors, instance count in Cloud Console
- **Alerts:** Set up in Cloud Monitoring for error rate spikes or latency thresholds

## Cost Estimation

Cloud Run pricing (as of 2024):
- **Free tier:** 2 million requests/month, 360,000 vCPU-seconds, 180,000 GiB-seconds
- **Beyond free tier:** ~$0.00002400 per vCPU-second, ~$0.00000250 per GiB-second

For a low-traffic API with `min-instances=0`, expect **< $5/month** or free tier.

## Troubleshooting

### Container fails to start

Check logs:
```bash
gcloud run logs read onefourfive-api --region us-central1 --limit 50
```

Common causes:
- Missing `JWT_SECRET` environment variable
- Port mismatch (ensure app listens on `PORT` env var, Cloud Run sets this to `8080`)

### Cold start latency

If first requests are slow (2-5s):
- Set `--min-instances 1` to keep one instance warm
- Reduce container size (already optimized with multi-stage build)
- Lazy-load heavy dependencies

### Rate limiting not working as expected

Cloud Run may route requests through multiple instances. For global rate limiting, consider:
- Redis/Memorystore for shared state
- Cloud Armor for edge rate limiting

## Quick Reference

```bash
# Deploy from source
gcloud run deploy onefourfive-api --source . --region us-central1 --allow-unauthenticated

# View service URL
gcloud run services describe onefourfive-api --region us-central1 --format 'value(status.url)'

# View logs
gcloud run logs read onefourfive-api --region us-central1

# Update env vars
gcloud run services update onefourfive-api --region us-central1 --set-env-vars "KEY=value"

# Delete service
gcloud run services delete onefourfive-api --region us-central1
```

## See Also

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Cloud Build](https://cloud.google.com/build/docs)
