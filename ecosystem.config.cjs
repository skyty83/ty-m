// PM2 로 Docker 없이 실행할 때: npm ci && npm run build && pm2 start ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'ty-m',
    script: '.next/standalone/server.js',
    env: { NODE_ENV: 'production', PORT: 3000, HOSTNAME: '0.0.0.0' },
    max_memory_restart: '400M',
  }],
};
