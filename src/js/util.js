"use strict";

//
// util.js -- Javascript generic utility functions
//

/**
 * Asynchronously load a text file.
 * @param {String} path Path to the file to load.
 * @returns {Promise<String>} Promise object which receives the loaded file
 *                            text on resolve. If an error occurs during the
 *                            request, the Promise is rejected and the reason
 *                            will have the status code and status text of the
 *                            underlying XMLHttpRequest object.
 */
function loadFileTextAsync(path) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", path, true);
        xhr.onload = (e) => {
            if (xhr.status === 200) {
                resolve(xhr.responseText);
            } else {
                reject(`${xhr.status}: ${xhr.statusText}`);
            }
        };
        xhr.onerror = (e) => {
            reject(`${xhr.status}: ${xhr.statusText}`);
        };
        xhr.send(null);
    });
}

/**
 * Asynchronously load a text file.
 * @param {String} path Path to the file to load.
 * @returns {Promise<Blob>} Promise object which receives the loaded file
 *                            file Blob on resolve. If an error occurs during
 *                            the request, the Promise is rejected and the
 *                            reason will have the status code and status text
 *                            of the underlying XMLHttpRequest object.
 */
function loadFileBlobAsync(path) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", path, true);
        xhr.responseType = "blob";
        xhr.onload = (e) => {
            if (xhr.status === 200) {
                resolve(xhr.responseText);
            } else {
                reject(`${xhr.status}: ${xhr.statusText}`);
            }
        };
        xhr.onerror = (e) => {
            reject(`${xhr.status}: ${xhr.statusText}`);
        };
        xhr.send(null);
    });
}

/**
 * Handler for a Promise's reject event that alerts a promise failed and throws
 * the reason.
 * @param {String} reason Reason from Promise reject.
 */
function alertOnReject(reason) {
    alert(`Promise failed: ${reason}`);
    throw `Promise failed: ${reason}`;
}
