#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const { run } = require('../lib/index');

run(process.argv).catch(error => {
  process.exitCode = 1;
  console.error(chalk.red(error.stack));
});
