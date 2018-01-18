module.exports = function help () {
  return `
    Keep secrets protected by a password and strong encryption

    Usage:
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
  `
}

module.exports.help = module.exports
