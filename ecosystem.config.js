module.exports = {
  apps: [
    {
      name: 'myTaxiCrm Helper',
      script: 'app.mjs',
      watch: false,
      node_args: '-r dotenv/config',
    },
  ],
};
