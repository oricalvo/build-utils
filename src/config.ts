import {readJSONFile, writeJSONFile} from "./fs";
import {deepAssign} from "./object";

export async function updateConfig(path, options, deep = true) {
    const obj = await readJSONFile(path);
    const config = deep ? deepAssign({}, obj, options) : Object.assign({}, obj, options);
    await writeJSONFile(path, config);
}

export async function mergeConfig(source1, source2, dest) {
    const config1 = await readJSONFile(source1);
    const config2 = await readJSONFile(source2);

    const config = deepAssign({}, config1, config2);
    await writeJSONFile(dest, config);
}
