/*
  QAVRIN production configuration.

  1. Create a Supabase project.
  2. In Supabase Dashboard → Project Settings → API, copy:
       Project URL
       Publishable key (or the project's anon key if your dashboard still labels it that way)
  3. Paste them below.

  NEVER put a Supabase service_role/secret key in this file or in GitHub.
*/
window.QAVRIN_CONFIG = {
  SUPABASE_URL: "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE",
  SUPABASE_KEY: "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE"
};
