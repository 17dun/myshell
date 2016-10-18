'use strict'
const rpc = require('../rpc');
const inquirer = require('inquirer');
const phiyo = require('../phiyo');
const spawn = require('child_process').spawnSync;
const phisay = require('../phisay');
const resolver = require('../phiyo/resolver');

module.exports = {
    start: function(){
        var me = this;
        phisay.cow('输入信息,然后喝杯咖啡,一切帮您一键搞定..');
        rpc.getSuitList().then(function(res){
            //var suitChoose = res.data.map(function(item){
            //    return item.name;
            //})
            var questions = [
                {
                    type: 'input',
                    name: 'name',
                    message: '输入项目名称'
                },
                {
                    type: 'list',
                    name: 'suite',
                    message: '选择基于的工程套件',
                    choices: ['velocity', 'smarty']
                },
                {
                    type: 'list',
                    name: 'back',
                    message: '请选择后端的对接方案',
                    choices: ['velocity', 'smarty']
                }
            ]
            inquirer.prompt(questions).then(function(as){
                me.installSuit('@nfe/phi');
            }).catch(function(e){
                console.log(e);
            });
        }).catch(function(e){
            console.log(e);
        });
    },

    installSuit: function(namespace){
        this.checkGen(namespace);
        console.log('实例化套件');
        var env = phiyo.createEnv();
        env.lookup(function (a) {
            console.log(a);
            env.run(namespace, {'skip-install': true}, function (err) {
                console.log('done');
            });
        });
    },

    checkGen: function(namespace){
        resolver.lookup(function)
        console.log('检查是否脚手架存在');
        try{
            require(namespace);
            console.log(namespace+'存在');
        }catch(e){
            console.log(namespace+'不存在');
        }
    },

    installGen: function(name){
        console.log('拉取套间脚手架');
        spawn('npm', ['i','-g', name,'--registry=https://registry.npm.taobao.org'],{
            stdio: 'inherit'});

    }
}