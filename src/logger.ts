
export interface ILogger {
    log(message: string);
    error(message: string);
    warn(message: string);
}

// class NullLogger implements ILogger {
//     constructor() {
//     }
//
// }
//

function createNullLogger() {
    return {
        log(message: string) {
        },

        error(message: string) {
            console.log("123");
        },

        warn(message: string) {
        },
    };
}

function createLogger() {
    return {
        log: console.log.bind(console, "[bu] INFO"),
        error: console.error.bind(console, "[bu] ERROR"),
        warn: console.warn.bind(console, "[bu] WARN"),
    };
}

export const logger: ILogger = createNullLogger();

export function enableLogging() {
    console.log("enableLogging");

    Object.assign(logger, createLogger());
}
