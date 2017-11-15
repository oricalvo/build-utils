import * as shelljs from "shelljs";
import * as child_process from "child_process";
import * as path from "path";
import * as openLib from "open";
import * as fs from "./fs";
import {logger} from "./logger";

//
//  Spwans a new child process without waiting for it
//  On Windows the child process is opened in its own window
//
export function spawn(command, options?) {
    options = Object.assign({}, options || {}, {
        shell: true,
        detached: true,
        stdio: "ignore",
    });

    return Promise.resolve().then(()=> {
        const child = child_process.spawn(command, [], options);

        //
        //  Detach from child process so the current process can exit while child
        //  is still running
        //
        child.unref();
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

    // let index = command.indexOf(" -");
    // if(index == -1) {
    //     index = command.indexOf(" /");
    // }
    //
    // if(index == -1) {
    //     commandWithoutArgs = command;
    //     args = "";
    // }
    // else {
    //     commandWithoutArgs = command.substring(0, index);
    //     args = command.substring(index + 1);
    // }
    //
    // if(commandWithoutArgs.indexOf(" ")!=-1) {
    //     //
    //     //  Escape command with "command"
    //     //
    //     commandWithoutArgs = "\"" + commandWithoutArgs + "\"";
    // }
    //
    // command = commandWithoutArgs + " " + args;
    // return command;
}

export function exec(command: string, options?): Promise<any> {
    logger("exec " + command).log();

    return new Promise(function(resolve, reject) {
        logger("Original command is \"" + command + "\"").log();

        command = fixCommand(command);
        logger("Fixed command is \"" + command + "\"").log();

        const child = shelljs.exec(command, options, function(code, stdout, stderr) {
            if(code != 0) {
                console.log(stderr);
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
        openLib(document);

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
