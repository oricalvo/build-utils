import {searchGlob, excludeFiles, deleteDirectory} from "./fs";

run();

async function run() {
    await searchGlob("*[a-z].ts").then(files => {
        for (let file of files) {
            console.log(file);
        }
    });

    //
    //  Should not throw when directory does not exist
    //
    await deleteDirectory("../asdadas");
}


