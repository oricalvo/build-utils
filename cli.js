//
//  We assume manual build of src folder
//
const {spawn}  = require("./src_out/process");

//
//  This code should be copied from cli.ts and is used as a test
//
async function delegate() {
    try {
        console.log("cli " + process.argv.slice(2).join(""));

        console.log("Compiling build scripts");
        await spawn("node_modules/.bin/tsc", ["-p", "./build/tsconfig.json"], {
            shell: true
        });

        const build = require("./build_out/build/main.js");
        const command = process.argv[2];
        if (!command) {
            throw new Error("Missing command to execute");
        }

        const func = build[command];
        if (!func) {
            throw new Error("Exported function " + command + " was not found");
        }

        await func();
    }
    catch(err) {
        console.error(err);
    }
}


delegate();
