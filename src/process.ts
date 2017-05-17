import * as shelljs from "shelljs";
import * as child_process from "child_process";
import * as path from "path";
import * as open from "open";

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

    let commandWithoutArgs;
    let args;

    let index = command.indexOf(" -");
    if(index == -1) {
        index = command.indexOf(" /");
    }

    if(index == -1) {
        commandWithoutArgs = command;
        args = null;
    }
    else {
        commandWithoutArgs = command.substring(0, index);
        args = command.substring(index+2);
    }

    if(commandWithoutArgs.indexOf("/")==-1) {
        return command;
    }

    command = path.resolve(commandWithoutArgs);
    if(command.indexOf(" ")!=-1) {
        command = "\"" + command + "\"";
    }

    if(args) {
        command = command + " " + args;
    }

    return command;
}

export function exec(command: string, options?): Promise<any> {
    return new Promise(function(resolve, reject) {
        command = fixCommand(command);

        console.log("Executing command: " + command);

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
        open(document);

        resolve();
    });
}
