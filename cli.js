const {pack} = require("./build/main");
const cli = require("./src/cli");

cli.command("pack", pack);

cli.run();
