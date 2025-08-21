#!/bin/bash

echo "🚀 Preparing Lehti for deployment..."

# Generate production application key if not set
if [ -z "$APP_KEY" ]; then
    echo "Generating application key..."
    php artisan key:generate --force
fi

# Run database migrations
echo "Running database migrations..."
php artisan migrate --force

# Seed the database with sample data
echo "Seeding database with health patterns..."
php artisan db:seed --class=HealthPatternsSeeder --force

# Cache configuration for production
echo "Optimizing for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set proper permissions
echo "Setting file permissions..."
chmod -R 775 storage bootstrap/cache

echo "✅ Deployment preparation complete!"
