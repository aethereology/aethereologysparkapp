# Vercel Frontend Deployment Setup

Complete guide to configure Vercel for automatic Next.js frontend deployment.

## Step 1: Create Vercel Account

1. Go to [Vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended for seamless integration)
3. Verify your email address

## Step 2: Install Vercel CLI

```bash
# Install globally
npm install -g vercel

# Or use npx (no global install needed)
npx vercel --version
```

## Step 3: Project Setup & Authentication

### Automated Setup
```bash
# Navigate to your web directory
cd web

# Login to Vercel
vercel login

# Initialize your project (run from web/ directory)
vercel

# Follow the prompts:
# ? Set up and deploy "web"? [Y/n] Y
# ? Which scope? Your personal account
# ? Link to existing project? [y/N] N
# ? What's your project's name? spark-donation-app
# ? In which directory is your code located? ./
```

### Get Project Information
```bash
# After setup, get your project details
vercel env ls

# Get project ID and org ID from .vercel/project.json
cat .vercel/project.json
```

## Step 4: Environment Variables

Set up environment variables for production:

```bash
# Set environment variables
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://your-cloud-run-api-url

vercel env add NODE_VERSION production  
# Enter: 18
```

## Step 5: Get Vercel Tokens

### Personal Access Token
1. **Go to Vercel Dashboard**
2. **Settings > Tokens**
3. **Create new token:**
   - **Name:** "GitHub Actions Deployment"
   - **Scope:** Full Account
4. **Copy the token** (starts with vercel_...)

### Project Details
```bash
# Get project and org IDs
cd web
cat .vercel/project.json

# Output example:
# {
#   "projectId": "prj_abc123def456ghi789",
#   "orgId": "team_xyz789abc123def456"
# }
```

## Step 6: GitHub Repository Secrets

Add these secrets to your GitHub repository:

```
# Vercel Configuration
VERCEL_TOKEN=vercel_your_personal_access_token_here
VERCEL_PROJECT_ID=prj_abc123def456ghi789
VERCEL_ORG_ID=team_xyz789abc123def456

# Will be set after first API deployment  
API_URL=https://your-cloud-run-service-url
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## Step 7: Vercel Configuration File

The `vercel.json` file has been created for build optimization.

## Step 8: Test Local Deployment

```bash
# Test local build
cd web
npm run build

# Test local Vercel deployment
vercel --local

# Deploy to preview (optional)
vercel

# Deploy to production
vercel --prod
```

## Step 9: Automatic Deployment via GitHub Actions

The GitHub Actions workflow has been updated to deploy to Vercel automatically. Here's what happens:

1. **Tests run** (API, frontend, E2E, security)
2. **API deploys** to Cloud Run
3. **Frontend deploys** to Vercel with API URL
4. **Smoke tests** run against production

## Required Environment Variables

### In Vercel Dashboard
1. **Go to your project settings**
2. **Environment Variables section**
3. **Add these variables:**
   ```
   NEXT_PUBLIC_API_URL = https://your-cloud-run-api-url
   NODE_VERSION = 18
   ```

### In GitHub Secrets
```
# Vercel Configuration
VERCEL_TOKEN=vercel_your_token_here
VERCEL_PROJECT_ID=prj_abc123def456
VERCEL_ORG_ID=team_xyz789abc123

# Application URLs (set after deployment)
API_URL=https://your-cloud-run-service-url
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## Deployment Process

### First Deployment
1. **Set up Vercel project** (steps above)
2. **Set GitHub secrets**
3. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Configure Vercel deployment"
   git push origin main
   ```
4. **Monitor GitHub Actions** for deployment progress
5. **Update API_URL and FRONTEND_URL** secrets after deployment

### Subsequent Deployments
Every push to main automatically:
- Runs full test suite
- Deploys API to Cloud Run
- Deploys frontend to Vercel
- Runs production smoke tests

## Vercel Features & Benefits

### Performance
- **Edge Network:** 150+ locations worldwide
- **Automatic Optimization:** Images, fonts, and static assets
- **Smart CDN:** Intelligent caching and invalidation

### Next.js Integration
- **Built-in Optimization:** Automatic code splitting
- **API Routes:** Serverless functions
- **Image Optimization:** Built-in next/image support

### Developer Experience
- **Preview Deployments:** Every branch gets a preview URL
- **Real-time Logs:** Monitor deployments and runtime
- **Analytics:** Performance and usage metrics

## Troubleshooting

### Common Issues

**"Project not found" error:**
- Verify VERCEL_PROJECT_ID is correct
- Check VERCEL_ORG_ID matches your account

**Build failures:**
- Check Node.js version (should be 18)
- Verify all dependencies install correctly
- Review build logs in Vercel dashboard

**Environment variable issues:**
- Ensure NEXT_PUBLIC_API_URL is set
- Check variable names match exactly
- Verify production environment is selected

**API connection errors:**
- Verify API_URL is correct and accessible
- Check CORS headers are properly configured
- Test API endpoints independently

### Debugging Steps
1. **Check Vercel deployment logs**
2. **Verify environment variables**
3. **Test API endpoints directly**
4. **Review GitHub Actions logs**
5. **Check browser console for errors**

## Production Monitoring

### Vercel Analytics
- **Performance metrics** (Core Web Vitals)
- **Usage analytics** (page views, unique visitors)
- **Function metrics** (API routes performance)

### Error Tracking
- **Runtime errors** in Vercel dashboard
- **Build errors** in deployment logs
- **API errors** in Cloud Run logs

## Scaling Considerations

### Vercel Limits
- **Free:** 100GB bandwidth, 100 serverless function invocations/day
- **Pro:** $20/month, 1TB bandwidth, 10M function invocations
- **Team:** $8/user/month, unlimited bandwidth

### Performance Optimization
- **Static Generation:** Use `getStaticProps` where possible
- **Incremental Regeneration:** Update static content on demand
- **Edge Functions:** Deploy logic closer to users
- **Image Optimization:** Automatic WebP conversion and sizing

## Security Features

### Built-in Security
- **HTTPS by default** on all deployments
- **Security headers** automatically configured
- **DDoS protection** via edge network
- **Bot protection** and rate limiting

### Environment Security
- **Encrypted secrets** in Vercel dashboard
- **Preview deployment protection** (optional)
- **Team access controls** for sensitive projects

Your Spark donation app is now configured for automatic deployment to Vercel! 🚀