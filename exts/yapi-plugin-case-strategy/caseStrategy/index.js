import React, { Component } from 'react';
import {Layout, Button, message, Icon, Input, Modal, Form, Switch, Select, Checkbox} from 'antd';
import { connect } from 'react-redux';
import axios from 'axios';
import PropTypes from 'prop-types';
import './index.scss';

const { Content, Sider } = Layout;
const confirm = Modal.confirm;
const FormItem = Form.Item;
const Option = Select.Option;

// layout
const formItemLayout = {
  labelCol: {
    lg: { span: 5 },
    xs: { span: 24 },
    sm: { span: 24 }
  },
  wrapperCol: {
    lg: { span: 16 },
    xs: { span: 24 },
    sm: { span: 12 }
  },
  className: 'form-item'
};
const tailFormItemLayout = {
  wrapperCol: {
    sm: {
      span: 16,
      offset: 11
    }
  }
};

@connect(
  state => {
    return {
      projectMsg: state.project.currProject
    };
  },
  {}
)

@Form.create()
class CaseStrategy extends Component {
  constructor(props) {
    super(props);
    this.state = {
      strategyList: [],
      envList: [],
      moduleList: [],
      caseList: [],
      currentStrategy: {},
      showEditStrategyModel: false,
      editStrategyName: '',
      editStrategyId: 0
    }
  }

  static propTypes = {
    form: PropTypes.object,
    match: PropTypes.object,
    projectMsg: PropTypes.object
  };

  componentWillMount() {
    //默认每份钟同步一次,取一个随机数
    this.setState({
      random_corn: Math.round(Math.random()*60) + ' * * * * *'
    });
    this.getStrategyList();
    this.getEnvList();
    this.getModuleList();
    this.getCaseList();
  }

  async getCaseList() {
    const project_id = this.props.match.params.id;
    const res = await axios.get('/api/col/list?project_id=' + project_id);
    if (!res.data.errcode) {
      if(!res.data.data) {
        res.data.data = [];
      }
      this.setState({
        caseList: res.data.data
      });
    } else {
      message.error(res.data.errmsg);
    }
  }

  async getModuleList() {
    const project_id = this.props.match.params.id;
    const res = await axios.get('/api/col/module_list?project_id=' + project_id);
    if (!res.data.errcode) {
      if(!res.data.data) {
        res.data.data = [];
      }
      this.setState({
        moduleList: res.data.data
      });
      this.setFieldValue(this.state.currentStrategy);
    } else {
      message.error(res.data.errmsg);
    }
  }

  getEnvList = async () => {
    const currProjectId = this.props.match.params.id;
    await axios.get('/api/project/get?id=' + currProjectId).then(res => {
      if (res.data.errcode === 0) {
        if(!res.data.data || !res.data.data.env) {
          this.setState({
            envList: []
          });
        }else{
          this.setState({
            envList: res.data.data.env
          });
        }
        this.setFieldValue(this.state.currentStrategy);
      } else {
        message.error(res.data.errmsg);
      }
    });
  };

  getStrategyList = async () => {
    const currProjectId = this.props.match.params.id;
    await axios.get('/api/plugin/case_strategy/list?project_id=' + currProjectId).then(res => {
      if (res.data.errcode === 0) {
        if(!res.data.data) {
          res.data.data = [];
        }
        if(res.data.data.length > 0) {
          let cur = JSON.parse(JSON.stringify(res.data.data[0]));
          this.setState({
            currentStrategy: cur
          });
          this.setFieldValue(cur);
        }else{
          this.setState({
            currentStrategy: {}
          });
        }
        this.setState({
          strategyList: res.data.data
        });
      } else {
        message.error(res.data.errmsg);
      }
    });
  };

  strategyNameChanged = (e) => {
    this.setState({
      editStrategyName: e.target.value
    });
  };

  showDelStrategyConfirm = id => {
    let that = this;
    confirm({
      title: '您确认删除此策略',
      content: '温馨提示：策略删除后无法恢复',
      okText: '确认',
      cancelText: '取消',
      async onOk() {
        that.delStrategy(id);
      }
    });
  };

  showEditStrategyModal = (item) => {
    if(item) {
      this.setState({
        editStrategyId: item._id,
        editStrategyName: item.strategy_name
      });
    }
    this.setState({showEditStrategyModel: true});
  };

  hidenEditStrategyModal = () => {
    this.setState({
      showEditStrategyModel: false,
      editStrategyId: 0
    });
  };

  newStrategy = async () => {
    const currProjectId = this.props.match.params.id;
    const uid = this.props.projectMsg.uid;
    let sgy = {
      project_id: currProjectId,
      strategy_name: this.state.editStrategyName,
      uid: uid
    };
    await axios.post('/api/plugin/case_strategy/save', sgy).then(res => {
      if (res.data.errcode === 0) {
        this.hidenEditStrategyModal();
        message.success('新建策略成功');
        this.getStrategyList();
      } else {
        message.error(res.data.errmsg);
      }
    });
  };

  delStrategy = async (id) => {
    await axios.get('/api/plugin/case_strategy/del?id=' + id).then(res => {
      if (res.data.errcode === 0) {
        this.getStrategyList();
      } else {
        message.error(res.data.errmsg);
      }
    });
  };

  editStrategyName = async () => {
    let sgy = {
      id: this.state.editStrategyId,
      name: this.state.editStrategyName
    };
    await axios.post('/api/plugin/case_strategy/upName', sgy).then(res => {
      if (res.data.errcode === 0) {
        this.hidenEditStrategyModal();
        message.success('编辑策略名成功');
        this.getStrategyList();
      } else {
        message.error(res.data.errmsg);
      }
    });
  };

  editStrategy = async (data) => {
    await axios.post('/api/plugin/case_strategy/up', data).then(res => {
      if (res.data.errcode === 0) {
        message.success('编辑策略成功');
        this.getStrategyList();
      } else {
        message.error(res.data.errmsg);
      }
    });
  };

  getOption = (moduleId) => {
    let children = [];
    let size = this.state.caseList.length;
    for (let i = 0; i < size; i++) {
      let item = this.state.caseList[i];

      if(item.module_id === moduleId) {
        if(item.name.toLowerCase().indexOf('prep') === -1) {
          children.push(<Option key={item._id}>{item.name}</Option>);
        }
      }
    }
    return children;
  };

  setFieldValue = (currentStrategy) => {
    if(!currentStrategy || currentStrategy === {}) {
      return;
    }
    let tmpValue = {
      is_open: currentStrategy.is_open,
      env_id: currentStrategy.env_id,
      cron: currentStrategy.cron
    };
    if(!tmpValue.cron) {
      tmpValue.cron = this.state.random_corn;
    }
    if(!tmpValue.env_id) {
      // let size = this.state.envList.length;
      // if(size > 0) {
      //   tmpValue.env_id = this.state.envList[0]._id;
      // }
      // tmpValue.env_id = '请选择';
    }
    let cases = currentStrategy.cases;
    if(cases) {
      cases = JSON.parse(cases);
    }

    let size = this.state.moduleList.length;
    for(let i = 0; i < size; i++) {
      let mod = this.state.moduleList[i];
      tmpValue[mod._id] = [];
      tmpValue['checked' + mod._id] = false;
      if(cases && cases[mod._id]) {
        let res = cases[mod._id];
        tmpValue[mod._id] = res.list;
        tmpValue['checked' + mod._id] = res.checked;
      }
    }

    this.props.form.setFieldsValue(tmpValue);
  };

  handleSubmit = () => {

    this.props.form.validateFields(async (err) => {
      if (!err) {
        const { is_open, env_id, cron } = this.props.form.getFieldsValue();
        let tmpValue = {
          _id: this.state.currentStrategy._id,
          uid: this.state.currentStrategy.uid,
          project_id: this.state.currentStrategy.project_id,
          is_open: is_open,
          env_id: env_id,
          cron: cron
        };

        let size = this.state.moduleList.length;
        let casesObj = {};
        for(let i = 0; i < size; i++) {
          let modId = this.state.moduleList[i]._id;

          let cases = {};
          cases.list = this.props.form.getFieldsValue()[modId];
          cases.checked = this.props.form.getFieldsValue()['checked' + modId];
          casesObj[modId] = cases;
        }

        tmpValue.cases = JSON.stringify(casesObj);

        this.editStrategy(tmpValue);
      }
    });
  };


  render() {
    const { getFieldDecorator } = this.props.form;

    return (
      <Layout style={{ minHeight: 'calc(100vh - 156px)', marginLeft: '24px', marginTop: '34px' }}>
        <Sider style={{ height: '100%' }} width={240}>
          <div className="left-menu">
            <div className="left-menu-top">
              <Button type="primary" className="new-btn" onClick={this.showEditStrategyModal}>
                新建策略
              </Button>
            </div>
            <div className="left-list">
              {
                this.state.strategyList.map((item, index) => (
                  <div key={index} className={item._id === this.state.currentStrategy._id ? "left-list-item left-list-item-selected" : "left-list-item"} onClick={
                    e => {
                      e.stopPropagation();
                      let current = JSON.parse(JSON.stringify(item));
                      this.setState({currentStrategy: current});
                      this.setFieldValue(current);
                    }
                  }>
                    <div>{item.strategy_name}</div>
                    <div className="btns">
                      <Icon
                          type="delete"
                          className="interface-delete-icon"
                          onClick={e => {
                            e.stopPropagation();
                            this.showDelStrategyConfirm(item._id);
                          }}
                      />
                      <Icon
                          type="edit"
                          className="interface-delete-icon"
                          onClick={e => {
                            e.stopPropagation();
                            this.showEditStrategyModal(item);
                          }}
                      />
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </Sider>
        <Layout>
          <Content
                style={{
                  height: '100%',
                  margin: '0 24px 0 16px',
                  overflow: 'initial',
                  backgroundColor: '#fff'
                }}
            >
            <div className="right-content">
              <div style={{height: 40, fontSize: 18}}>STEP1: 策略基本信息</div>
              <Form>
                <FormItem label="开启策略" {...formItemLayout}>
                  {getFieldDecorator('is_open', {
                    valuePropName: 'checked',
                    rules: []})(<Switch
                      checkedChildren="开"
                      unCheckedChildren="关"
                  />)}
                </FormItem>
                <FormItem {...formItemLayout} label={<span>策略运行时间(类cron)&nbsp;<a target="_blank" href="https://blog.csdn.net/shouldnotappearcalm/article/details/89469047">参考</a></span>}>
                  {getFieldDecorator('cron', {
                    rules: [
                      {
                        required: true,
                        message: '请输入类cron表达式!'
                      }
                    ]
                  })(<Input />)}
                </FormItem>
                <FormItem {...formItemLayout} label="策略运行环境">
                  {getFieldDecorator('env_id', {
                    rules: [{ required: true, message: '请选择策略运行环境！' }]
                  })(<Select>
                    {
                      this.state.envList.map((item, index) => (
                        <Option key={index} value={item._id}>{item.name}</Option>
                      ))
                    }
                  </Select>)}
                </FormItem>

                <div style={{height: 40, fontSize: 18, marginTop: 50}}>STEP2: 按模块执行测试集，模块中被选择的测试集将不被执行，勾选全部禁用后，该模块将不被执行</div>
                {
                  this.state.moduleList.map((item, index) => (
                    <FormItem {...formItemLayout} label={item.name} key={index}>
                      {getFieldDecorator("" + item._id, {
                        })(<Select mode="tags">
                          {
                            this.getOption(item._id)
                          }
                        </Select>)}
                      {getFieldDecorator("checked" + item._id, {
                        valuePropName: 'checked'
                      })(<Checkbox>全部禁用</Checkbox>)}
                    </FormItem>

                  ))
                }

                <FormItem {...tailFormItemLayout}>
                  <Button type="primary" htmlType="submit" icon="save" size="large" onClick={this.handleSubmit}>
                    保存
                  </Button>
                </FormItem>
              </Form>
            </div>
          </Content>
        </Layout>
        <Modal
            title={this.state.editStrategyId > 0 ? "编辑策略" : "新建策略"}
            visible={this.state.showEditStrategyModel}
            onOk={this.state.editStrategyId > 0 ? this.editStrategyName : this.newStrategy}
            onCancel={this.hidenEditStrategyModal}
            className="import-case-modal"
            width={400}
        >
          <Input placeholder="请输入策略名" value={this.state.editStrategyName} onChange={this.strategyNameChanged}/>
        </Modal>
      </Layout>
    );
  }
}

export default CaseStrategy;
