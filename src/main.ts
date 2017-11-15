import {fileExists} from "./fs";
import {logger} from "./logger";

const fs = require("fs");
const path = require("path");
const {isFile} = require("./fs");
const {exec} = require("./process");
const cwd = process.cwd();

run();

async function run() {
    try {
        const locations = [
            "./build",
            "./build/main"
        ];

        let found: string = null;

        for (const location of locations) {
            const tsFile = location + ".ts";

            logger("Looking for build file at " + tsFile).log();

            if (await fileExists(tsFile)) {
                const tsConfigFile = path.join(tsFile, "../tsconfig.json");
                if (await fileExists(tsConfigFile)) {
                    await exec(`node_modules/.bin/tsc -p "${tsConfigFile}"`);
                }
                else {
                    await exec(`node_modules/.bin/tsc ${tsFile}`);
                }

                found = location + ".js";
                break;
            }
            else if (await fileExists(location + ".js")) {
                found = location + ".js";
                break;
            }
        }

        if (!found) {
            logger("No build file was found").error();
            return;
        }

        require(path.join(cwd, found));
    }
    catch(e){
        console.error(e);
    }
}
