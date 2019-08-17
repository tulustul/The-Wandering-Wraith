#! /usr/bin/env node

const fs = require("fs");

const prettyBytes = require("pretty-bytes");
var colors = require("colors");

const limit = 13 * 1024;

const size = fs.statSync("dist/bundle.zip").size;

const color = size < limit ? "green" : "red";
console.log(`Bundle has ${prettyBytes(size)}.`[color]);

if (size < limit) {
  const available = limit - size;
  console.log(
    `You have ${prettyBytes(available)} (${available} bytes) available.`[
      color
    ],
  );
} else {
  const exceeded = size - limit;
  console.error(
    `Bundle size limit is exceeded by ${prettyBytes(
      exceeded,
    )} (${exceeded} bytes).`[color],
  );
}
