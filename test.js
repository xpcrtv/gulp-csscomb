/*!
 * gulp-csscomb | https://github.com/koistya/gulp-csscomb
 * Copyright (c) Konstantin Tarkus (@koistya). See LICENSE.txt
 */

/* global describe, it */

"use strict";

const assert = require("assert");
const Vinyl = require("vinyl");
const csscomb = require("./index");

const cssinput = "h1 { color: yellow; } \n h1 { font-size: 2em; }";
const cssoutput =
  "h1\n{\n    color: yellow;\n}\nh1\n{\n    font-size: 2em;\n}\n";

describe("gulp-csscomb", function () {
  it("should format CSS coding style", function (cb) {
    const stream = csscomb();

    stream.once("data", function (file) {
      // make sure it came out the same way it went in
      assert(file.isStream);

      // check the contents
      assert.strictEqual(String(file.contents), cssoutput);

      cb();
    });

    stream.write(
      new Vinyl({
        path: "style.css",
        contents: Buffer.from(cssinput),
      })
    );
  });
});
