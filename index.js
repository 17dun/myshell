#!/usr/bin/env node
'use strict'

const program = require('commander');
const spawn = require('child_process').spawnSync;
const phisay = require('./phisay');
const pkg = require('./package.json');
const actions = require('./actions');


phisay.logo();

program.version(pkg.version);

program
    .command('creat')
    .description('新建项目')
    .alias('c')
    .action(function(env, options){
        actions['creat'].start();
    });

program
    .command('add')
    .description('新增部件')
    .alias('a')
    .action(function(env, options){
        actions.creat.start();
        phisay.cow('部件包含编写业务的组成部分,再也不需要找代码拷贝修改了');
    });

program
    .command('dev')
    .alias('d')
    .description('开发')
    .action(function(env, options){
        actions.creat.start();
        phisay.cow('开始启动开发环境,热加载帮您配好,直接享受双屏快速开发');
    });

program
    .command('test')
    .alias('t')
    .description('自测')
    .action(function(env, options){
        actions.creat.start();
        phisay.cow('接下来将依次依次进行:单元测试,代码规范检查,xss检测');
    });

program
    .command('build')
    .alias('b')
    .description('编译')
    .action(function(env, options){
        actions.creat.start();
        phisay.cow('只有上一次通过了test才能正式编译哦')
    });

program
    .command('publish')
    .alias('p')
    .description('项目发布')
    .action(function(env, options){
        actions.creat.start();
        phisay.cow('帮你解决复杂的上线流程')
    });

program
    .command('doc')
    .description('查看文档')
    .action(function(env, options){
        actions.creat.start();
        console.log('查看文档');
    });

program.parse(process.argv);