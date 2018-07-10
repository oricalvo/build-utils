const {spawn} = require("build-utils/process");

spawn("node", [
    "main.js"
], {
    wait: false,
    detached: true,
    shell: true,
});
