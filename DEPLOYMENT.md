# AURVED Admin - Deployment Guide

## 🚀 Deployment Options

### Option 1: Vercel (Recommended - Easiest)

#### Steps:
1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
cd /Users/appsmartz/IdeaProjects/aurved-admin
vercel
```

4. **Production Deployment**
```bash
vercel --prod
```

#### Environment Variables (Vercel Dashboard):
```
VITE_API_BASE_URL=https://api.aurved.com/api
VITE_APP_ENV=production
```

---

### Option 2: Netlify

#### Steps:
1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Build Project**
```bash
npm run build
```

3. **Deploy**
```bash
netlify deploy --prod --dir=dist
```

#### netlify.toml Configuration:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Option 3: AWS S3 + CloudFront

#### Step 1: Build Project
```bash
npm run build
```

#### Step 2: Create S3 Bucket
```bash
aws s3 mb s3://aurved-admin
```

#### Step 3: Enable Static Website Hosting
```bash
aws s3 website s3://aurved-admin --index-document index.html --error-document index.html
```

#### Step 4: Upload Files
```bash
aws s3 sync dist/ s3://aurved-admin --delete
```

#### Step 5: Setup CloudFront
- Create CloudFront distribution
- Point to S3 bucket
- Configure SSL certificate
- Add custom domain

#### Step 6: Update Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::aurved-admin/*"
    }
  ]
}
```

---

### Option 4: GitHub Pages

#### Step 1: Update vite.config.ts
```typescript
export default defineConfig({
  base: '/aurved-admin/', // Repository name
  // ... rest of config
});
```

#### Step 2: Build
```bash
npm run build
```

#### Step 3: Deploy Script
```bash
# Add to package.json scripts
"deploy": "gh-pages -d dist"
```

#### Step 4: Deploy
```bash
npm run deploy
```

---

## 🔧 CI/CD Setup

### GitHub Actions (Vercel)

Create: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

### GitHub Actions (AWS S3)

Create: `.github/workflows/deploy-aws.yml`

```yaml
name: Deploy to AWS S3

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-2
      
      - name: Deploy to S3
        run: |
          aws s3 sync dist/ s3://aurved-admin --delete
      
      - name: Invalidate CloudFront Cache
        run: |
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```

---

## 🌐 Environment Configuration

### Development (.env.development)
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_ENV=development
```

### Production (.env.production)
```env
VITE_API_BASE_URL=https://api.aurved.com/api
VITE_APP_ENV=production
```

---

## 📝 Pre-Deployment Checklist

- [ ] Update API base URL in environment variables
- [ ] Test production build locally: `npm run build && npm run preview`
- [ ] Verify all routes work correctly
- [ ] Check responsive design on different devices
- [ ] Test API integration
- [ ] Configure CORS on backend
- [ ] Setup SSL certificate
- [ ] Configure custom domain
- [ ] Setup monitoring (Sentry, LogRocket)
- [ ] Enable error tracking
- [ ] Configure analytics (Google Analytics, Mixpanel)

---

## 🔒 Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use platform-specific secrets management
   - Rotate API keys regularly

2. **CORS Configuration**
   - Backend must allow frontend domain
   ```kotlin
   // Spring Boot example
   @CrossOrigin(origins = ["https://admin.aurved.com"])
   ```

3. **HTTPS**
   - Always use HTTPS in production
   - Configure SSL certificates
   - Enable HSTS headers

4. **Content Security Policy**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
   ```

---

## 📊 Monitoring & Analytics

### Setup Error Tracking (Sentry)
```bash
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.VITE_APP_ENV,
});
```

### Setup Analytics (Google Analytics)
```bash
npm install react-ga4
```

---

## 🚦 Post-Deployment Testing

1. **Smoke Tests**
   - Can access homepage?
   - Can login?
   - Can navigate to all pages?

2. **Performance Tests**
   - Lighthouse score > 90
   - First Contentful Paint < 2s
   - Time to Interactive < 3s

3. **Cross-Browser Testing**
   - Chrome
   - Firefox
   - Safari
   - Edge

---

## 📞 Support

**Project**: AURVED Admin  
**Tech Stack**: React + TypeScript + Vite  
**Recommended Platform**: Vercel or AWS S3+CloudFront  

---

## 🔗 Useful Commands

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Deploy (Vercel)
vercel --prod

# Deploy (Netlify)
netlify deploy --prod

# Deploy (AWS S3)
aws s3 sync dist/ s3://aurved-admin
```

---

**Happy Deploying! 🚀**
