# Production Deployment Guide

1. Provision PHP 8.3+, MySQL 8+, Redis, Node 22+, and a queue/process supervisor.
2. Configure `.env`: `DB_*`, `REDIS_*`, `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`, `SESSION_DRIVER=redis`, `BROADCAST_CONNECTION=reverb`.
3. Install dependencies: `composer install --no-dev --optimize-autoloader` and `cmd /c npm ci`.
4. Build assets: `cmd /c npm run build`.
5. Run `php artisan key:generate`, `php artisan migrate --force`, and `php artisan db:seed --class=RbacSeeder`.
6. Start services: PHP-FPM/IIS/NGINX, `php artisan queue:work redis --queue=printing,default --tries=3`, and `php artisan reverb:start`.
7. Schedule backups, failed-job alerting, queue-depth alerting, audit retention policies, and upload malware scanning.
8. Run `php artisan optimize` after each deploy and rotate application keys only with an active session invalidation plan.
