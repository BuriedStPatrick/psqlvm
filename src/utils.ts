const ncp = require('ncp').ncp;
const fs = require('fs');
import { Dirent } from "fs";
import { editions } from "./editions";
import { baseInstallDir } from "./paths";
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

export enum PathType {
    File,
    Directory,
    Symlink
}

export interface PathInfo {
    absolutePath: string;
    relativePath: string;
    name: string;
    type: PathType
}

export interface FileInfo extends PathInfo {
    type: PathType.File;
}

export async function getAllFiles(rootPath: string): Promise<FileInfo[]> {
    const stack: PathInfo[] = [];
    const files: FileInfo[] = [];

    stack.push({
        absolutePath: path.resolve(rootPath),
        relativePath: path.relative(rootPath, rootPath),
        name: path.basename(path.dirname(rootPath)),
        type: PathType.Directory
    } as PathInfo);

    while(stack.length) {
        const current = stack.pop() as PathInfo;
        const children = (await fs.promises.readdir(current.absolutePath, { withFileTypes: true }));

        // Add files to the result
        children
            .filter((c: Dirent) => c.isFile())
            .forEach((c: Dirent) => files.push({
                absolutePath: path.join(current.absolutePath, c.name),
                relativePath: path.relative(rootPath, path.resolve(path.join(current.absolutePath, c.name))),
                name: c.name,
                type: PathType.File
            }));

        // Push sub-directories onto the stack
        children
            .filter((p: Dirent) => p.isDirectory())
            .forEach((p: Dirent) => stack.push({
                absolutePath: path.resolve(path.join(current.absolutePath, p.name)),
                relativePath: path.relative(rootPath, path.resolve(path.join(current.absolutePath, p.name))),
                name: p.name,
                type: PathType.Directory
            }));
    }

    return files;
}

export async function getInstalledEditions(): Promise<PathInfo[]> {
    return (await fs.promises.readdir(baseInstallDir, { withFileTypes: true }))
        .filter((p: Dirent) => p.isDirectory() && editions.includes(p.name))
        .map((p: Dirent) => ({
            name: p.name,
            type: PathType.Directory,
            absolutePath: path.resolve(path.join(baseInstallDir, p.name)),
            relativePath: path.relative(baseInstallDir, path.resolve(path.join(baseInstallDir, p.name)))
        } as PathInfo));
}