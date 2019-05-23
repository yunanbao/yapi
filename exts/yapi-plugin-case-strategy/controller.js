const baseController = require('controllers/base.js');
const caseStrategyModel = require('./caseStrategyModel.js');
const projectModel = require('models/project.js');
const strategyUtil = require('./caseStrategyUtils');
const yapi = require('yapi.js');

class strategyController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.Model = yapi.getInst(caseStrategyModel);
    this.projectModel = yapi.getInst(projectModel);
    this.strategyUtil = yapi.getInst(strategyUtil);
  }

  async save(ctx) {
    try {
      let params = ctx.request.body;
      params = yapi.commons.handleParams(params, {
        strategy_name: 'string',
        project_id: 'number',
        uid: 'number'
      });

      if (!params.project_id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
      }
      if (!params.strategy_name) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '名称不能为空'));
      }

      let auth = await this.checkAuth(params.project_id, 'project', 'edit');
      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
      }

      let result = await this.Model.save({
        strategy_name: params.strategy_name,
        project_id: params.project_id,
        uid: params.uid
      });
      let username = this.getUsername();
      yapi.commons.saveLog({
        content: `<a href="/user/profile/${this.getUid()}">${username}</a> 添加了策略 ${params.strategy_name}`,
        type: 'project',
        uid: this.getUid(),
        username: username,
        typeid: params.project_id
      });
      // this.projectModel.up(params.project_id,{up_time: new Date().getTime()}).then();
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  async getStrategyList(ctx) {
    try {
      let id = ctx.query.project_id;
      let project = await this.projectModel.getBaseInfo(id);
      if (project.project_type === 'private') {
        if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
          return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
        }
      }
      let result = await this.Model.list(id);

      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  async upName(ctx) {
    try {
      let params = ctx.request.body;
      params = yapi.commons.handleParams(params, {
        name: 'string',
        id: 'number'
      });

      let result = await this.Model.upName(params.id, params.name);
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  async up(ctx) {
    try {
      let params = ctx.request.body;
      params = yapi.commons.handleParams(params, {
        env_id: 'string',
        cron: 'string',
        cases: 'string',
        _id: 'number'
      });

      if (!params._id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '策略id不能为空'));
      }

      let result = await this.Model.up(params);
      ctx.body = yapi.commons.resReturn(result);

      this.strategyUtil.deleteSyncJob(params._id);
      if(params.is_open){
        this.strategyUtil.addSyncJob(params._id, params.project_id, params.env_id, params.cron, params.cases, params.uid);
      }
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  async del(ctx) {
    try {
      let id = ctx.query.id;
      let result = await this.Model.del(id);
      ctx.body = yapi.commons.resReturn(result);

      this.strategyUtil.deleteSyncJob(id);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }


}

module.exports = strategyController;
