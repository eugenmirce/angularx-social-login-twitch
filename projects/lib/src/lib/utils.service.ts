import { HttpHeaders, HttpParams } from "@angular/common/http";

/**
 * Utils Service
 */
export class UtilsService {
    constructor() {
    }

    /**
     * Request construct and retrieve response
     * @param url the request url
     * @param method the method
     * @param headers the headers
     * @param params the parameters
     * @param body the request body
     * @returns response
     */
    public static async sendRequest(url: string, method: string, headers?: HttpHeaders, params?: HttpParams, body?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            if (params) {
                url += `?${params.toString()}`;
            }

            xhr.open(method, url);
            xhr.responseType = 'json';

            if (headers) {
                headers.keys().forEach((header: string) => {
                    xhr.setRequestHeader(header, headers.get(header)!);
                });
            }

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject(new Error(`Request failed with status ${xhr.status}`));
                }
            };

            xhr.onerror = () => {
                reject(new Error('Request failed'));
            };

            xhr.send(JSON.stringify(body));
        });
    }
}