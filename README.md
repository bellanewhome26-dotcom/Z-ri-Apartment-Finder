# 🇨🇭 Züri Apartment Tracker & Co-Pilot

Welcome to **Züri Apartment Finder**, your intelligent dashboard designed to simplify the competitive Swiss rental market (specifically Greater Zürich). By combining state-of-the-art AI parsing (Gemini API) and deep Google Workspace Integrations (Gmail, Calendar, Drive, and Google Docs), this application automates the tedious parts of finding, comparing, and applying for apartments.

This document describes how the app runs, details its main functions, explains how to connect your accounts safely, and instructions for free hosting on Render.

---

## 🚀 Key Applications & Main Functions

### 1. Gmail Sync: Real-Time Listing Feed
Parsing listings from platform alerts can take hours. With **Gmail Feed Synchronization**:
* **How it works:** Open the **Google Account Integration** panel (the settings gear icon) and log in with your Google Account.
* **Auto-Discovery:** Once connected, the app pulls your most recent real estate newsletters and alert emails (supporting **Homegate, Flatfox, Comparis, Comparis alerts, Ron Orp**, and more).
* **Gemini Parsing:** The backend processes these emails under the hood using Gemini to instantly extract the **size (sq meters)**, **rent (CHF)**, **number of rooms**, **landlord/agent email**, and **street address**, inserting them directly onto your dashboard and interactive Zürich map.

### 2. Dossier Manager: Upload & Verification
A complete application dossier makes or breaks your chance of getting an apartment.
* **Requirements Checklist:** Track essential documents such as your **Betreibungsauszug** (Debt enforcement register copy), **Employment Contract**, **Payslips**, and **ID/Permit (L/B/C/Swiss)**.
* **Storage:** In standard mode, documents are processed safely in your browser. When Google Web OAuth is activated, the tracker reads directly from designated Google Drive directories or keeps checklist states matching your profile.

### 3. Smart Document Customization: Google Docs Cover Letters
Applying for a flat in Switzerland requires a formal, context-tailored cover letter in High German (*Bewerbungsschreiben*).
* **One-Click Generation:** Select any imported apartment on your list.
* **Tailored Outputs:** Under the Dossier section, click **"Apply / Cover Letter"**. The Co-pilot automatically drafts a formal German application letter matching your candidate profile (salary, employer, background, pet/kids status) to the specific flat's details.
* **Native Docs Save:** If connected via Google Docs API, a fresh document is created directly on your Google Drive under a named folder, allowing you to edit and print instantly!

### 4. Interactive Zürich Map, Commutes & Taxes
Deciding where to move involves more than just rent. The interactive SVG map analyzes the Greater Zürich communes in real time:
* **Commute Indicator:** Every apartment automatically calculates the public transport or train commute distance to **Zürich Hauptbahnhof (HB)**.
* **Commune Tax Comparison:** Canton Zürich has different tax rates (*Steuerfuss*) depending on the municipality. Living in *Kilchberg* or *Zollikon* costs far less in taxes than *Zürich City* or *Dübendorf*. The interactive map uses your gross salary input to project your tax burden and visualizes the relative affordability on bento cards!
* **Status Pin Colors:** Pins are dynamically color-coded:
  * 🔵 **Discovered / New**
  * 🟡 **Applied**
  * 🟢 **Viewing Scheduled**
  * 🔴 **Declined**

### 5. Automated Google Calendar Booking
When an agency or landlord invites you to a physical flat viewing:
* **Appointment Tracking:** Change the apartment's status dropdown to **"Viewing Scheduled"**.
* **Instant Calendar Injection:** The app prompts you to input the exact date and time. Click **"Eintragen"** / **"Schedule Workspace Calendar"**, and it injects a real Google Calendar Event with the apartment's street address prestaged as the location, ensuring notifications and travel paths are calculated on your phone!

### 6. Interactive AI Co-Pilot (Lease & Application Expert)
Our AI Co-Pilot is calibrated as an expert on Swiss Tenancy Law (*Mietrecht*), Zurich customs, and tenant protections:
* **Profile Updating:** Say *"My salary is now 135,000 CHF"* or *"Update my employer to Google"* and the Co-pilot updates your permanent application dashboard profile on the fly.
* **Consultative Guidance:** Ask questions like:
  * *"Is CHF 2500 rent affordable for my salary?"*
  * *"How can I challenge an over-expensive Zurich initial rent?"_ (Anfangsmietzins)*
  * *"What documents are legally required for my Swiss rental application?"*

---

## 🛠️ Resolving Google Integration Issues (Error 400: `redirect_uri_mismatch`)

Because your development version runs inside a secure Sandbox URL, you may see a Google OAuth configuration mismatch error if your Google Cloud Console registry is outdated.

### How to Fix Google Login Instantly:
1. Copy the exact callback URL suggested in the red warning box inside your application's settings panel. It will look like this:
   `https://zuri-apartment-finder.onrender.com/auth/callback` (or your current Sandbox Domain)
2. Go to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
3. Click your **OAuth 2.0 Web Client-ID**.
4. Scroll to **Authorized redirect URIs (Autorisierte Weiterleitungs-URIs)** and click **Add URI**.
5. Paste your exact workspace callback URL there.
6. Click **Save** (Changes may take up to 60 seconds to propagate).
7. Reload the app and try signing in.

---

## ☁️ How to Update and Deploy Your Code to Render (100% Free)

You can host this full-stack Node.js (Vite + Express) application on **Render** completely for free. Follow these steps to export, update, and deploy:

### Step 1: Export Your Application
1. Open the **Settings Menu** inside the AI Studio code editor (usually in the bottom-left or top-right profile utilities).
2. Select **Export to ZIP** or **Export to GitHub**. We highly recommend exporting to **GitHub** as Render can automatically build and redeploy every time you push new code!

### Step 2: Set Up Your Repository on GitHub
If you exported to a ZIP file, unpack it on your computer, initialize a git repository, and push it to GitHub:
```bash
git init
git add .
git commit -m "Initial commit for Züri Apartment Tracker"
git branch -M main
git remote add origin https://github.com/your-username/zuri-apartment-tracker.git
git push -u origin main
```

### Step 3: Create a Free Web Service on Render
1. Go to [Render.com](https://render.com) and sign in (no credit card is required for free tiers).
2. Click **New +** in the dashboard and select **Web Service**.
3. Link your GitHub account and select your **zuri-apartment-tracker** repository.
4. Configure the service settings precisely:
   * **Name:** `zuri-apartment-finder` (or any custom identifier)
   * **Region:** Select the continent closest to Switzerland or your location (e.g., Frankfurt/EU Central or Zurich if available).
   * **Runtime:** `Node`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm run start` (this runs our built `node dist/server.cjs` bundle containing our Express API)
   * **Instance Type:** `Free` ($0.00/month)

### Step 4: Configure Environment Variables on Render
Click on the **Environment** tab inside your Render Web Service dashboard and insert the necessary secrets:
* `NODE_ENV` 👉 `production`
* `GEMINI_API_KEY` 👉 *Your Gemini API Key from Google AI Studio*

### Step 5: Update Your Deployed Application on Render
Updating your application on Render is incredibly easy and automated:
1. Edit any file on your computer or in AI Studio (e.g., adding a feature, updating styling, etc.).
2. Commit your changes and push them to your GitHub repository:
   ```bash
   git add .
   git commit -m "Added a cool new dashboard card"
   git push origin main
   ```
3. **Automated Re-Deploys:** Render detects the new push on your default branch (`main`) and immediately triggers a fresh, zero-downtime build using `npm run build && npm run start`. 
4. If you have automatic deploys disabled, simply click **"Manual Deploy"** 👉 **"Deploy Latest Commit"** from the Render Web Service console pages anytime.

> 💡 **Free Tier Note:** Render putting your free web service to "sleep" after 15 minutes of inactivity is standard behavior. The server turns off to conserve energy and instantly boots back up within ~50 seconds when a user visits your deployment link!
