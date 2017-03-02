const {pack, patch} = require("./build/main");
const cli = require("./src/cli");

cli.command("pack", pack);
cli.command("patch", patch);

cli.run();
