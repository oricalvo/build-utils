
export interface ILogger {
    log(message: string);
    error(message: string);
    warn(message: string);
}

export class NullLogger implements ILogger {
    log(message: string) {
    }

    error(message: string) {
    }

    warn(message: string) {
    }
}

export let logger = new NullLogger();

export function enableLogging() {
    logger = {
        log: console.log.bind(console, "[bu]"),
        error: console.error.bind(console, "[bu]"),
        warn: console.warn.bind(console, "[bu]"),
    }
}
