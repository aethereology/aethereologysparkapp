# Production Deployment Checklist

Complete step-by-step checklist for deploying the Spark donation management application.

## Pre-Deployment Setup ✅

### 1. GCP Project Setup
- [ ] Google Cloud SDK installed and authenticated
- [ ] GCP project created and billing enabled
- [ ] Required APIs enabled (Cloud Run, Container Registry, Artifact Registry)
- [ ] Service account created with proper permissions
- [ ] Service account key generated and base64 encoded

**Run this command:**
```bash
cd scripts && chmod +x setup-gcp.sh && ./setup-gcp.sh
```

### 2. Email Service Configuration
Choose one email provider:

**Option A: SendGrid**
- [ ] SendGrid account created
- [ ] API key generated with Mail Send permissions
- [ ] Sender email verified
- [ ] Test email sent successfully

**Option B: Postmark**
- [ ] Postmark account created
- [ ] Server created and API token obtained
- [ ] Sender signature verified
- [ ] Test email sent successfully

### 3. Vercel Frontend Setup
- [ ] Vercel account created
- [ ] Vercel CLI installed (`npm install -g vercel`)
- [ ] Project initialized (`vercel` command in web/ directory)
- [ ] Personal access token generated
- [ ] Project ID and Org ID obtained

### 4. GitHub Repository Secrets
Set all required secrets in GitHub repository (Settings > Secrets and variables > Actions):

**GCP Configuration:**
- [ ] `GCP_PROJECT_ID` = your-gcp-project-id
- [ ] `GCP_SA_KEY` = base64-encoded-service-account-key

**Application Configuration:**
- [ ] `SPARK_ORG_NAME` = Your Organization Name
- [ ] `SPARK_EIN` = 12-3456789
- [ ] `SPARK_ADDR` = Your Organization Address

**Email Service (choose one):**
- [ ] `EMAIL_PROVIDER` = "sendgrid" or "postmark"
- [ ] `SENDGRID_API_KEY` = your-sendgrid-api-key (if using SendGrid)
- [ ] `POSTMARK_API_TOKEN` = your-postmark-token (if using Postmark)

**Vercel Configuration:**
- [ ] `VERCEL_TOKEN` = vercel_your_token_here
- [ ] `VERCEL_PROJECT_ID` = prj_abc123def456
- [ ] `VERCEL_ORG_ID` = team_xyz789abc123

**Deployment URLs (will be set after first deployment):**
- [ ] `API_URL` = https://your-cloud-run-service-url
- [ ] `FRONTEND_URL` = https://your-vercel-app.vercel.app

**Optional:**
- [ ] `SLACK_WEBHOOK_URL` = your-slack-webhook-url

## Deployment Process 🚀

### 1. Pre-Deployment Testing
Run local tests to ensure everything works:

```bash
# API tests
cd api
pip install -r requirements.txt
python -m pytest tests/ -v

# Frontend tests
cd ../web
npm ci --legacy-peer-deps
npm run typecheck
npm run lint
npm run test
npm run build

# E2E tests (optional - requires both services running)
npm run test:e2e
```

### 2. Deploy to Production
```bash
# Commit all changes
git add .
git commit -m "🚀 Production deployment setup"

# Push to main branch (triggers deployment)
git push origin main
```

### 3. Monitor Deployment
1. **Go to GitHub Actions tab**
2. **Watch "Deploy to Production" workflow**
3. **Monitor each job:**
   - [ ] `test` - All test suites pass
   - [ ] `deploy-api` - API deployed to Cloud Run
   - [ ] `deploy-frontend` - Frontend deployed to Vercel
   - [ ] `smoke-tests` - Production smoke tests pass

### 4. Post-Deployment Configuration

**After API deployment:**
1. **Get API URL** from Cloud Run console
2. **Update GitHub secret:** `API_URL`
3. **Update Vercel environment variable:** `NEXT_PUBLIC_API_URL`

**After frontend deployment:**
1. **Get frontend URL** from Vercel dashboard
2. **Update GitHub secret:** `FRONTEND_URL`

## Verification & Testing 🧪

### 1. Health Checks
- [ ] API health endpoint: `GET https://your-api-url/health`
- [ ] Frontend loads: `https://your-frontend-url`
- [ ] All pages render without errors

### 2. Functionality Testing
- [ ] **Dashboard Access:** Navigate to reviewer dashboard
- [ ] **File Upload:** Upload a test donation receipt
- [ ] **Data Processing:** Verify receipt data is extracted correctly
- [ ] **Email Delivery:** Check receipt email is sent
- [ ] **Reconciliation:** Test reconciliation features

### 3. Integration Testing
```bash
# Run production smoke tests manually
cd web
npm run test:e2e -- --grep="production"
```

### 4. Performance Testing
- [ ] **API Response Times:** < 500ms for most endpoints
- [ ] **Frontend Load Time:** < 3s on 3G
- [ ] **Core Web Vitals:** Check in Vercel Analytics

## Production Monitoring 📊

### 1. Set Up Monitoring
- [ ] **Cloud Run Metrics:** Monitor requests, errors, latency
- [ ] **Vercel Analytics:** Track performance and usage
- [ ] **Email Delivery:** Monitor bounce rates and delivery success
- [ ] **Error Tracking:** Set up alerts for errors

### 2. Log Access
- [ ] **API Logs:** Cloud Run > Logs tab
- [ ] **Frontend Logs:** Vercel Dashboard > Functions
- [ ] **GitHub Actions:** Repository > Actions tab
- [ ] **Build Logs:** Vercel Dashboard > Deployments

## Security Checklist 🔒

### 1. Access Controls
- [ ] **GCP IAM:** Service account has minimum required permissions
- [ ] **GitHub Secrets:** All sensitive data stored securely
- [ ] **Vercel Environment:** Production variables properly configured
- [ ] **Email API Keys:** Limited scope and rotated regularly

### 2. Security Headers
- [ ] **HTTPS Enforced:** Both API and frontend use HTTPS
- [ ] **CORS Configured:** API allows requests from frontend domain only
- [ ] **Security Headers:** Vercel automatically adds security headers

### 3. Data Protection
- [ ] **PII Handling:** Donation data processed securely
- [ ] **Email Privacy:** Recipient data protected
- [ ] **Receipt Storage:** Files stored securely or deleted after processing

## Troubleshooting Guide 🔧

### Common Deployment Issues

**GitHub Actions Failing:**
1. Check secrets are set correctly
2. Verify service account permissions
3. Review error logs in Actions tab

**API Deployment Issues:**
1. Verify Docker build completes locally
2. Check Cloud Run service logs
3. Ensure all environment variables are set

**Frontend Deployment Issues:**
1. Check Vercel build logs
2. Verify Node.js version compatibility
3. Ensure all dependencies install correctly

**Email Not Sending:**
1. Verify API keys are correct and active
2. Check sender verification status
3. Review email service dashboard for errors

### Performance Issues
1. **Slow API responses:** Check Cloud Run metrics and scale settings
2. **Frontend loading slowly:** Review Vercel Analytics and optimize assets
3. **High error rates:** Check logs and implement error handling

### Getting Help
1. **GitHub Issues:** Check repository issues for known problems
2. **Service Status Pages:** Verify third-party service status
3. **Documentation:** Review service provider documentation
4. **Support:** Contact service provider support if needed

## Rollback Plan 🔄

If deployment fails or issues arise:

### 1. Immediate Rollback
```bash
# Revert to previous working commit
git revert HEAD
git push origin main
```

### 2. Service-Specific Rollback

**Cloud Run:**
```bash
# List revisions and rollback to previous
gcloud run revisions list --service=sparkapp-api
gcloud run services update-traffic sparkapp-api --to-revisions=REVISION_NAME=100
```

**Vercel:**
```bash
# Rollback via Vercel dashboard or CLI
vercel rollback https://your-deployment-url
```

## Success Criteria ✅

Deployment is successful when:

- [ ] **All GitHub Actions jobs pass**
- [ ] **API health endpoint returns 200 OK**
- [ ] **Frontend loads without errors**
- [ ] **File upload and processing works**
- [ ] **Emails are delivered successfully**
- [ ] **No security vulnerabilities detected**
- [ ] **Performance meets targets (< 3s load time)**
- [ ] **Monitoring and alerts are active**

## Next Steps 📈

After successful deployment:

1. **Monitor Performance:** Track metrics for first 24-48 hours
2. **User Testing:** Have stakeholders test the application
3. **Documentation:** Update user guides and API documentation
4. **Backup Strategy:** Implement regular data backups
5. **Maintenance Plan:** Schedule regular security updates
6. **Scaling Plan:** Monitor usage and plan for growth

---

**🎉 Congratulations! Your Spark donation management application is now live in production!**

For ongoing support and maintenance, refer to the service dashboards and monitoring tools set up during deployment.