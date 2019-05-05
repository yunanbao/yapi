const yapi = require('yapi.js');
const controller = require('./controller');
const caseStrategyUtils = require('./caseStrategyUtils.js');

module.exports = function() {
  yapi.getInst(caseStrategyUtils);

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
