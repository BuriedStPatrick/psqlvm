const ncp = require('ncp').ncp;
const fs = require('fs');
const path = require('path');

/**
 * @param {string} fromPath
 * @param {string} toPath
 * @return {Promise<void>}
 */
export async function copy(fromPath: string, toPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        ncp(fromPath, toPath, (error: Error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

export async function emptyDir(directory: string) {
    fs.readdir(directory, (err: Error, files: string[]) => {
        if (err) {
            throw err;
        }

        for (const file of files) {
            fs.unlink(path.join(directory, file), (err: Error) => {
                if (err) throw err;
            });
        }
    });
}