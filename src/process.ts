import * as shelljs from "shelljs";
import * as child_process from "child_process";
import * as path from "path";
import * as shellOpen from "open";
import * as fs from "./fs";
import {logger} from "./logger";
import {ChildProcess} from "child_process";
import * as stringArgv from 'string-argv';
import {promisify} from "util";
import {stat as nativeStat} from "fs";
import {fileExists} from "./fs";
const stat = promisify(nativeStat);

export interface SpawnOptions {
    stdio?: "inherit"|"pipe"|"ignore";
    unref?: boolean;
    shell?: boolean;
    wait?: boolean;
    cwd?: string;
    detached?: boolean;

    validateExitCode?: boolean;
    escapeCommand?: boolean
    resolveCommand?: boolean;
    runWithShellForExtensionlessCommandOnWindows?: boolean;
}

export async function run(command, options?: SpawnOptions) {
    const opt: SpawnOptions = {
        stdio: "inherit",
        wait: true,
        validateExitCode: true,
        unref: true,
        runWithShellForExtensionlessCommandOnWindows: true,
    };

    if(options) {
        Object.assign(opt, options);
    }

    const args = stringArgv(command);
    const relativeOrAbsoluteExe = args[0];
    const parsed = path.parse(relativeOrAbsoluteExe);
    let exeFilePath = null;

    if(process.platform == "win32") {
        if(!path.isAbsolute(relativeOrAbsoluteExe) && relativeOrAbsoluteExe.indexOf("/")==-1) {
            //
            //  User specify something like "node"
            //  Keep it
            //
            const bin = path.resolve("node_modules/.bin", relativeOrAbsoluteExe);
            if(await fileExists(bin)) {
                exeFilePath = bin;
            }
            else {
                exeFilePath = relativeOrAbsoluteExe;
            }
        }
        else {
            //
            //  User specify something like "node_modules/.bin/tsc"
            //  Convert it to full path with Windows style backslash
            //
            exeFilePath = path.resolve(relativeOrAbsoluteExe);
        }


        if(!parsed.ext) {
            const exeWithExt = exeFilePath + ".cmd";
            if(await fileExists(exeWithExt)) {
                exeFilePath += ".cmd";
                parsed.ext = ".cmd"
            }
        }

        if((!options || !options.hasOwnProperty("shell")) && parsed.ext == ".cmd") {
            opt.shell = true;
        }

        if(exeFilePath.indexOf(" ")!=-1) {
            exeFilePath = "\"" + exeFilePath + "\"";
        }
    }

    const res = await spawn(exeFilePath, args.slice(1), opt);
    return res;
}

export async function spawn(command, args, options?: SpawnOptions): Promise<ChildProcess> {
    const opt: SpawnOptions = {
        stdio: "inherit",
        validateExitCode: true,
        wait: true,
        escapeCommand: true,
        resolveCommand: true,
        runWithShellForExtensionlessCommandOnWindows: true,
    };

    if(options) {
        Object.assign(opt, options);
    }

    if(!opt.wait) {
        opt.validateExitCode = false;

        if(opt.detached) {
            //
            //  Without changing below flags the caller waits for the termination of sub process
            //
            opt.unref = true;
            opt.stdio = "ignore";
        }
    }

    if(opt.resolveCommand && command.indexOf("/")!=-1) {
        //
        //  Do not resolve global commands such add "npm" or "node"
        //
        command = path.resolve(command);
    }

    if(opt.escapeCommand) {
        if(command.indexOf(" ")!=-1) {
            command = "\"" + command + "\"";
        }
    }

    if(process.platform == "win32" && opt.runWithShellForExtensionlessCommandOnWindows) {
        if(path.extname(command)=="") {
            opt.shell = true;
        }
    }

    const child = await new Promise((resolve, reject)=> {
        const p: ChildProcess = child_process.spawn(command, args, opt);
        let rejected = false;

        p.on("error", function(err) {
            reject(err);
            rejected = true;
        });

        if(!opt.wait) {
            if(opt.unref) {
                p.unref();
                resolve();
                return;
            }

            resolve(p);
            return;
        }

        p.on("close", function (code) {
            if(rejected) {
                return;
            }

            if(opt.validateExitCode) {
                if (code != 0) {
                    //
                    //  In case of error we do not return the child_process
                    //  object so we must unref
                    //
                    p.unref();
                    reject(new Error("spawn return error code " + code));
                    return;
                }
            }

            if(opt.unref) {
                p.unref();
                resolve();
            }else {
                resolve(p);
            }
        });
    });

    return <any>child;
}

export async function nodemon(filePath) {
    if(!await fs.fileExists(filePath)) {
        throw new Error("File does not exist: " + filePath);
    }

    const nodemon = path.join(process.cwd(), "node_modules/.bin/nodemon")
    if(!await fs.fileExists(nodemon)) {
        throw new Error("nodemon was not found at: " + nodemon);
    }

    spawn("node_modules/.bin/nodemon", [filePath], {
        shell: true
    });
}

export async function runbin(name, args?) {
    const relPath = "node_modules/.bin/" + name;
    const fullPath = path.join(process.cwd(), relPath);
    if(!await fs.fileExists(fullPath)) {
        throw new Error("tool was not found at: " + fullPath);
    }

    return spawn(name, args, {
        shell: true
    });
}

export async function tsc(tsconfigFilePath) {
    if(!await fs.fileExists(tsconfigFilePath)) {
        throw new Error("tsconfig.json was not found at: " + tsconfigFilePath);
    }

    const tsc = path.join(process.cwd(), "node_modules/.bin/tsc")
    if(!await fs.fileExists(tsc)) {
        throw new Error("tsc was not found at: " + tsc);
    }

    return spawn("node_modules/.bin/tsc", ["-p", tsconfigFilePath], {
        shell: true,
    });
}
