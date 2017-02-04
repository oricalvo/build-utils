import {readJSONFile, writeJSONFile} from "./fs";
import {deepAssign} from "./object";

export async function updateConfig(path, options) {
    const obj = await readJSONFile(path);
    const config = deepAssign({}, obj, options);
    await writeJSONFile(path, config);
}
