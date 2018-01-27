# Shush

[![NPM Version](https://img.shields.io/npm/v/shush-cli.svg)](https://npmjs.org/package/shush-cli)
[![NPM Downloads](https://img.shields.io/npm/dm/shush-cli.svg)](https://npmjs.org/package/shush-cli)
[![Build Status](https://travis-ci.org/wesleytodd/shush-cli.svg?branch=master)](https://travis-ci.org/wesleytodd/shush-cli)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/standard/standard)

Keep secrets from people ;)

## Usage

```
$ npm install shush-cli
$ shush

    Keep secrets protected by a password and strong encryption

    Usage:
      shush secret [<options>]
      shush pack [<options>] --output=<output file> <input files...>
      shush pack [<options>] --output=<output file> -- <input files...>
      shush pack [<options>] <input files...> > <output file>
      shush unpack [<options>] [--output=<output file>] <input file>
      shush unpack [<options>] <input file> <output file>
      shush -v | --version | version
      shush -h | --help | help

    Commands:
      secret    Set the provided secret into a .env file
      pack      Package files into a shush file
      unpack    Unpackage files from inside a shush file
      version   Display version information
      help      Display help information

    Options:
      -h, --help              Display This help text
      -v, --version           Display version
      -c, --cwd=.             Set current working directory
      -l, --logLevel="info"   Set the log level
      -s, --secret=""         Set the secret from the command line
      -o, --output=<path>     Output path for pack and unpack commands
      -i, --input=<paths...>  Input paths for pack and unpack commands
```

## How it works

The `shush` command line tool packages files into an encrypted tarball for safely storing sensitive data or secrets.  
The entries in the tarball are encrypted based on a 512-bit key generated from the secret using `crypto.pbkdf2`, a
process called [key stretching](https://en.wikipedia.org/wiki/Key_stretching).  This key is then used to encrypt the file
contents with a `aes-256-cbc` cipher.  The input file names are also encrypted, although with a shorter generated key.

## Storing your secret

It is not recommended to provide your password on the command line because it will store your password in plain text 
in your history.  So `shush` supports passing the secret as an environment variable, `SHUSH_SECRET`.  If you do not
want to manage setting it in your environment yourself you can use the `shush secret` command to save it into a
`.env` file in the current working directory, which will be loaded when calling `pack` or `unpack`.

## Use cases for this module

### Storing ssh keys

I wrote the module specifically so I could store some ssh keys in a repository and then extract them into a docker
container in which needs them. To do that I run the following:

```
$ shush pack ~/.ssh /path/to/repo/keys.shush
```

In the docker container I add `keys.shush` and the `.env` file, then run `shush unpack keys.shush ~`.

### Keeping secret notes

I also am using `shush` to store some private notes in a git repo.  To get started I do the following:

```
$ mkdir notes && cd notes && git init
$ touch .gitignore && echo "decrypted" > .gitignore
$ mkdir decrypted
$ touch decrypted/private.md && echo "My private note" > decrypted/private.md
$ shush pack decrypted > notes.shush
$ git add . && git commit -m "My first notes"
```

Now I have a repo with a single file called "notes.shush" which contains the encrypted contents of 
my notes directory, but ignores the local and un-encrypted version.  If I don't want a local un-encrypted
version I can just `rm -rf decrypted`.

### Send nudes with netcat ;)

You can pipe the output from one computer, through `netcat`, to another computer.  On the destination
computer, start up `netcat`:

```
$ nc -l localhost 8888 | SHUSH_SECRET=noodz shush unpack -o pics
```

Then on the source computer, with the same secret, you encrypt and pipe the output to the other computer:

```
$ SHUSH_SECRET=noodz shush pack pics | nc localhost 8888
```
