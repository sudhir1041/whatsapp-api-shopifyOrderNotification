module.exports = {
  apps: [{
    name: 'wanotify',
    script: 'npm',
    args: 'run start',
    cwd: '/home/zaptool/htdocs/zaptool.online',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'file:./prisma/production.sqlite'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};