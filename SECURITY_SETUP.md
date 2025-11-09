# 🔐 Secure Environment Setup Guide

## ⚠️ IMPORTANT: Security First!

This project now uses **environment variables** for all sensitive credentials. The service account JSON file is **NO LONGER USED** and should **NOT be committed to git**.

## 🚀 Quick Setup

### 1. Backend Environment Setup

```bash
cd backend
cp .env.example .env
```

Then edit `backend/.env` with your actual credentials from Google Cloud Console.

### 2. Frontend Environment Setup

```bash
# From project root
cp .env.example .env
```

Edit `.env` if you need to change the backend API URL (default: http://localhost:5000)

### 3. Get Your Google Cloud Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Enable Dialogflow API
4. Go to **IAM & Admin** → **Service Accounts**
5. Click **Create Service Account** (or select existing)
6. Grant **Dialogflow API Client** role
7. Click **Add Key** → **Create new key** → **JSON**
8. Download the JSON file

### 4. Configure Environment Variables

Open the downloaded JSON file and copy values to `backend/.env`:

**From JSON file:**
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "account@project.iam.gserviceaccount.com",
  "client_id": "123456789",
  ...
}
```

**To backend/.env:**
```env
GOOGLE_SERVICE_ACCOUNT_PROJECT_ID=your-project-id
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID=abc123...
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_CLIENT_ID=123456789
```

⚠️ **Important**: Keep the quotes around the private key and preserve the `\n` characters!

## 📋 Environment Variables Reference

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `DIALOGFLOW_PROJECT_ID` | Your Dialogflow project ID | `my-project-123` |
| `DIALOGFLOW_LANGUAGE_CODE` | Bot language | `en-US` |
| `GOOGLE_SERVICE_ACCOUNT_TYPE` | Always `service_account` | `service_account` |
| `GOOGLE_SERVICE_ACCOUNT_PROJECT_ID` | Google Cloud project ID | `my-project-123` |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID` | Private key ID from JSON | `abc123def456...` |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Full private key (with \n) | `"-----BEGIN...` |
| `GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL` | Service account email | `account@project.iam...` |
| `GOOGLE_SERVICE_ACCOUNT_CLIENT_ID` | Client ID from JSON | `123456789` |

### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000` |

## 🔒 Security Best Practices

### ✅ DO:
- Keep `.env` files in `.gitignore`
- Use `.env.example` as templates (no secrets)
- Share `.env.example` with your team
- Use different credentials for dev/prod
- Rotate keys regularly
- Use secret management in production (AWS Secrets Manager, Azure Key Vault, etc.)

### ❌ DON'T:
- Commit `.env` files to git
- Share `.env` files in public channels
- Hardcode secrets in source code
- Use production keys in development
- Commit `service_account.json` file

## 🧪 Testing Your Setup

### 1. Test Backend

```bash
cd backend
npm start
```

You should see:
```
✅ Dialogflow service initialized with environment credentials
🚀 Server is running on port 5000
```

If you see errors about missing credentials, check your `.env` file.

### 2. Test Health Endpoint

```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "Student Grievance Chatbot API"
}
```

### 3. Test Frontend

```bash
# From project root
npm run dev
```

Open http://localhost:5173 and test the chatbot.

## 🐛 Troubleshooting

### Error: Missing required service account credential

**Problem**: Environment variable is not set or is empty.

**Solution**: 
1. Check `backend/.env` file exists
2. Verify all `GOOGLE_SERVICE_ACCOUNT_*` variables are set
3. Ensure no typos in variable names
4. Restart backend server after editing `.env`

### Error: invalid_grant or authentication error

**Problem**: Private key is malformed or incorrect.

**Solution**:
1. Check the private key has quotes: `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN..."`
2. Ensure `\n` characters are preserved (not actual newlines)
3. Copy-paste directly from JSON file
4. Don't modify the key content

### Error: Project not found

**Problem**: Project ID doesn't match or Dialogflow API not enabled.

**Solution**:
1. Verify `DIALOGFLOW_PROJECT_ID` matches your Google Cloud project
2. Enable Dialogflow API in Google Cloud Console
3. Ensure service account has proper permissions

## 📦 Deployment Checklist

### Before Pushing to GitHub:

- [ ] `.env` files are in `.gitignore`
- [ ] No secrets in source code
- [ ] `.env.example` files are created
- [ ] Documentation is updated
- [ ] `service_account.json` is removed or gitignored
- [ ] Test with fresh clone (git clone + setup .env)

### Production Deployment:

- [ ] Use production credentials
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS for all URLs
- [ ] Enable rate limiting
- [ ] Set up monitoring
- [ ] Use secret management service
- [ ] Configure proper CORS origins
- [ ] Enable logging

## 🌐 Production Environment Variables

### Backend (Production)

```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
DIALOGFLOW_PROJECT_ID=your-prod-project
DIALOGFLOW_LANGUAGE_CODE=en-US

# Use your production service account credentials
GOOGLE_SERVICE_ACCOUNT_PROJECT_ID=your-prod-project
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID=prod-key-id
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=prod-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_CLIENT_ID=prod-client-id
```

### Frontend (Production)

```env
VITE_API_URL=https://api.yourdomain.com
```

## 🔐 Secret Management Services

For production, consider using:

### AWS Secrets Manager
```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();
const secret = await secretsManager.getSecretValue({ SecretId: 'dialogflow-creds' }).promise();
```

### Azure Key Vault
```javascript
const { SecretClient } = require('@azure/keyvault-secrets');
const client = new SecretClient(vaultUrl, credential);
const secret = await client.getSecret('dialogflow-private-key');
```

### Google Secret Manager
```javascript
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();
const [version] = await client.accessSecretVersion({ name: secretName });
```

## 📚 Additional Resources

- [Google Cloud Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [Dialogflow Authentication](https://cloud.google.com/dialogflow/docs/authentication)
- [Environment Variables Best Practices](https://12factor.net/config)
- [Secret Management Guide](https://cloud.google.com/secret-manager/docs)

## 💬 Need Help?

If you encounter issues:

1. Check this guide carefully
2. Verify all environment variables are set correctly
3. Test with the health endpoint first
4. Check backend logs for detailed error messages
5. Ensure Dialogflow API is enabled in Google Cloud

---

**Remember**: Never commit secrets to version control! 🔒
