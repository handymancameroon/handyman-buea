/**
 * Handy Man Buea — Configuration Template
 *
 * INSTRUCTIONS:
 * 1. Copy this file to config.js
 * 2. Fill in your actual Supabase credentials
 * 3. NEVER commit config.js to GitHub (it is listed in .gitignore)
 * 4. For production deployment, ensure config.js is present on the server
 *
 * SECURITY NOTES:
 * - SUPABASE_ANON_KEY is a PUBLISHABLE key safe for client-side use.
 * - NEVER put your SUPABASE_SERVICE_ROLE_KEY here.
 * - The ADMIN_EMAIL is optional and used only as a fallback for admin detection.
 *   Primary admin check relies on the is_admin flag in the database.
 */

window.HANDYMAN_CONFIG = {
    // Your Supabase project URL (found in Supabase Dashboard → Settings → API)
    SUPABASE_URL: 'https://your-project.supabase.co',

    // Your Supabase Anon/Publishable Key (found in Supabase Dashboard → Settings → API)
    SUPABASE_ANON_KEY: 'your-anon-key-here',

    // Admin email (optional fallback — primary check is database is_admin flag)
    ADMIN_EMAIL: 'your-admin-email@example.com'
};
