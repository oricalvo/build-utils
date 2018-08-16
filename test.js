const glob = require("glob");

glob("src_out/**/*.js", {
    // dot: false,
    ignore: ["src_out/**/*.tests.js"],
}, function (er, files) {
    console.log(files);
})
