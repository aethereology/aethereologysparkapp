#!/bin/bash

# GCP Project Setup Script for Spark Donation App
# Run this script to set up your GCP project with proper permissions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Setting up GCP project for Spark donation app${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Please install Google Cloud SDK first.${NC}"
    exit 1
fi

# Set project ID
PROJECT_ID="sparkcreativesincapp"

echo -e "${YELLOW}📋 Using Project ID: $PROJECT_ID${NC}"

# Set the project
echo -e "${YELLOW}🔧 Setting gcloud project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔌 Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Create service account
echo -e "${YELLOW}👤 Creating GitHub Actions service account...${NC}"
SA_EMAIL="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"

# Check if service account already exists
if gcloud iam service-accounts describe $SA_EMAIL &>/dev/null; then
    echo -e "${YELLOW}⚠️  Service account already exists, skipping creation...${NC}"
else
    gcloud iam service-accounts create github-actions \
        --display-name="GitHub Actions Service Account" \
        --description="Service account for GitHub Actions deployment"
fi

# Add IAM roles
echo -e "${YELLOW}🔐 Adding IAM permissions...${NC}"

# Cloud Run permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/run.admin"

# Container Registry/Artifact Registry permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/storage.admin"

# Service Account User (for Cloud Run)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/iam.serviceAccountUser"

# Cloud Build permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/cloudbuild.builds.builder"

# Artifact Registry permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/artifactregistry.admin"

# Generate service account key
echo -e "${YELLOW}🔑 Generating service account key...${NC}"
KEY_FILE="github-actions-key-${PROJECT_ID}.json"

if [ -f "$KEY_FILE" ]; then
    echo -e "${YELLOW}⚠️  Key file already exists. Backing up...${NC}"
    mv "$KEY_FILE" "${KEY_FILE}.backup.$(date +%s)"
fi

gcloud iam service-accounts keys create $KEY_FILE \
    --iam-account=$SA_EMAIL

# Display the key in base64 format for GitHub secrets
echo -e "${GREEN}✅ Service account setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 GitHub Secrets to set:${NC}"
echo "GCP_PROJECT_ID: $PROJECT_ID"
echo "GCP_SA_KEY: $(base64 -w 0 $KEY_FILE)"
echo ""
echo -e "${YELLOW}📝 Save these values in your GitHub repository secrets!${NC}"
echo ""
echo -e "${RED}🔒 IMPORTANT: Keep the key file secure and delete it after setting up GitHub secrets${NC}"
echo "Key file location: $(pwd)/$KEY_FILE"

# Create artifact registry repository
echo -e "${YELLOW}📦 Creating Artifact Registry repository...${NC}"
gcloud artifacts repositories create sparkapp-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker repository for Spark donation app" || echo -e "${YELLOW}Repository may already exist${NC}"

echo -e "${GREEN}🎉 GCP setup complete! Next steps:${NC}"
echo "1. Set GitHub secrets using the values above"
echo "2. Configure email service (SendGrid or Postmark)"
echo "3. Set up Netlify for frontend deployment"
echo "4. Push to main branch to trigger deployment"