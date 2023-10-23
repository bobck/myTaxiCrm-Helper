module.exports = {
    apps: [{
        name: "myTaxiCrm Helper",
        script: "app.mjs",
        watch: true,
        node_args: '-r dotenv/config'
    }]
}