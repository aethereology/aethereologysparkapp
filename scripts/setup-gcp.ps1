# GCP Project Setup Script for Spark Donation App (PowerShell)
# Run this script to set up your GCP project with proper permissions

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId
)

Write-Host "Setting up GCP project for Spark donation app" -ForegroundColor Green
Write-Host "Using Project ID: $ProjectId" -ForegroundColor Yellow

# Check if gcloud is installed
try {
    $gcloudVersion = gcloud --version
    Write-Host "gcloud CLI found" -ForegroundColor Green
} catch {
    Write-Host "gcloud CLI not found. Please install Google Cloud SDK first." -ForegroundColor Red
    exit 1
}

# Set the project
Write-Host "Setting gcloud project..." -ForegroundColor Yellow
gcloud config set project $ProjectId

# Enable required APIs
Write-Host "Enabling required APIs..." -ForegroundColor Yellow
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Create service account
Write-Host "Creating GitHub Actions service account..." -ForegroundColor Yellow
$SA_EMAIL = "github-actions@$ProjectId.iam.gserviceaccount.com"

# Check if service account already exists
try {
    gcloud iam service-accounts describe $SA_EMAIL 2>$null
    Write-Host "Service account already exists, skipping creation..." -ForegroundColor Yellow
} catch {
    gcloud iam service-accounts create github-actions --display-name="GitHub Actions Service Account" --description="Service account for GitHub Actions deployment"
}

# Add IAM roles
Write-Host "Adding IAM permissions..." -ForegroundColor Yellow

# Cloud Run permissions
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$SA_EMAIL" --role="roles/run.admin"

# Container Registry/Artifact Registry permissions
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$SA_EMAIL" --role="roles/storage.admin"

# Service Account User (for Cloud Run)
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$SA_EMAIL" --role="roles/iam.serviceAccountUser"

# Cloud Build permissions
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$SA_EMAIL" --role="roles/cloudbuild.builds.builder"

# Artifact Registry permissions
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$SA_EMAIL" --role="roles/artifactregistry.admin"

# Generate service account key
Write-Host "Generating service account key..." -ForegroundColor Yellow
$KEY_FILE = "github-actions-key-$ProjectId.json"

if (Test-Path $KEY_FILE) {
    Write-Host "Key file already exists. Backing up..." -ForegroundColor Yellow
    $timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
    Move-Item $KEY_FILE "$KEY_FILE.backup.$timestamp"
}

gcloud iam service-accounts keys create $KEY_FILE --iam-account=$SA_EMAIL

# Display the key in base64 format for GitHub secrets
$keyContent = Get-Content $KEY_FILE -Raw
$keyBase64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($keyContent))

Write-Host "Service account setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "GitHub Secrets to set:" -ForegroundColor Yellow
Write-Host "GCP_PROJECT_ID: $ProjectId"
Write-Host "GCP_SA_KEY: $keyBase64"
Write-Host ""
Write-Host "Save these values in your GitHub repository secrets!" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: Keep the key file secure and delete it after setting up GitHub secrets" -ForegroundColor Red
Write-Host "Key file location: $(Get-Location)\$KEY_FILE"

# Create artifact registry repository
Write-Host "Creating Artifact Registry repository..." -ForegroundColor Yellow
try {
    gcloud artifacts repositories create sparkapp-repo --repository-format=docker --location=us-central1 --description="Docker repository for Spark donation app"
} catch {
    Write-Host "Repository may already exist" -ForegroundColor Yellow
}

Write-Host "GCP setup complete! Next steps:" -ForegroundColor Green
Write-Host "1. Set GitHub secrets using the values above"
Write-Host "2. Configure email service (SendGrid or Postmark)"
Write-Host "3. Set up Vercel for frontend deployment"
Write-Host "4. Push to main branch to trigger deployment"