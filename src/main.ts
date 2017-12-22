import {enableLogging, logger} from "./logger";
import {readJSONFile, replaceExt} from "./fs";
import {parseCliArgs} from "./cli";
const fs = require("fs");
const path = require("path");
const {isFile} = require("./fs");
const {exec} = require("./process");
const cwd = process.cwd();

run();

async function run() {
    const args = parseCliArgs();

    if(args.options.hasOwnProperty("log")) {
        enableLogging();
    }

    const mainTs = path.join(cwd, "build/main.ts");
    let foundTsConfig: string = null;
    let foundMainJs: string = null;

    if (await isFile(mainTs)) {
        logger.log("Found build/main.ts at " + mainTs);

        const tsConfigs = [
            path.join(cwd, "build/tsconfig.json"),
            path.join(cwd, "tsconfig.json")
        ];

        for(let tsConfig of tsConfigs) {
            if (await isFile(tsConfig)) {
                foundTsConfig = tsConfig;
                logger.log("Compiling tsconfig.json at " + tsConfig);
                await exec(`node_modules/.bin/tsc -p "${tsConfig}"`);
                const config = await readJSONFile(tsConfig);
                if(config.compilerOptions.outDir) {
                    logger.log("tsc outDir is " + config.compilerOptions.outDir);
                    foundMainJs = path.join(tsConfig, "..", config.compilerOptions.outDir, "main.js");
                }
                else {
                    logger.log("Not tsc outDir was found");
                    foundMainJs = replaceExt(mainTs, "js");
                }
                break;
            }
        }

        if(!foundTsConfig) {
            logger.log("Compiling main.ts at " + mainTs);
            await exec(`node_modules/.bin/tsc ${mainTs}`);
            foundMainJs = path.join(cwd, "build/main.js");
        }
    }

    if (!foundMainJs) {
        logger.error("Main build script was not found");
        return;
    }

    if (!await isFile(foundMainJs)) {
        logger.error("Main build script was not found at " + foundMainJs);
        return;
    }

    logger.log("Loading " + foundMainJs);
    require(foundMainJs);
}
