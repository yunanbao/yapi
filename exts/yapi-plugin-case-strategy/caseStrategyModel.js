const yapi = require('yapi.js');
const baseModel = require('models/base.js');

class caseStrategyModel extends baseModel {
  getName() {
    return 'case_strategy';
  }

  getSchema() {
    return {
      project_id: { type: Number, required: true },
      strategy_name: { type: String, required: true},
      is_open: { type: Boolean, default: false },
      env_id: String,
      cron: String,
      before: String,
      cases: String,
      after: String
    };
  }

  save(data) {
    let m = new this.model(data);
    return m.save();
  }

  del(id) {
    return this.model.remove({
      _id: id
    });
  }

  list(project_id) {
    return this.model
      .find({
        project_id: project_id
      })
      .sort({ _id: -1 })
      .exec();
  }

  get(id) {
    return this.model
        .findOne({
          _id: id
        })
        .exec();
  }

  upName(id, name) {
    return this.model.update(
      {
        _id: id
      },
      {
        strategy_name: name
      },
      { runValidators: true }
    );
  }

  up(data) {
    return this.model.update(
        {
          _id: data._id
        },
        {
          is_open: data.is_open,
          cron: data.cron,
          env_id: data.env_id,
          before: data.before,
          cases: data.cases
        },
        { runValidators: true }
    );
  }

  upOpen(id, open) {
    return this.model.update(
        {
          _id: id
        },
        {
          is_open: open
        },
        { runValidators: true }
    );
  }

  upEnv(id, env) {
    return this.model.update(
        {
          _id: id
        },
        {
          env_name: env
        },
        { runValidators: true }
    );
  }

  upBefore(id, before) {
    return this.model.update(
        {
          _id: id
        },
        {
          before: before
        },
        { runValidators: true }
    );
  }

  upCase(id, cases) {
    return this.model.update(
        {
          _id: id
        },
        {
          cases: cases
        },
        { runValidators: true }
    );
  }

  upAfter(id, after) {
    return this.model.update(
        {
          _id: id
        },
        {
          after: after
        },
        { runValidators: true }
    );
  }

}

module.exports = caseStrategyModel;
