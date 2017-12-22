import {copyGlob, copyFile, deleteDirectory} from "../src/fs";
import {exec} from "../src/process";
import * as path from "path";
import {logger} from "../src/logger";

const folders = {
    package: path.join(__dirname, "../package"),
}

logger.log(folders.package);

export async function pack() {
    logger.log("Creating npm package");

    await deleteDirectory("./build_tmp");
    await deleteDirectory("./package");

    await exec(path.resolve("node_modules/.bin/tsc") + " -p ./build/tsconfig.pack.json");
    await copyGlob("./build_tmp/*.js", "./package");
    await copyGlob("./build_tmp/*.d.ts", "./package");
    await copyGlob("./bin/*.js", "./package/bin");
    await copyFile("./package.json", "package/package.json");
}

export async function patch() {
    await pack();

    await exec("npm version patch", {
        cwd: "./package",
    });

    await copyFile("readme.md", "package/readme.md");

    await exec("npm publish", {
        cwd: "./package",
    });

    await copyFile("package/package.json", "./package.json");
}

export async function link() {
    await exec("npm link", {
        cwd: "./package"
    });
}
