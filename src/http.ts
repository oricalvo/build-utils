import * as request_ from "request";
import * as Bluebird from "bluebird";
import {writeFile} from "./fs";

const request = Bluebird.promisify(request_);

export function get(url): Promise<{response: any, body: string}> {
    return new Promise(function(resolve, reject) {
        request(url, function (error, response, body) {
            if(error) {
                reject(error);
                return;
            }

            resolve({
                response: response,
                body: body,
            });
        });
    });
}

export async function download(url, saveToPath) {
    const {body} = await get(url);
    console.log(body);
    await writeFile(saveToPath, body, "utf8");
}
