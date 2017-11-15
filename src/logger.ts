import {forArea, ILoggerArea} from "complog";

export const logger: ILoggerArea = forArea("build-utils");

logger.enable(false);

export function enableLogging(enabled: boolean){
    logger.enable(enabled);
}