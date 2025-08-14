# SendGrid Email Service Setup

Complete guide to set up SendGrid for donation receipt emails.

## Step 1: Create SendGrid Account

1. Go to [SendGrid.com](https://sendgrid.com)
2. Sign up for a free account (100 emails/day free tier)
3. Verify your email address

## Step 2: Create API Key

1. **Navigate to Settings > API Keys**
2. **Click "Create API Key"**
3. **Choose "Restricted Access"**
4. **Set permissions:**
   - Mail Send: Full Access
   - Mail Settings: Read Access (optional)
   - Tracking: Read Access (optional)
5. **Name it:** "Spark-Donation-App"
6. **Copy the API key** (you won't see it again!)

## Step 3: Sender Authentication

### Option A: Single Sender Verification (Quickest)
1. Go to **Settings > Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill out the form:
   - **From Email:** your-org@example.com
   - **From Name:** Your Organization Name
   - **Reply To:** same as from email
   - **Company Address:** Your organization's address
4. **Click "Create"**
5. **Check your email and click the verification link**

### Option B: Domain Authentication (Recommended for production)
1. Go to **Settings > Sender Authentication**
2. Click **"Authenticate Your Domain"**
3. Enter your domain (e.g., yourorg.com)
4. Add the DNS records to your domain provider
5. Wait for verification (can take up to 48 hours)

## Step 4: Test Email Configuration

Create a test script to verify your setup:

```bash
# Create test file
cat > test-sendgrid.py << 'EOF'
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

# Set your API key
sg = SendGridAPIClient(api_key='YOUR_API_KEY_HERE')

# Test email
message = Mail(
    from_email='your-verified-sender@example.com',
    to_emails='test-recipient@example.com',
    subject='Spark Donation App Test',
    html_content='<p>This is a test email from your donation app!</p>'
)

try:
    response = sg.send(message)
    print(f"Email sent! Status: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
EOF

# Install SendGrid Python library
pip install sendgrid

# Run test (replace with your actual values)
python test-sendgrid.py
```

## Step 5: GitHub Secrets

Set these secrets in your GitHub repository:

```
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-actual-api-key-here
```

## Email Templates

Your app will send these types of emails:

### 1. Donation Receipt
- **Subject:** "Thank you for your donation - Receipt #12345"
- **Contains:** Receipt PDF, tax deduction info
- **Triggers:** When donation is processed

### 2. Failed Processing Notification
- **Subject:** "Donation processing issue - Action needed"
- **Contains:** Error details, next steps
- **Triggers:** When receipt processing fails

## Monitoring & Analytics

### SendGrid Dashboard
1. **Activity Feed:** See all sent emails
2. **Statistics:** Open rates, click rates, bounces
3. **Suppressions:** Manage unsubscribes and bounces

### Email Best Practices
1. **Use your organization's domain** for from_email
2. **Include unsubscribe link** (SendGrid adds automatically)
3. **Monitor bounce rates** (keep under 5%)
4. **Warm up your IP** for high-volume sending

## Troubleshooting

### Common Issues

**"Sender not verified" error:**
- Verify your sender email address
- Make sure from_email matches verified sender

**"API key insufficient permissions" error:**
- Recreate API key with Mail Send permissions
- Check if restrictions are too tight

**Emails going to spam:**
- Complete domain authentication
- Include proper unsubscribe links
- Maintain good sender reputation

**High bounce rate:**
- Validate email addresses before sending
- Remove invalid emails from lists
- Check for typos in recipient addresses

### Testing Checklist
- [ ] API key has Mail Send permissions
- [ ] Sender email is verified
- [ ] Test email sends successfully
- [ ] Receipt emails include PDF attachment
- [ ] Unsubscribe link works
- [ ] Emails arrive in inbox (not spam)

## Production Considerations

### Volume Limits
- **Free:** 100 emails/day
- **Essentials:** $14.95/month for 50K emails
- **Pro:** $89.95/month for 1.5M emails

### Scaling Tips
1. **Use dedicated IP** for high volume (>100K/month)
2. **Implement proper list management**
3. **Monitor deliverability metrics**
4. **Set up webhooks** for delivery tracking

### Security
- **Never expose API keys** in client-side code
- **Use environment variables** for sensitive data
- **Rotate API keys regularly**
- **Monitor for unauthorized usage**

## Integration with Spark App

Your application automatically handles:
- PDF receipt generation
- Email template rendering
- Delivery status tracking
- Error handling and retries

No additional code changes needed - just set the GitHub secrets!