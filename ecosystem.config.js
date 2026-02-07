module.exports = {
    apps: [
        {
            name: 'osgb-builder',
            script: 'npm',
            args: 'run start -- -p 3001',
            instances: 'max',
            exec_mode: 'cluster',
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3001
            }
        }
    ]
};
