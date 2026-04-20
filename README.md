# Vows & Views - Wedding Photo Sharing

## 🚀 Getting Started

1. **Supabase Setup**:
   - Create a new project at [supabase.com](https://supabase.com).
   - Go to the **SQL Editor** and paste the contents of `supabase_setup.sql` found in the root of this project.
   - Go to **Storage**, create a public bucket named `photos`.
   - Add the following RLS policy to the `photos` bucket:
     - `Allow public access for SELECT, INSERT, and DELETE`.

2. **Environment Variables**:
   - In AI Studio, add your Supabase credentials to the **Secrets** panel:
     - `VITE_SUPABASE_URL`: Your Supabase Project URL.
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
   - **Important**: The `VITE_` prefix is required for Vite to expose these variables to the frontend.

3. **Admin Access**:
   - To access the Admin Dashboard, append `?admin=true` to your app URL.
   - Example: `https://...asia-east1.run.app?admin=true`

4. **Guest Access**:
   - Guests enter via a unique event link or QR code generated in the Admin Dashboard.
   - Link format: `https://...asia-east1.run.app?event=YOUR_EVENT_ID`

## ✨ Features
- **Luxury Aesthetic**: Sophisticated typography and layout using "Cormorant Garamond".
- **Instant Snap**: Direct camera access for mobile guests.
- **Live Stream**: Real-time gallery updates as photos are uploaded.
- **Admin Control**: Create events, manage limits, and download/delete photos.
