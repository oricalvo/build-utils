const commands = {};

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
        console.log("Running command \"" + name + "\"");

        await command.action(args);

        const after = new Date();
        console.log("DONE " + (after.valueOf() - before.valueOf())/1000 + " secs");
    }
    catch(err) {
        if(err instanceof CLIError) {
            console.log(err.message);
        }
        else {
            console.error(err);
        }
    }
}
