#! /usr/bin/env node
const { execFile } = require("child_process");
const advzip = require("advzip-bin");

execFile(
  advzip,
  ["--recompress", "--shrink-extra", "dist/bundle.zip"],
  err => {
    console.log("ZIP file minified!");
  },
);
