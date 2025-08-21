# 🚀 Lehti Deployment Guide

Quick deployment instructions for getting Lehti running in production.

## Railway Deployment (Recommended)

Railway offers the easiest deployment for Laravel applications with automatic builds and zero-downtime deployments.

### 1. Prepare Repository
```bash
# Ensure your code is committed and pushed to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Railway

**Option A: Web Interface**
1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your Lehti repository
5. Railway will auto-detect Laravel and deploy

**Option B: CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link [your-project-id]
railway up
```

### 3. Configure Environment Variables

In Railway dashboard, add these environment variables:
```
APP_NAME=Lehti
APP_ENV=production
APP_DEBUG=false
APP_KEY=[generate with: php artisan key:generate --show]
APP_URL=https://your-app.railway.app
JWT_SECRET=[your-jwt-secret]
DB_CONNECTION=sqlite
```

### 4. Run Initial Setup

Railway will automatically run migrations, but you can trigger the seeder:
```bash
railway run php artisan db:seed --class=HealthPatternsSeeder
```

## Alternative Platforms

### Render.com
1. Connect GitHub repository
2. Set build command: `composer install --no-dev && php artisan migrate --force`
3. Set start command: `php artisan serve --host=0.0.0.0 --port=$PORT`

### Heroku
1. Install Heroku CLI
2. Create app: `heroku create your-app-name`
3. Add buildpack: `heroku buildpacks:add heroku/php`
4. Deploy: `git push heroku main`

### DigitalOcean App Platform
1. Go to DigitalOcean Apps
2. Connect GitHub repository
3. Configure as PHP app
4. Set run command: `php artisan serve --host=0.0.0.0 --port=$PORT`

## Manual Server Setup

### Requirements
- Ubuntu 20.04+ or similar Linux distro
- PHP 8.2+
- Composer
- Nginx or Apache
- SQLite

### Installation Steps

1. **Install dependencies**
```bash
sudo apt update
sudo apt install php8.2 php8.2-fpm php8.2-sqlite3 php8.2-mbstring php8.2-xml php8.2-curl nginx
```

2. **Clone and setup**
```bash
cd /var/www
sudo git clone https://github.com/yourusername/lehti.git
cd lehti
sudo composer install --no-dev --optimize-autoloader
```

3. **Configure environment**
```bash
sudo cp .env.example .env
sudo php artisan key:generate
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

4. **Setup database**
```bash
sudo touch database/database.sqlite
sudo chown www-data:www-data database/database.sqlite
sudo php artisan migrate --force
sudo php artisan db:seed --class=HealthPatternsSeeder
```

5. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/lehti/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

6. **SSL Certificate (Optional)**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Production Optimization

### Performance
```bash
# Cache everything for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# Enable OPcache in php.ini
opcache.enable=1
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
```

### Security
```bash
# Set proper file permissions
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
chmod -R 775 storage bootstrap/cache
```

### Monitoring
- Set up error tracking (Sentry, Bugsnag)
- Configure log rotation
- Monitor disk space (SQLite database grows over time)
- Set up health checks

## Troubleshooting

### Common Issues

**500 Error on deployment:**
```bash
# Check Laravel logs
tail -f storage/logs/laravel.log

# Regenerate application key
php artisan key:generate --force

# Clear all caches
php artisan optimize:clear
```

**Database permission errors:**
```bash
# Fix SQLite permissions
chmod 664 database/database.sqlite
chmod 775 database/
chown www-data:www-data database/database.sqlite
```

**JWT Secret not set:**
```bash
# Generate JWT secret
php artisan jwt:secret --force
```

## Environment Variables Reference

```env
# App Configuration
APP_NAME=Lehti
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database (SQLite - no additional config needed)
DB_CONNECTION=sqlite

# Authentication
JWT_SECRET=your-jwt-secret-key
JWT_ALGO=HS256

# Cache & Sessions
CACHE_STORE=database
SESSION_DRIVER=database

# Mail (for future features)
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-email
MAIL_PASSWORD=your-password
```

## Post-Deployment Checklist

- [ ] App loads successfully at deployment URL
- [ ] Demo login works (`demo@folia.com` / `password123`)
- [ ] Can create new user accounts
- [ ] Symptom logging functions correctly
- [ ] Treatment logging works with all types
- [ ] Alerts display properly
- [ ] Dashboard shows statistics
- [ ] Mobile responsiveness verified
- [ ] SSL certificate installed (if custom domain)
- [ ] Error monitoring configured
- [ ] Backups scheduled (for SQLite database file)

## Support

If you encounter deployment issues:
1. Check the deployment platform's logs
2. Review Laravel logs in `storage/logs/`
3. Verify all environment variables are set
4. Ensure file permissions are correct
5. Open an issue on GitHub with deployment details

---

**Happy Deploying!** 🚀
