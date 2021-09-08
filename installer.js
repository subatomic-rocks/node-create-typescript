#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

// Ignore those files
const IGNORE = [
  path.basename(__filename),
  '.git',
  'dist',
  'node_modules',
  'package.json',
  'package-lock.json',
  'README.md',
];

// Run command as Promise
function run (command) {
  return new Promise((resolve) => {
    exec(command, resolve);
  });
}

// Recursive copy implementation
async function copy (srcPath, dstPath) {
  const srcStat = await fs.stat(srcPath);

  // Skips if file exists
  if (require('fs').existsSync(dstPath)) {
    console.info('Entry exists, ignoring:', dstPath);
    return;
  } else {
    console.info('Copying entry:', dstPath);
  }

  // Handles recursive copy
  if (srcStat.isDirectory()) {
    // Makes corresponding directory
    await fs.mkdir(dstPath);

    // Reads directory data
    const dir = await fs.readdir(srcPath);
    
    // Queues file copy and waits for completion
    await Promise.all(
      dir.map((entryName) => copy(
        path.join(srcPath, entryName),
        path.join(dstPath, entryName),
      ))
    );
  } else {
    // Just copies the file
    await fs.copyFile(srcPath, dstPath);
  }
}

// Main install code
async function main () {
  // Runs standard init
  console.info('Preparing project...');
  await run('npm init --yes');

  // Loads base and user configs
  const configBase = require(path.join(__dirname, 'package.json'));
  const configUser = require(path.join(process.cwd(), 'package.json'));

  // Appends updated values
  configUser.main = configBase.main || configUser.main;
  configUser.scripts = configBase.scripts || {};
  configUser.dependencies = configBase.dependencies || {};
  configUser.devDependencies = configBase.devDependencies || {};
  
  // Saves back new values
  await fs.writeFile(
    path.join(process.cwd(), 'package.json'),
    JSON.stringify(configUser, null, 2)
  );

  // Copies stuff on main directory except this file
  console.info('Copying files...');
  await Promise.all(
    (await fs.readdir(__dirname))
      .filter((entry) => !~IGNORE.indexOf(entry))
      .map((entry) => copy(
        path.join(__dirname, entry),
        path.join(process.cwd(), entry)
      ))
  );

  // Runs NPM install
  console.info('Installing dependencies...');
  await run('npm install');

  // Stop here!
  console.info('Done!');
}

// Runs main function then leave
main().then(process.exit);
