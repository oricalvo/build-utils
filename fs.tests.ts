import {searchGlob, excludeFiles} from "./fs";

searchGlob("*[a-z].ts").then(files => {
    for(let file of files) {
        console.log(file);
    }
});


