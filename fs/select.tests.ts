import {walk} from "./select";

walk("..")
    //.includeDirs({recursive: false})
    //.include("build/**")
    //.include("fs/**")
    //.filter("*.js")
    //.include("*.js")
    .scan({recursive: false, dirs: true, files: false})
    .exclude("node_modules")
    .exclude(".idea")
    .exclude(".git")
    //.exclude("fs")
    //.exclude("package")
    .scan({files: true})
    .filter("*.js")
    .exclude("*.tests.js")
    .subscribe(file => {
        console.log(file);
    });