module.exports = {
  apps: [
    {
      name: 'llmo-report-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '/home/root/virail-report-refined',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/llmo-report-error.log',
      out_file: '/var/log/pm2/llmo-report-out.log',
      log_file: '/var/log/pm2/llmo-report-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      // Health check
      health_check_url: 'http://localhost:3000/',
      health_check_grace_period: 3000,
      // Auto-restart si le processus crash
      kill_timeout: 5000,
      listen_timeout: 8000,
      // Variables d'environnement spécifiques
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      }
    }
  ],

  // Configuration de déploiement
  deploy: {
    production: {
      user: 'root',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:username/virail-report-refined.git',
      path: '/home/root/virail-report-refined',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'ForwardAgent=yes'
    }
  }
}; 