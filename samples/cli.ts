import * as cli from "../src/cli";

cli.command("dev", dev);
cli.run();

function dev(){
    console.log("OK");
}
