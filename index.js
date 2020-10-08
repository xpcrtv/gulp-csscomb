/*!
 * gulp-csscomb | https://github.com/koistya/gulp-csscomb
 * Copyright (c) Konstantin Tarkus (@koistya). See LICENSE.txt
 */

"use strict";

const Comb = require("csscomb");
const fs = require("fs");
const path = require("path");
const PluginError = require("plugin-error");
const fancyLog = require("fancy-log");
const colors = require("ansi-colors");
const { Duplex } = require("stream");

// Constants
const PLUGIN_NAME = "gulp-csscomb";
const SUPPORTED_EXTENSIONS = [".css", ".sass", ".scss", ".less"];

// Plugin level function (dealing with files)
function Plugin(configPath, options) {
  if (arguments.length == 1 && typeof configPath === "object") {
    options = configPath;
    configPath = options.configPath;
  } else if (arguments.length == 2 && typeof options === "boolean") {
    options = { verbose: options }; // for backward compatibility
  }

  options = options || {};
  configPath = configPath || null;

  const verbose = options.verbose || false;
  //const lint = options.lint || false; // TODO: Report about found issues in style sheets

  // Create a stream through which each file will pass
  const stream = new Duplex({
    readableObjectMode: true,
    writableObjectMode: true,
    read: () => {},
    write: function (file, enc, cb) {
      if (file.isNull()) {
        // Do nothing
      } else if (file.isStream()) {
        this.emit(
          "error",
          new PluginError(PLUGIN_NAME, "Streams are not supported!")
        );
        return cb();
      } else if (
        file.isBuffer() &&
        SUPPORTED_EXTENSIONS.indexOf(path.extname(file.path)) !== -1
      ) {
        if (verbose) {
          fancyLog(PLUGIN_NAME, "Processing " + colors.magenta(file.path));
        }

        if (configPath && !fs.existsSync(configPath)) {
          this.emit(
            "error",
            new PluginError(
              PLUGIN_NAME,
              "Configuration file not found: " + colors.magenta(configPath)
            )
          );
          return cb();
        }

        configPath = Comb.getCustomConfigPath(
          configPath || path.join(path.dirname(file.path), ".csscomb.json")
        );
        const config = Comb.getCustomConfig(configPath);

        if (verbose) {
          fancyLog(
            PLUGIN_NAME,
            "Using configuration file " + colors.magenta(configPath)
          );
        }

        const comb = new Comb(config || "csscomb");
        const syntax = options.syntax || file.path.split(".").pop();

        comb
          .processString(file.contents.toString("utf8"), {
            syntax: syntax,
            filename: file.path,
          })
          .then((output) => {
            file.contents = Buffer.from(output);
            // make sure the file goes through the next gulp plugin

            this.push(file);
          })
          .catch((err) => {
            this.emit(
              "error",
              new PluginError(PLUGIN_NAME, file.path + "\n" + err)
            );
          });
      }

      // tell the stream engine that we are done with this file
      return cb();
    },
  });

  // Return the file stream
  return stream;
}

// Export the plugin main function
module.exports = Plugin;
