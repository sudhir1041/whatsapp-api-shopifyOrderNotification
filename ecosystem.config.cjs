module.exports = {
  apps: [{
    name: 'zaptool-whatsapp',
    script: 'npm',
    args: 'start',
    cwd: '/home/zaptool/htdocs/zaptool.online',
    instances: 2,
    exec_mode: 'cluster',
    user: 'zaptool',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/zaptool-error.log',
    out_file: '/var/log/pm2/zaptool-out.log',
    log_file: '/var/log/pm2/zaptool.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};