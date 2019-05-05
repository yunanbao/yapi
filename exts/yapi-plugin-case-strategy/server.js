const yapi = require('yapi.js');
const mongoose = require('mongoose');
const controller = require('./controller');

module.exports = function() {
  yapi.connect.then(function() {
    let Col = mongoose.connection.db.collection('wiki');
    Col.createIndex({
      project_id: 1
    });
  });

  this.bindHook('add_router', function(addRouter) {
    addRouter({
      // 新建策略
      controller: controller,
      method: 'post',
      path: 'case_strategy/save',
      action: 'save'
    });
    addRouter({
      // 删除策略
      controller: controller,
      method: 'get',
      path: 'case_strategy/del',
      action: 'del'
    });
    addRouter({
      // 编辑策略名
      controller: controller,
      method: 'post',
      path: 'case_strategy/upName',
      action: 'upName'
    });
    addRouter({
      // 编辑策略
      controller: controller,
      method: 'post',
      path: 'case_strategy/up',
      action: 'up'
    });
    addRouter({
      // 获取策略列表
      controller: controller,
      method: 'get',
      path: 'case_strategy/list',
      action: 'getStrategyList'
    });
  });
};
