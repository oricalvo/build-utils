import {copyFile, copyGlob, deleteDirectory} from "../src/fs";
import {spawn} from "../src/process";
import {logger} from "../src/logger";

export async function pack() {
    logger.log("Creating npm package");

    await deleteDirectory("./src_out");
    await deleteDirectory("./package");

    await spawn("node_modules/.bin/tsc", ["-p", "./src/tsconfig.pack.json"]);
    await copyGlob("./src_out/*.js", "./package", {ignore: "./src_out/*.tests.js"});
    await copyGlob("./src_out/*.d.ts", "./package", {ignore: "./src_out/*.tests.d.ts"});
    await copyGlob("./bin/*.js", "./package/bin");
    await copyFile("./package.json", "package/package.json");
}

export async function patch() {
    await pack();

    await spawn("npm", ["version", "patch"], {
        cwd: "./package",
    });

    await copyFile("readme.md", "package/readme.md");

    await spawn("npm", ["publish"], {
        cwd: "./package",
    });

    await copyFile("package/package.json", "./package.json");
}

export async function link() {
    await spawn("npm", ["link"], {
        cwd: "./package"
    });
}
