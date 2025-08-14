# Production Deployment Guide

Complete guide to deploy the Spark donation management application to production.

## Prerequisites

- Google Cloud SDK installed and authenticated
- GitHub repository with admin access
- SendGrid or Postmark account for emails
- Netlify account for frontend hosting

## Step 1: GCP Service Account Setup

### Automated Setup (Recommended)
```bash
cd scripts
chmod +x setup-gcp.sh
./setup-gcp.sh
```

### Manual Setup
If you prefer manual setup:

```bash
# Set your project
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  artifactregistry.googleapis.com

# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

# Add permissions
SA_EMAIL="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/run.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/iam.serviceAccountUser"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudbuild.builds.builder"

# Generate key
gcloud iam service-accounts keys create github-sa-key.json \
  --iam-account=$SA_EMAIL
```

## Step 2: Email Service Configuration

### Option A: SendGrid
1. Sign up at [SendGrid](https://sendgrid.com)
2. Create an API key with Mail Send permissions
3. Verify your sender identity
4. Set GitHub secrets:
   - `EMAIL_PROVIDER`: "sendgrid"
   - `SENDGRID_API_KEY`: Your API key

### Option B: Postmark
1. Sign up at [Postmark](https://postmarkapp.com)
2. Create a server and get the API token
3. Add your sender signature
4. Set GitHub secrets:
   - `EMAIL_PROVIDER`: "postmark"
   - `POSTMARK_API_TOKEN`: Your API token

## Step 3: Netlify Frontend Setup

### Automatic Deployment (Recommended)
The GitHub Actions workflow will deploy to Netlify automatically. You need:

1. **Create Netlify account** at [netlify.com](https://netlify.com)
2. **Get your tokens:**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login and get auth token
   netlify login
   netlify sites:list
   ```
3. **Create a new site:**
   ```bash
   netlify sites:create --name your-spark-app
   ```

### Manual Netlify Setup
If you prefer manual setup:
1. Go to Netlify dashboard
2. Create new site from Git (but don't connect it yet)
3. Note the Site ID from site settings

## Step 4: GitHub Repository Secrets

Set these secrets in your GitHub repository (Settings > Secrets and variables > Actions):

### Required Secrets
```
# GCP Configuration
GCP_PROJECT_ID=your-gcp-project-id
GCP_SA_KEY=base64-encoded-service-account-key

# Application Config
SPARK_ORG_NAME=Your Organization Name
SPARK_EIN=12-3456789
SPARK_ADDR=Your Organization Address

# Email Service (choose one)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
# OR
EMAIL_PROVIDER=postmark
POSTMARK_API_TOKEN=your-postmark-token

# Netlify (for frontend)
NETLIFY_AUTH_TOKEN=your-netlify-auth-token
NETLIFY_SITE_ID=your-netlify-site-id

# Deployment URLs (set after first deployment)
API_URL=https://your-api-service-url
FRONTEND_URL=https://your-netlify-site-url

# Optional
SLACK_WEBHOOK_URL=your-slack-webhook-url
```

## Step 5: Deployment Process

### First Deployment
1. **Push to main branch:**
   ```bash
   git push origin main
   ```

2. **Monitor deployment:**
   - Go to GitHub Actions tab
   - Watch the "Deploy to Production" workflow
   - Check each job: test → deploy-api → deploy-frontend → smoke-tests

3. **Update URLs after first deployment:**
   - Get API URL from Cloud Run console
   - Get Frontend URL from Netlify dashboard
   - Update `API_URL` and `FRONTEND_URL` secrets

### Subsequent Deployments
Every push to main will automatically:
- Run full test suite
- Deploy API to Cloud Run
- Deploy frontend to Netlify
- Run smoke tests
- Send notifications

## Step 6: Verification

### Health Checks
- **API Health:** `https://your-api-url/health`
- **Frontend:** `https://your-frontend-url`

### Test the Flow
1. Navigate to reviewer dashboard
2. Test donation receipt upload
3. Verify email notifications
4. Check reconciliation features

## Troubleshooting

### Common Issues

**GCP Permission Errors:**
```bash
# Check service account permissions
gcloud projects get-iam-policy $PROJECT_ID \
  --filter="bindings.members:serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com"
```

**Email Not Sending:**
- Verify API keys are correct
- Check sender verification status
- Review API service logs in Cloud Run

**Frontend Build Failures:**
- Check Node.js version compatibility
- Verify environment variables
- Review build logs in GitHub Actions

**Deployment Failures:**
- Check Cloud Run service logs
- Verify Docker image builds successfully
- Review IAM permissions

### Monitoring

**Cloud Run Metrics:**
- Go to Cloud Run console
- View request metrics, error rates, latency

**Netlify Analytics:**
- Check Netlify dashboard
- Review build and deployment logs

**GitHub Actions:**
- Monitor workflow runs
- Check test coverage reports
- Review security scan results

## Security Considerations

1. **Rotate service account keys regularly**
2. **Use least-privilege IAM roles**
3. **Enable Cloud Run authentication if needed**
4. **Monitor for security vulnerabilities**
5. **Keep dependencies updated**

## Cost Management

**Cloud Run:**
- Pay per request
- Configure max instances to control costs
- Use Cloud Run's built-in scaling

**Netlify:**
- Free tier: 100GB bandwidth, 300 build minutes
- Pro plan for production usage

**Email Services:**
- SendGrid: Free 100 emails/day
- Postmark: Free 100 emails/month

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Review Cloud Run service logs
3. Verify all secrets are set correctly
4. Test locally with `docker-compose up`