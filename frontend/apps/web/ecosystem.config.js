module.exports = {
  apps: [
    {
      name: 'aiwf-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/home/tutorbuddy/htdocs/tutorbuddy.co/cc/frontend/apps/web',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      log_file: '/home/tutorbuddy/htdocs/tutorbuddy.co/cc/logs/frontend-combined.log',
      out_file: '/home/tutorbuddy/htdocs/tutorbuddy.co/cc/logs/frontend-out.log',
      error_file: '/home/tutorbuddy/htdocs/tutorbuddy.co/cc/logs/frontend-error.log',
      time: true,
      merge_logs: true
    }
  ]
}; 