import CaseStrategy from './caseStrategy/index';

module.exports = function() {
  this.bindHook('sub_nav', function(app) {
    app.case_strategy = {
      name: '策略',
      path: '/project/:id/case_strategy',
      component: CaseStrategy
    };
  });
};
