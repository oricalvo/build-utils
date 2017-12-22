import {searchGlob, excludeFiles, deleteDirectory} from "./fs";
import {logger} from "./logger";

run();

async function run() {
    await searchGlob("*[a-z].ts").then(files => {
        for (let file of files) {
            logger.log(file);
        }
    });

    //
    //  Should not throw when directory does not exist
    //
    await deleteDirectory("../asdadas");
}


