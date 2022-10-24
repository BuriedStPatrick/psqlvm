#!/usr/bin/env node
require = require('esm')(module /*, options */);

import chalk from 'chalk';
import path from 'path';
import yargs, { Argv, CommandModule } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { editions, binaryDirs } from './editions';
import { downloadEdition, extractEdition, installEditionBuildFiles, buildEdition, removeEdition } from './install';
import { currentUsageDir, getEditionInstallDir } from './paths';
import { copy, getAllFiles, getInstalledEditions } from './utils';
const inquirer = require('inquirer');
const fs = require('fs');

export const useCommand: CommandModule = {
    command: 'use [edition]',
    describe: 'Use a specific edition',
    aliases: ['u'],
    handler: async (args: any) => {
        const installedEditions = await getInstalledEditions();
        const edition = args.edition ?? (await inquirer.prompt({
            type: 'list',
            name: 'edition',
            message: 'Pick an edition',
            choices: installedEditions
        })).edition;

        console.log(chalk.blue(`[${edition}]`) + chalk.white(' Switching...'));

        if (!fs.existsSync(currentUsageDir)) {
            await fs.promises.mkdir(currentUsageDir, {
                recursive: true
            });
        } else {
            // Clear bin directory
            for (const file of await fs.promises.readdir(currentUsageDir)) {
                console.log(`deleting ${file}`);
                await fs.promises.unlink(path.join(currentUsageDir, file));
            }
        }

        const editionDir = getEditionInstallDir(edition);

        (await getAllFiles(path.join(editionDir, 'src', 'bin'))).forEach(async binary => {
            try {
                console.log(binary);

                await fs.promises.symlink(
                    binary.absolutePath,
                    path.join(currentUsageDir, binary.name),
                    'file');
            } catch(e) {
                console.error(e);
            }
        });

        // binaryDirs.forEach(binaryDir => {
        //     binaryDir.binaries.forEach(async (binary) => {
        //         console.log(`[${chalk.cyan('SWITCH')}] ${binary} => ${edition}`);
        //         const binaryPath = `${binDir}/${binary}`;
        //         const binaryTargetPath = `${editionDir}/src/bin/${binaryDir.name}/${binary}`;

        //         try {
        //             await fs.promises.symlink(binaryTargetPath, binaryPath, 'file');
        //         } catch (e) {
        //             console.error(e);
        //         }
        //     });
        // });

        console.log(chalk.blue(`[${edition}]`) + chalk.green(` Switched to ${edition}`));
    },
    builder: async (yargs: Argv) =>
        yargs.option('edition', {
            alias: 'e',
            description: 'The version of PostgreSQL'
        })
}

export const installCommand: CommandModule = {
    command: 'install [edition]',
    describe: 'Install a specific edition',
    aliases: ['i'],
    handler: async (args: any) => {
        const edition = args.edition ?? (await inquirer.prompt({
            type: 'list',
            name: 'edition',
            message: 'Pick an edition',
            choices: editions
        })).edition;

        console.log(chalk.blue(`[${edition}]`) + chalk.white(' Downloading...'));
        await downloadEdition(edition);

        console.log(chalk.blue(`[${edition}]`) + chalk.white(' Extracting build files...'));
        await extractEdition(edition);

        console.log(chalk.blue(`[${edition}]`) + chalk.white(' Installing build files...'));
        await installEditionBuildFiles(edition);

        console.log(chalk.blue(`[${edition}]`) + chalk.white(' Building...'));
        await buildEdition(edition);

        console.log(chalk.blue(`[${edition}]`) + chalk.green(' DONE'))
    },
    builder: async (yargs: Argv) =>
        yargs.option('edition', {
            alias: 'e',
            description: 'The version of PostgreSQL'
        })
}

export const cleanCommand: CommandModule = {
    command: 'clean [edition]',
    describe: 'Remove installed edition',
    aliases: 'c',
    handler: async (args: any) => {
        const installedEditions = await getInstalledEditions();
        let edition = args.edition ?? (await inquirer.prompt({
            type: 'list',
            name: 'edition',
            message: 'Pick an installed edition',
            choices: installedEditions
        }))?.edition;

        if (!installedEditions.includes(edition)) {
            throw new Error(`Edition '${edition}' not among installed editions!`);
        }

        if (!edition) {
            console.error(chalk.red(` ERR `) + chalk.white(` Edition '${edition}' is invalid!`));
            return;
        }

        await removeEdition(edition.edition);
    },
    builder: async (yargs: Argv) =>
        yargs.option('edition', {
            alias: 'e',
            description: 'The installed edition to remove'
        })
}

export async function main(args: string[]) {
    try {
        await yargs(hideBin(args))
            .command(useCommand)
            .command(installCommand)
            .command(cleanCommand)
            .argv;
    } catch (err: any) {
        console.error(err);
        process.exit(1);
    }
}

main(process.argv);
