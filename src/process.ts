import * as shelljs from "shelljs";
import * as child_process from "child_process";
import * as path from "path";
import * as shellOpen from "open";
import * as fs from "./fs";
import {logger} from "./logger";
import {ChildProcess} from "child_process";

export function spawn(command, args, options?): Promise<ChildProcess> {
    const opt = {
        stdio: "inherit",
        validateExitCode: true,
        unref: true,
    };

    if(options) {
        Object.assign(opt, options);
    }

    return new Promise((resolve, reject)=> {
        const p = child_process.spawn(command, args, opt);

        p.on("error", function(err) {
            reject(err);
        });

        if(!opt.validateExitCode) {
            if(options.unref) {
                p.unref();
                resolve();
            }else {
                resolve(p);
            }
        }
        else {
            p.on("close", function (code) {
                if (code != 0) {
                    reject(new Error("spawn return error code " + code));
                }
                else {
                    if(opt.unref) {
                        p.unref();
                        resolve();
                    }else {
                        resolve(p);
                    }
                }
            });
        }
    });
}

function fixCommand(command: string) {
    if(process.platform != "win32") {
        return command;
    }

    let index;
    let commandWithoutArgs;
    let args;

    if(command[0]=="\"") {
        index = command.indexOf("\"", 1);
        if(index==-1) {
            throw new Error("Invalid command: " + command);
        }

        commandWithoutArgs = command.substring(0, index + 1);
        args = command.substring(index+2);
    }
    else {
        index = command.indexOf(" ");
        if(index != -1) {
            commandWithoutArgs = command.substring(0, index);
            args = command.substring(index+1);
        }
        else {
            commandWithoutArgs = command;
            args = "";
        }
    }

    commandWithoutArgs = path.normalize(commandWithoutArgs);

    command = commandWithoutArgs + (args ? " " + args : "");
    return command;
}

export function exec(command: string, options?): Promise<any> {
    return new Promise(function(resolve, reject) {
        command = fixCommand(command);
        logger.log("Running command \"" + command + "\"");

        const child = shelljs.exec(command, options, function(code, stdout, stderr) {
            if(code != 0) {
                logger.log(stderr);
                reject(new Error("Shell command \"" + command + "\" failed with error code: " + code));
            }
            else {
                resolve(code);
            }
        });
    });
}

export function open(document) {
    return new Promise(function(resolve, reject) {
        shellOpen(document);

        resolve();
    });
}

export async function nodemon(filePath) {
    if(!await fs.fileExists(filePath)) {
        throw new Error("File does not exist: " + filePath);
    }

    const nodemon = path.join(process.cwd(), "node_modules/.bin/nodemon")
    if(!await fs.fileExists(nodemon)) {
        throw new Error("nodemon was not found at: " + nodemon);
    }

    exec("node_modules/.bin/nodemon " + filePath, {
        async: true
    });
}

export async function runbin(name, args = null) {
    const relPath = "node_modules/.bin/" + name;
    const fullPath = path.join(process.cwd(), relPath)
    if(!await fs.fileExists(fullPath)) {
        throw new Error("tool was not found at: " + fullPath);
    }

    let command = relPath;
    if(args) {
        command += (" " + args);
    }
    return exec(command, {
        async: true
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

    return exec("node_modules/.bin/tsc -p " + tsconfigFilePath, {
        async: true
    });
}
