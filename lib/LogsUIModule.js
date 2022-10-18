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
    const opts = { 
      limit: req.query.limit ?? 100,
      sort: { timestamp: -1 }
    };
    if(req.query.sort) {
      const [attr, dir] = req.query.sort.split(':');
      opts.sort = { [attr]: dir };
    }
    res.render(this.fileURL, { logs: await this.logger.find({}, {}, opts) });
  }
}

export default LogsUIModule;