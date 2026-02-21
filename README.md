# WhatsApp Embedded Signup

Standalone HTML + Node.js/Express app for Facebook OAuth token exchange and WhatsApp Business account setup with localStorage token persistence.

## Architecture

- **Frontend**: Barebones HTML (static site) → Deploy to **Netlify**
- **Backend**: Node.js/Express server → Deploy to **Railway**

## Local Development

### 1. Backend Setup (Express Token Exchange Server)

```bash
# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Add your Facebook App Secret to .env
# FACEBOOK_APP_SECRET=your_secret_here

# Start the server
npm start
```

Server runs on `http://localhost:3000`

### 2. Frontend (HTML)

Open `index.html` in a browser. The page automatically connects to `http://localhost:3000` for token exchange.

## Production Deployment

### Backend: Railway

1. **Create Railway account** at [railway.app](https://railway.app)

2. **Push to GitHub** (Railway integrates with GitHub)
   ```bash
   git init
   git add .
   git commit -m "WhatsApp embed signup setup"
   git remote add origin https://github.com/YOUR_USERNAME/whatsapp-embedded-signup.git
   git push -u origin main
   ```

3. **Deploy on Railway**
   - Go to [railway.app/dashboard](https://railway.app/dashboard)
   - Click **"New Project"** → **"Deploy from GitHub"**
   - Select your repository
   - Railway auto-detects `package.json` and starts the Node server

4. **Set Environment Variables**
   - In Railway dashboard, go to your project
   - Click **Variables**
   - Add:
     ```
     FACEBOOK_APP_ID=1096652478976715
     FACEBOOK_APP_SECRET=your_secret_here
     FACEBOOK_CONFIG_ID=1375843820179450
     NODE_ENV=production
     ```

5. **Get Your Backend URL**
   - Railway provides a URL like: `https://whatsapp-signup-prod.up.railway.app`
   - Copy this URL

### Frontend: Netlify

1. **Build HTML for deployment**
   - Open `index.html` in a text editor
   - Find this line (near the top, in the `<script>` tag):
     ```javascript
     window.BACKEND_API_URL = window.BACKEND_API_URL || 'http://localhost:3000';
     ```
   - Replace with your Railway URL:
     ```javascript
     window.BACKEND_API_URL = 'https://whatsapp-signup-prod.up.railway.app';
     ```

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Drag & drop `index.html` OR
   - Connect GitHub:
     - Push `index.html` to GitHub
     - Click **"Import an existing project"** → **"GitHub"**
     - Select your repo
     - Deploy

3. **Get Your Frontend URL**
   - Netlify provides something like: `https://whatsapp-signup.netlify.app`

## API Endpoints

### POST `/api/exchange-token`
Exchange Facebook authorization code for access token.

**Request:**
```json
{
  "code": "authorization_code_from_fb_sdk"
}
```

**Response:**
```json
{
  "access_token": "token...",
  "token_type": "bearer",
  "expires_in": 5184000,
  "success": true
}
```

### POST `/api/verify-token`
Verify and inspect a stored access token.

**Request:**
```json
{
  "access_token": "token_to_verify"
}
```

**Response:**
```json
{
  "is_valid": true,
  "scopes": ["..."],
  "expires_at": 1234567890,
  "app_id": "1096652478976715"
}
```

## Features

✅ Facebook Embedded Signup flow  
✅ Authorization code → Access token exchange  
✅ Token storage in browser localStorage  
✅ Copy/export stored tokens  
✅ Session info display (WABA ID, Phone Number ID)  
✅ **IntelliBiz API integration** – Connect WhatsApp accounts to your backend  
✅ Debug mode for testing  
✅ Secure token handling (app secret never exposed to frontend)  

## Token Storage

Tokens are saved in browser localStorage under the key `wa_signup_tokens`:

```javascript
[
  {
    "id": "uuid",
    "code": "authorization_code",
    "access_token": "token...",
    "expires_in": 5184000,
    "phone_number_id": "1234567890",
    "waba_id": "9876543210",
    "stored_at": "2026-02-21T18:05:40.000Z"
  }
]
```

## Accessing Stored Tokens (JavaScript)

```javascript
// Get all tokens
const tokens = JSON.parse(localStorage.getItem('wa_signup_tokens'));

// Get latest token
const latestToken = tokens[tokens.length - 1];

// Use the access token
const accessToken = latestToken.access_token;
```

## Troubleshooting

### "Malformed access token" error in Postman
- Ensure you're using the **access token** (not the authorization code)
- Check that no extra characters were added when copying (look for escaped HTML)
- Use the "Copy Access Token" button in the UI (not manual copy-paste)

### Backend and frontend connection fails
- Check Railway logs: `railway logs`
- Verify CORS is enabled (it is, in `exchange-token-server.js`)
- Ensure the frontend `BACKEND_API_URL` matches your Railway deployment URL

### Token exchange returns 400 error
- Verify `FACEBOOK_APP_SECRET` is set correctly in Railway Variables
- Check that `code` is valid (codes expire quickly)
- See Railway console logs for details

## Environment Variables

### Backend (.env)
```
FACEBOOK_APP_ID=1096652478976715
FACEBOOK_APP_SECRET=your_app_secret
PORT=3000
NODE_ENV=production
```

### Frontend (in HTML)
```javascript
window.BACKEND_API_URL = 'https://your-railway-url.up.railway.app'
```

## Security Notes

⚠️ **Never commit `.env` to GitHub** – it contains your app secret  
⚠️ **App secret stays on backend only** – frontend never handles it  
⚠️ **Use HTTPS in production** – tokens are sensitive  
⚠️ **Set CORS properly** – currently allows all origins (update if needed)  

## Next Steps

- Implement phone number registration flow
- Add webhook listeners for WhatsApp events
- Connect to your CRM/messaging platform
- Add database to persist tokens (optional)

---

## IntelliBiz API Integration

After obtaining your WhatsApp access token, you can connect your account to IntelliBiz:

### Flow

1. User logs in with Facebook
2. Authorization code is exchanged for access token
3. Token is stored in localStorage
4. User enters their **IntelliBiz API Token** and **User ID**
5. Click **"Connect Account"** to link WhatsApp to IntelliBiz
6. System makes POST request to: `https://intelli-app.com/api/v1/whatsapp/account/connect`

### Request Payload

```json
{
  "apiToken": "user_api_token",
  "user_id": "user_id",
  "whatsapp_business_account_id": "waba_id_from_facebook",
  "access_token": "access_token_from_facebook"
}
```

### Integration Example

The HTML form includes fields to enter:
- **API Token**: Your IntelliBiz API authentication token
- **User ID**: Your IntelliBiz user ID

Once connected, the token entry will show a success indicator: ✅ **IntelliBiz Connected**

Connection details are stored in localStorage for future reference.

---

**Deployed URLs:**
- Frontend (Netlify): `https://your-site.netlify.app`
- Backend (Railway): `https://your-app.up.railway.app`
