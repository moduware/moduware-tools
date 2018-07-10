# Moduware Driver to Markdown converter

A tool for module developers to create markdown file out of their driver. Generated markdown is in [Slate format](https://github.com/lord/slate/wiki/Markdown-Syntax).

## Installation

- Clone or download this repository.
- Run `npm install` or `yarn install` in "driver-to-md-doc" folder

## Usage

**WARNING!** Current release is a preview release and not integrated with main "moduware" cli tool, please call it from root "driver-to-md-doc" folder with `node index.js <args>` command.

```
  Usage: node index.js [options] <driverfile>

  Options:

    -V, --version              output the version number
    -o, --output <outputfile>  Set output file
    -h, --help                 output usage information
```
By default resulting markdown file will be generated in current directory under `driver.md` name. Use `-o <outputfile>` to alter path.

## Using with Slate

Copy resulting markdown file into Slate `source` folder.

Example:
```
$ node index.js ~/drivers/driver.json -o ~/slate/source/driver.html.md
```