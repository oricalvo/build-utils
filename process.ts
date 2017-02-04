import * as shelljs from "shelljs";
import * as child_process from "child_process";

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

export function exec(command: string, options?) {
    return new Promise(function(resolve, reject) {
        console.log("exec " + command);

        const child = shelljs.exec(command, options, function(code, stdout, stderr) {
            if(code != 0) {
                console.log(stderr);
                reject(new Error("Shell command \"" + command + "\" failed with error code: " + code));
            }
            else {
                resolve();
            }
        });
    });
}
