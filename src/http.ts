import * as request_ from "request";
import * as Bluebird from "bluebird";
import {http, https} from "follow-redirects";
import * as fs from "fs";
import * as url from "url";

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

export async function download(urlStr, dest) {
    return new Promise(function(resolve, reject) {
        try {
            var urlObj = url.parse(urlStr);
            const get = urlObj.protocol == "http" ? http.get : https.get;

            var file = fs.createWriteStream(dest);
            var request = get(urlStr, function (response) {
                const { statusCode } = response;

                if(statusCode!=200) {
                    reject(new Error("Server returned statusCode " + statusCode));
                }

                response.pipe(file);
                file.on('finish', function () {
                    resolve();
                });
            }).on('error', function (err) { // Handle errors
                fs.unlink(dest); // Delete the file async. (But we don't check the result)
                reject(err);
            });
        }
        catch(err) {
            reject(err);
        }
    });
}
