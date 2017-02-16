#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {isFile} = require("../fs");
const {exec} = require("../process");
const cwd = process.cwd();

async function run() {
    const mainTs = path.join(cwd, "build/main.ts");
    if (await isFile(mainTs)) {
        const tsConfig = path.join(cwd, "build/tsconfig.json");
        if (await isFile(tsConfig)) {
            console.log("Compiling tsconfig.json at " + tsConfig);
            await exec(path.join(cwd, "node_modules/.bin/tsc") + " -p " + tsConfig);
        }
        else {
            console.log("Compiling main.ts at " + mainTs);
            await exec(path.join(cwd, "node_modules/.bin/tsc") + " " + mainTs);
        }
    }

    let mainJs = path.join(cwd, "build/main.js");
    if (!await isFile(mainJs)) {
        console.error("Main build script was not found at " + mainJs);
        return;
    }

    console.log("Loading " + mainJs);
    require(mainJs);
}

run();