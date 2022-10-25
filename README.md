# psqlvm

psqlvm is a **very** basic PostgreSQL version manager of sorts. TL;DR: It's a tiny CLI that wraps around downloading the source for various PostgreSQL client binaries. It's not rocket science.

It compiles the binaries from source and then places them inside `~/.local/bin/psqlvm`. This is essentially only for my personal use, there are probably better alternatives out there, but I needed something I could quickly debug.

Only tested on Ubuntu (+ WSL) and Arch Linux.

## Pre-requisites

* NodeJS
* NPM
*  Yarn

### Ubuntu

You'll need the [following packages][1] to compile PostgreSQL binaries:

```bash
sudo apt-get install build-essential libreadline-dev zlib1g-dev flex bison libxml2-dev libxslt-dev libssl-dev libxml2-utils xsltproc
```

> TODO: Some of these packages are no longer on Ubuntu but build seems to work regardless.

You'll also need the following package to run PostgreSQL binaries:

```bash
sudo apt-get install libpq-dev
```

### Arch Linux

You'll need the following packages:

```bash
pacman -S base-devel libpqxx
```

[1]: https://wiki.postgresql.org/wiki/Compile_and_Install_from_source_code

## Installation

To install psqlvm, inside this repo, run:

```bash
yarn install
yarn build
npm link
```

This should give you access to `psqlvm`.

Then add `$HOME/.local/bin/psqlvm/current` to your `PATH` environment variable, as this is where the 'current' postgres binary symlinks are placed.

```bash
export PATH=$HOME/.local/bin/psqlvm/current:$PATH
```

## Usage

Once the tool is installed, you can either "Install" or "Use" a version of the PostgreSQL binaries:

```bash
# Format
psqlvm install <version>

# Example: Install v14.0 binaries
psqlvm install "14.0"

# Example: Install and get prompted for possible versions
psqlvm install
```

After installing a version, it still won't be active until you've told psqlvm to actually use it (effectively populating `~/.local/bin/psqlvm/current` with symlinks). Do so:

```bash
# Format
psqlvm use <version>

# Example: Use v14.0 binaries
psqlvm use "14.0"

# Example: Interactively pick an installed edition to use.
psqlvm use
```
