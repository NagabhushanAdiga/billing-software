================================================================================
  BILLING APP — UPLOAD TO CPANEL (billing-mithras)
================================================================================

Your server path: /home/x2lakeig17tn/public_html/billing-mithras

STEP 1 — DELETE OLD NODE.JS APP (if any)
  cPanel → Setup Node.js App → Destroy the broken app
  (PHP version does NOT need Node.js)

STEP 2 — CREATE MYSQL DATABASE
  cPanel → MySQL Databases
  - Create database (note full name e.g. x2lakeig17tn_billing)
  - Create user + password
  - Add user to database → ALL PRIVILEGES

STEP 3 — UPLOAD FILES
  File Manager → public_html → billing-mithras
  Upload & extract billing-cpanel-upload.zip HERE

  Final structure:
    billing-mithras/
      app/
      config/
      database/
      views/
      vendor/
      public/
      .env
      .htaccess

STEP 4 — CONFIGURE .env
  Copy .env.example → .env
  Edit these lines with YOUR values:

    DB_NAME=x2lakeig17tn_YOUR_DB
    DB_USER=x2lakeig17tn_YOUR_USER
    DB_PASS=your_mysql_password
    APP_URL=https://yourdomain.com/billing-mithras/public
    APP_BASE_PATH=/billing-mithras/public
    INITIAL_ADMIN_PASSWORD=your_login_password

STEP 5 — INSTALL DATABASE
  cPanel → Terminal:

    cd ~/public_html/billing-mithras
    php database/install.php

  (No Composer needed — the app includes its own PHP autoloader.)

STEP 6 — OPEN YOUR SITE
  https://yourdomain.com/billing-mithras/public/

  Login: username from INITIAL_ADMIN_USERNAME (default: naga)
         password from INITIAL_ADMIN_PASSWORD in .env

OPTIONAL — Cleaner URL (subdomain)
  Create subdomain billing.yourdomain.com
  Document root: public_html/billing-mithras/public
  Then set in .env:
    APP_URL=https://billing.yourdomain.com
    APP_BASE_PATH=
  (leave APP_BASE_PATH empty)

TROUBLESHOOTING
  500 error → set APP_DEBUG=true in .env, check Errors in cPanel
  DB error  → verify DB_NAME, DB_USER, DB_PASS
  No CSS    → open .../billing-mithras/public/ (not parent folder)

================================================================================
