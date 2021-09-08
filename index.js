#!/usr/bin/env node

/**
 * This file is just a shim that redirects programs such as nodemon to the proper sequence of build->run
 * It is also executed when the user types in `node .` on the current directory
 */

const { exec } = require('child_process');

// Creates main process wrapper
const main = exec('npm start', () => {
  // Exits when execution stops
  process.exit(main.exitCode);
});

// Routes stdin, stdout and stderr
process.stdin.pipe(main.stdin);
main.stdout.pipe(process.stdout);
main.stderr.pipe(process.stderr);