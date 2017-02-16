import {copyGlob, copyFile} from "../src/fs";
import {exec} from "../src/process";
import * as path from "path";

const folders = {
    package: path.join(__dirname, "../package"),
}

console.log(folders.package);

export async function pack() {
    console.log("Creating npm package");

    await exec(path.resolve("node_modules/.bin/tsc") + " -p ./build/tsconfig.pack.json");
    await copyGlob("./build_tmp/src/*.js", "./package");
    await copyGlob("./build_tmp/src/*.d.ts", "./package");
    await copyGlob("./build_tmp/bin/*.js", "./package/bin");
    await copyFile("./package.json", "package/package.json");
}

export async function patch() {
    await pack();

    await exec("npm version patch", {
        cwd: "./package",
    });

    await copyFile("../readme.md", "package/readme.md");

    await exec("npm publish", {
        cwd: "./package",
    });

    await copyFile("package/package.json", "./package.json");
}
