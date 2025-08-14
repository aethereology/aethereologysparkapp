# Postmark Email Service Setup

Complete guide to set up Postmark for donation receipt emails.

## Step 1: Create Postmark Account

1. Go to [Postmark.com](https://postmarkapp.com)
2. Sign up for a free account (100 emails/month free tier)
3. Verify your email address

## Step 2: Create a Server

1. **Click "Create a Server"**
2. **Choose "Transactional" server type**
3. **Name it:** "Spark-Donation-App"
4. **Click "Create Server"**

## Step 3: Get API Token

1. **Go to your server settings**
2. **Navigate to "API Tokens" tab**
3. **Copy the "Server API token"** (starts with a long string)
4. **Keep this secure** - you'll need it for GitHub secrets

## Step 4: Sender Signature Setup

### Single Email Address (Quickest)
1. **Go to "Sender Signatures"**
2. **Click "Add Signature"**
3. **Enter your email:** your-org@example.com
4. **Click "Add Signature"**
5. **Check your email and click verification link**

### Domain-wide Setup (Recommended)
1. **Go to "Sender Signatures"**
2. **Click "Add Domain"**
3. **Enter your domain:** yourorg.com
4. **Add DKIM records** to your DNS
5. **Wait for verification**

## Step 5: Test Email Configuration

Create a test script to verify your setup:

```bash
# Create test file
cat > test-postmark.py << 'EOF'
import requests
import json

# Your Postmark server token
POSTMARK_TOKEN = "YOUR_TOKEN_HERE"

def test_postmark():
    url = "https://api.postmarkapp.com/email"
    
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": POSTMARK_TOKEN
    }
    
    data = {
        "From": "your-verified-sender@example.com",
        "To": "test-recipient@example.com",
        "Subject": "Spark Donation App Test",
        "HtmlBody": "<p>This is a test email from your donation app!</p>",
        "MessageStream": "outbound"
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

test_postmark()
EOF

# Install requests if needed
pip install requests

# Run test (replace with your actual token)
python test-postmark.py
```

## Step 6: GitHub Secrets

Set these secrets in your GitHub repository:

```
EMAIL_PROVIDER=postmark
POSTMARK_API_TOKEN=your-actual-server-token-here
```

## Email Templates (Optional)

While not required, you can create custom templates:

### Create Template in Postmark
1. **Go to "Templates"**
2. **Click "Create Template"**
3. **Choose "Create from scratch"**
4. **Design your receipt template with variables:**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Donation Receipt</title>
</head>
<body>
    <h1>Thank you for your donation!</h1>
    <p>Dear {{donor_name}},</p>
    <p>Thank you for your generous donation of ${{amount}} on {{date}}.</p>
    <p>Your donation is tax-deductible. Receipt #{{receipt_id}}</p>
    <p>Attached is your official receipt.</p>
</body>
</html>
```

## Monitoring & Analytics

### Postmark Dashboard
1. **Activity:** See all sent emails
2. **Statistics:** Delivery rates, opens, bounces
3. **Suppressions:** Manage bounce and spam lists

### Message Streams
- **Outbound:** Regular transactional emails (receipts)
- **Broadcast:** Marketing emails (if needed)

## Troubleshooting

### Common Issues

**"Sender signature not found" error:**
- Verify sender email matches your signature
- Ensure signature is confirmed via email

**"Invalid server token" error:**
- Double-check your API token
- Make sure you're using Server API token, not Account token

**"Inactive signature" error:**
- Check if your domain/email verification expired
- Re-verify your sender signature

**Emails not delivered:**
- Check Postmark's activity log
- Verify recipient email is valid
- Look for bounce or spam classifications

### Testing Checklist
- [ ] Server created and configured
- [ ] Sender signature verified
- [ ] API token copied correctly
- [ ] Test email sends successfully
- [ ] Receipt attachments work properly
- [ ] Delivery tracking works

## Advanced Features

### Webhooks (Optional)
Set up webhooks to track email events:

1. **Go to "Webhooks"**
2. **Add webhook URL:** `https://your-api-url/webhooks/postmark`
3. **Select events:** Delivery, Bounce, Spam Complaint
4. **Test webhook delivery**

### Templates with Variables
Use Postmark templates for consistent formatting:

```python
# Example using templates
data = {
    "From": "donations@yourorg.com",
    "To": donor_email,
    "TemplateAlias": "donation-receipt",
    "TemplateModel": {
        "donor_name": "John Doe",
        "amount": "100.00",
        "date": "2024-01-15",
        "receipt_id": "RCP-2024-001"
    },
    "Attachments": [{
        "Name": "receipt.pdf",
        "Content": base64_pdf_content,
        "ContentType": "application/pdf"
    }]
}
```

## Production Considerations

### Volume Limits
- **Free:** 100 emails/month
- **Starter:** $15/month for 10K emails
- **Growth:** $150/month for 125K emails

### Best Practices
1. **Use dedicated IPs** for high volume
2. **Monitor bounce rates** (keep under 10%)
3. **Set up proper SPF/DKIM records**
4. **Use message streams** to organize email types

### Security
- **Keep API tokens secure**
- **Use HTTPS webhooks only**
- **Monitor for unusual sending patterns**
- **Regularly rotate API tokens**

## Deliverability Features

### Built-in Advantages
- **Dedicated infrastructure** for better delivery
- **Automatic list cleaning** removes hard bounces
- **Spam filtering protection**
- **Real-time delivery tracking**

### Reputation Management
- **Postmark maintains IP reputation**
- **Automatic bounce handling**
- **Spam complaint monitoring**
- **Delivery optimization**

## Integration with Spark App

Your application automatically handles:
- Email sending via Postmark API
- PDF attachment encoding
- Delivery status tracking
- Error handling and retries
- Bounce management

Just set the GitHub secrets and you're ready to go!