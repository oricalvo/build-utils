import * as cli from "build-utils/cli";

cli.command("dev", dev);
cli.run();

function dev(){
    console.log("OK");
}
