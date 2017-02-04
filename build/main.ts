import {copyGlob, copyFile, deleteGlob, deleteDirectory, createDirectory, deleteFile} from "../fs";
import * as cli from "../cli";
import {exec} from "../process";
import * as path from "path";
import {updateConfig} from "../config";

const folders = {
    package: path.join(__dirname, "../package"),
}

console.log(folders.package);

async function pack() {
    console.log("packaging app to");

    console.log("Recreate package folder");
    await deleteDirectory(folders.package);
    await createDirectory(folders.package);

    console.log("Copy all typescript files & configuration");
    await copyGlob("./*.ts", folders.package);
    delete deleteGlob(folders.package + "/*.tests.ts");

    console.log("Updating typescript configuration");
    await copyFile("./tsconfig.json", folders.package + "/tsconfig.json");
    await updateConfig(folders.package + "/tsconfig.json", {
        compilerOptions: {
            declaration: false,
            sourceMap: false,
        }
    });

    console.log("Running typescript compilation");
    await exec(path.resolve("node_modules/.bin/tsc") + " -p " + folders.package);

    console.log("Delete typescript files");
    await deleteGlob(path.join(folders.package, "*.ts"));
    await deleteFile(folders.package + "/tsconfig.json");

    console.log("Copy package.json");
    await copyFile("./package.json", folders.package + "/package.json");
}

async function patch() {
    await pack();

    console.log("increasing version number");
    await exec("npm version patch", {
        cwd: "./package"
    });

    console.log("publishing to npm");
    await exec("npm publish", {
        cwd: "./package"
    });

    console.log("take updated package.json");
    await copyFile(folders.package + "/package.json", "./package.json");
}

cli.command("pack", pack);
cli.command("patch", patch);

cli.run();


