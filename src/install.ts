import execa from 'execa';
import { Stream } from 'stream';
import { baseInstallDir, downloadDir, getEditionInstallDir, homeDir } from './paths';
import { copy } from './utils';

const { http, https } = require('follow-redirects');
const fs = require('fs');

const baseUrl = `https://ftp.postgresql.org/pub/source`;

/**
* Downloads file from remote HTTP[S] host and puts its contents to the
* specified location.
*/
async function download(url: string, filePath: string) {
    const protocol = !url.charAt(4).localeCompare('s')
        ? https
        : http;

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath) as Stream;
        let fileInfo: any;

        const request = protocol.get(url, (response: any) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }

            fileInfo = {
                mime: response.headers['content-type'],
                size: parseInt(response.headers['content-length'], 10)
            };

            response.pipe(file);
        });

        // The destination stream is ended by the time it's called
        file.on('finish', () => resolve(fileInfo));

        request.on('error', (err: Error) => {
            fs.unlink(filePath, () => reject(err));
        });

        file.on('error', (err: Error) => {
            fs.unlink(filePath, () => reject(err));
        });

        request.end();
    });
}

export async function downloadEdition(edition: string) {
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, {
            recursive: true
        });
    }

    await download(`${baseUrl}/v${edition}/postgresql-${edition}.tar.gz`, `${downloadDir}/postgresql-${edition}.tar.gz`);
}

export async function extractEdition(edition: string) {
    const command = execa('tar', [
        '-xzvf',
        `${downloadDir}/postgresql-${edition}.tar.gz`,
        '-C', `${downloadDir}`
    ]);

    command.stdout?.pipe(process.stdout);
    command.stderr?.pipe(process.stderr);

    await command;
}

export async function installEditionBuildFiles(edition: string): Promise<void> {
    if (!fs.existsSync(baseInstallDir)) {
        fs.mkdirSync(baseInstallDir, {
            recursive: true
        });
    }

    const editionInstallDir = getEditionInstallDir(edition);

    if (fs.existsSync(editionInstallDir)) {
        throw `${edition} already installed. Please uninstall first.`
    }

    fs.mkdirSync(editionInstallDir, { recursive: true });

    await copy(`${downloadDir}/postgresql-${edition}`, editionInstallDir);
}

export async function buildEdition(edition: string): Promise<void> {
    const editionInstallDir = getEditionInstallDir(edition);

    const configureCmd = execa('./configure', [], {
        cwd: editionInstallDir
    });

    configureCmd.stdout?.pipe(process.stdout);
    configureCmd.stderr?.pipe(process.stderr);

    await configureCmd;

    await execa('make', ['-C', 'src/bin'], {
        cwd: editionInstallDir
    });

    await execa('make', ['-C', 'src/include'], {
        cwd: editionInstallDir
    });

    await execa('make', ['-C', 'src/interfaces'], {
        cwd: editionInstallDir
    });
}

export async function removeEdition(edition: string): Promise<void> {
    const editionInstallDir = getEditionInstallDir(edition);

    await fs.promises.rm(editionInstallDir, {
        recursive: true,
        force: true });
}