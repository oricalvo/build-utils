const path = require("path");
const shelljs = require("shelljs");

console.log("Compiling build scripts");
const res = shelljs.exec(path.resolve("node_modules/.bin/tsc"));
if(res.code!=0) {
    console.error("Compilation of build scripts failed");
    return;
}

const cli = require("./src/cli");
const build = require("./build/main");

cli.command("patch", build.patch);
cli.command("pack", build.pack);

cli.run();
