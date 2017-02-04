import {updateConfig} from "./config";

updateConfig("./tsconfig.backup.json", {
    compilerOptions: {
        declaration: true,
    }
});