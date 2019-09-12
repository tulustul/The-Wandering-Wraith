#!/usr/bin/env node

const ghpages = require("gh-pages");

ghpages.publish("dist", err => {
  if (err) {
    console.error(`Failed to publish: ${err}`);
  } else {
    console.log("Publishing successfull");
  }
});
