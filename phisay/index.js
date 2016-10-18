'use strict'

const chalk = require('chalk');
const log = console.log;
const cowsay = require("cowsay");
const phiStr =
    '\n  ' + chalk.red(' _______') + '   '+chalk.yellow(' ____  ____') + chalk.green('    _____')+
    '\n  ' + chalk.red('|_   __ \\') + ' '+chalk.yellow(' |_   ||   _|') + chalk.green('  |_   _|')+
    '\n  ' + chalk.red('  | |__) |') + '  '+chalk.yellow(' | |__| |') + chalk.green('      | |')+
    '\n  ' + chalk.red('  |  ___/') + '   '+chalk.yellow(' |  __  |') + chalk.green('      | |')+
    '\n  ' + chalk.red(' _| |_') + '      '+chalk.yellow('_| |  | |_') + chalk.green('    _| |_')+
    '\n  ' + chalk.red('|_____|') + '    '+chalk.yellow('|____||____|') + chalk.green('  |_____|');
var phisay = {
    logo(){
        log(phiStr);
    },
    cow(m){
        log(cowsay.think({
            text : m,
            e: chalk.green.bold("o")+chalk.red.bold('O'),
            T: chalk.red.bold(" U ")
        }));
    },
    msg(m){
        log(chalk.gray(m));
    },
    warn(m){
        log(chalk.yellow(m));
    },
    success(m){
        log(chalk.green(m));
    },
    fail(m){
        log(chalk.red.bgBlack(m))
    }
};
module.exports = phisay;