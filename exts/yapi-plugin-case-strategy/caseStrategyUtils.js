const schedule = require('node-schedule');
const openController = require('controllers/open.js');
const projectModel = require('models/project.js');
const moduleModel = require('models/module.js');
const interfaceColModel = require('models/interfaceCol.js');
const strategyModel = require('./caseStrategyModel.js');
const tokenModel = require('models/token.js');
const yapi = require('yapi.js')
const sha = require('sha.js');
// const axios = require('axios');
// const https = require('https');
const { getToken } = require('utils/token');
const jobMap = new Map();
let runAutoCaseList = [];


class syncUtils {

    constructor(ctx) {
        this.ctx = ctx;
        this.openController = yapi.getInst(openController);
        this.syncMode = yapi.getInst(strategyModel);
        this.tokenModel = yapi.getInst(tokenModel);
        this.projectModel = yapi.getInst(projectModel);
        this.moduleModel = yapi.getInst(moduleModel);
        this.interfaceColModel = yapi.getInst(interfaceColModel);
        this.init()
    }

    //初始化定时任务
    async init() {
        runAutoCaseList = [];
        let allSyncJob = await this.syncMode.listAll();
        for (let i = 0, len = allSyncJob.length; i < len; i++) {
            let syncItem = allSyncJob[i];
            if (syncItem.is_open) {
                this.addSyncJob(syncItem._id, syncItem.project_id, syncItem.env_id, syncItem.cron, syncItem.cases, syncItem.uid);
            }
        }
    }

    /**
     * 新增同步任务
     * _id: 策略id
     */
    async addSyncJob(_id, projectId, env_id, cron, cases, uid) {
        // 判断必须条件
        if(!env_id || !cron || !projectId) {
            return;
        }
        // 判断是否有环境
        let envs = await this.projectModel.getByEnv(projectId);
        if(envs) {
          envs = envs.env;
        }
        if(!envs || envs.length === 0) {
            return;
        }
        let envName = '';
        let envSize = envs.length;
        for(let i = 0; i < envSize; i++) {
            let tmp = envs[i];
            if(tmp && tmp._id.toString() === env_id) {
                envName = tmp.name;
                break;
            }
        }
        if(!envName) {
            return;
        }

        let projectToken = await this.getProjectToken(projectId, uid);
        let scheduleItem = schedule.scheduleJob(cron, async () => {
            this.syncInterface(uid, projectId, envName, projectToken, cases);
        });

        //判断是否已经存在这个任务
        let jobItem = jobMap.get(_id);
        if (jobItem) {
            jobItem.cancel();
        }
        jobMap.set(_id, scheduleItem);
    }

    //同步接口
    async syncInterface(uid, projectId, envName, projectToken, cases) {
        //获取项目下的所有的模块
        let moduleList = await this.moduleModel.list(projectId);
        if(!moduleList || moduleList.length === 0) {
            return;
        }
        let moduleSize = moduleList.length;

        //获取项目下的所有测试集
        let caseList = await this.interfaceColModel.list(projectId);

        let ctx = {
          query: {},
          params: {}
        };
        ctx.query.token = projectToken;
        ctx.params = {
          id: '',
          uid: uid,
          token: projectToken,
          mode: 'html',
          email: false,
          download: false,
          project_id: projectId,
          moduleName: ''
        };
        ctx.params['env_' + projectId] = envName;

      if(cases) {
        cases = JSON.parse(cases);
        let date = new Date();
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let hour = date.getHours() + 1;
        let minute = date.getMinutes();
        let second = date.getSeconds();
        let mill = date.getMilliseconds();
        let timestamp = year + '-' + month + '-' + day + '-' + hour + '-' + minute + '-' + second + '-' + mill;

        for(let i = 0; i < moduleSize; i++) {
          let tmpModule = moduleList[i];
          let tmpCase = cases[tmpModule._id];
          if(!tmpCase) {
              tmpCase = {};
          }
          let expList = tmpCase.list;
          let checked = tmpCase.checked;
          if(!expList) {
            expList = [];
          }
          if(!checked) {
            let runCaseList = this.getModuleCases(caseList, tmpModule._id, expList);
            if(runCaseList && runCaseList.length > 0){
              let listSize = runCaseList.length;
              for(let j = 0; j < listSize; j++) {
                ctx.params.id = runCaseList[j]._id;
                ctx.params.moduleName = tmpModule.name;
                ctx.params.timestamp = timestamp;

                runAutoCaseList.push(JSON.parse(JSON.stringify(ctx)));
              }
            }
          }
        }

        let size = runAutoCaseList.length;
        if(size && size > 0) {
          let lastItem = runAutoCaseList[size - 1];
          if(lastItem && lastItem.params) {
            lastItem.params.isLastCase = true;
          }
        }

        this.looperRunAutoTests();
      }

    }

    looperRunAutoTests() {
      if(runAutoCaseList && runAutoCaseList.length > 0) {
        setTimeout(() => {
          this.openController.runAutoTest(runAutoCaseList[0]);
          runAutoCaseList.shift();
          this.looperRunAutoTests();
        }, 15000);
      }
    }


    getModuleCases(caseList, moduleId, exps) {
        if(!exps) {
            exps = [];
        }
        let cases = [];
        let size = caseList.length;
        for(let i = 0; i < size; i++) {
            let tmp = caseList[i];
            if(tmp.module_id === moduleId) {
                if(exps.indexOf(tmp._id) && !this.isBeyondCase(tmp.name)) {
                  cases.push(tmp);
                }
            }
        }

        return cases;
    }

    isBeyondCase(caseName) {
        if(!caseName) {
            return false;
        }
        return caseName.toLowerCase().indexOf('prep') > -1 || caseName.toLowerCase().indexOf('dev') > -1
    }

    getSyncJob(_id) {
        return jobMap.get(_id);
    }

    deleteSyncJob(_id) {
        let jobItem = jobMap.get(_id);
        if (jobItem) {
            jobItem.cancel();
        }
    }

    /**
     * 记录同步日志
     * @param {*} errcode
     * @param {*} syncMode
     * @param {*} moremsg
     * @param {*} uid
     * @param {*} projectId
     */
    saveSyncLog(errcode, syncMode, moremsg, uid, projectId) {
        yapi.commons.saveLog({
            content: '自动同步接口状态:' + (errcode == 0 ? '成功,' : '失败,') + "合并模式:" + this.getSyncModeName(syncMode) + ",更多信息:" + moremsg,
            type: 'project',
            uid: uid,
            username: "自动同步用户",
            typeid: projectId
        });
    }

    /**
     * 获取项目token,因为导入接口需要鉴权.
     * @param {*} project_id 项目id
     * @param {*} uid 用户id
     */
    async getProjectToken(project_id, uid) {
        try {
            let data = await this.tokenModel.get(project_id);
            let token;
            if (!data) {
                let passsalt = yapi.commons.randStr();
                token = sha('sha1')
                    .update(passsalt)
                    .digest('hex')
                    .substr(0, 20);

                await this.tokenModel.save({ project_id, token });
            } else {
                token = data.token;
            }

            token = getToken(token, uid);

            return token;
        } catch (err) {
            return "";
        }
    }

    getUid(uid) {
        return parseInt(uid, 10);
    }

}

module.exports = syncUtils;
