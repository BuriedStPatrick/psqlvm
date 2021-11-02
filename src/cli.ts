#!/usr/bin/env node
require = require('esm')(module /*, options */);

import chalk from 'chalk';
import yargs, { Argv, CommandModule } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { editions, binaryDirs } from './editions';
import { downloadEdition, extractEdition, installEditionBuildFiles, buildEdition, getEditionInstallDir } from './install';
import { copy } from './utils';
const inquirer = require('inquirer');
const fs = require('fs');

const homeDir = process.env.HOME ?? process.env.USERPROFILE;
const binDir = `${homeDir}/.psqlvm`

export const useCommand: CommandModule = {
    command: 'use [edition]',
    describe: 'Use a specific edition',
    aliases: ['u'],
    handler: async (args: any) => {
        const edition = args.edition ?? (await inquirer.prompt({
            type: 'list',
            name: 'edition',
            message: 'Pick an edition',
            choices: editions
        })).edition;

        console.log(chalk.blue(`[${edition}]`) + chalk.white(' Switching...'));

        if (!fs.existsSync(binDir)) {
            fs.mkdirSync(binDir, {
                recursive: true
            });
        }

        const editionDir = getEditionInstallDir(edition);

        binaryDirs.forEach(binaryDir => {
            binaryDir.binaries.forEach(async (binary) => {
                console.log(`[${chalk.cyan('SWITCH')}] ${binary} => ${edition}`);
                try {
                    await copy(`${editionDir}/src/bin/${binaryDir.name}/${binary}`, `${binDir}/${binary}`);
                } catch (e) {
                    console.error(e);
                }
            });
        });

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

export async function main(args: string[]) {
    try {
        await yargs(hideBin(args))
            .command(useCommand)
            .command(installCommand)
            .argv;
    } catch (err: any) {
        console.error(err);
        process.exit(1);
    }
}

main(process.argv);
