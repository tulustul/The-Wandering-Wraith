#! /usr/bin/env node

const fs = require("fs");

const prettyBytes = require("pretty-bytes");
const colors = require("colors");

const limit = 13 * 1024;

const size = fs.statSync("dist/bundle.zip").size;

const color = size <= limit ? "green" : "red";
console.log(`Bundle has ${formatBytes(size)}.`[color]);

if (size <= limit) {
  const available = limit - size;
  console.log(`You have ${formatBytes(available)} available.`[color]);
} else {
  const exceeded = size - limit;
  console.error(
    `Bundle size limit is exceeded by ${formatBytes(exceeded)}.`[color],
  );
}

function formatBytes(bytes) {
  const percent = ((bytes / limit) * 100).toFixed(1);
  return `${prettyBytes(bytes)} (${bytes} bytes, ${percent}%)`;
}
