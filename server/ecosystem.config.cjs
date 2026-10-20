/**
 * PM2 ecosystem config for the Osito a la carta server.
 *
 * Start: pm2 start ecosystem.config.cjs --env production
 * Stop:  pm2 stop osito-server
 * Delete: pm2 delete osito-server
 * Logs:  pm2 logs osito-server
 */
module.exports = {
  apps: [
    {
      name: 'osito-server',
      script: 'dist/server/src/app.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
