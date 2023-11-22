import { AbstractModule } from 'adapt-authoring-core';
import path from 'path';
import { fileURLToPath } from 'url';

class LogsUIModule extends AbstractModule {
  /** @override */
  async init() {
    const [logger, server] = await this.app.waitForModule('mongodblogger', 'server');
    this.logger = logger;
    this.fileURL = path.resolve(this.rootDir, 'views', 'logs');
    server.root.addRoute({ route: '/logs', handlers: { get: this.render.bind(this) }});
  }
  async render(req, res) {
    if (!req.auth?.isSuper && !req.auth?.scopes?.includes('read:logs')) {
      return res.sendError(this.app.errors.UNAUTHORISED.setData({ method: req.method, url: req.url }))
    }
    const opts = { 
      limit: req.query.limit ?? 100,
      sort: { timestamp: -1 }
    };
    if(req.query.sort) {
      const [attr, dir] = req.query.sort.split(':');
      opts.sort = { [attr]: dir };
    }
    const logs = await this.logger.find({ level: req.query.level || undefined }, {}, opts);
    for (let logIndex = 0; logIndex < logs.length; logIndex++) {
      for (let dataIndex = 0; dataIndex < logs[logIndex].data.length; dataIndex++) {
        if(typeof logs[logIndex].data[dataIndex] === 'object') {
          const data = JSON.stringify(logs[logIndex].data[dataIndex], null, '&nbsp&nbsp').replaceAll('\n', '<br/>');
          logs[logIndex].data[dataIndex] = `<details><summary>Object</summary>${data}</details>`;
        }
      }
    }
    res.render(this.fileURL, { logs });
  }
}

export default LogsUIModule;
