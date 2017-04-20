const commands = {};
let log = null;
let error = null;
enableLogging(true);


class CLIError {
    constructor(public message) {
    }
}

export function command(name, action) {
    commands[name] = {
        name: name,
        action: action,
    };
}

export async function run() {
    try {
        const name = process.argv[2];
        if (!name) {
            throw new CLIError("No command was specified");
        }

        const command = commands[name];
        if (!command) {
            throw new CLIError("Command \"" + name + "\" was not found");
        }

        const args = [];
        for (let i = 3; i < process.argv.length; i++) {
            args.push(process.argv[i]);
        }

        const before = new Date();
        log("Running command \"" + name + "\"");

        await command.action(args);

        const after = new Date();
        log("DONE " + (after.valueOf() - before.valueOf())/1000 + " secs");
    }
    catch(err) {
        if(err instanceof CLIError) {
            log(err.message);
        }
        else {
            error(err);
        }
    }
}

export function enableLogging(enable: boolean) {
    if(enable) {
        log = console.log.bind(console);
        error = console.error.bind(console);
    }
    else {
        log = error = function() {
        }
    }
}
