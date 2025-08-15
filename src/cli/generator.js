#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class CodeGenerator {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.templates = {
      model: this.getModelTemplate(),
      repository: this.getRepositoryTemplate(),
      service: this.getServiceTemplate(),
      controller: this.getControllerTemplate(),
      route: this.getRouteTemplate(),
      validator: this.getValidatorTemplate()
    };
  }

  async generate() {
    try {
      console.log('🚀 商城API代码生成器');
      console.log('=====================================');
      
      const config = await this.getConfig();
      await this.generateFiles(config);
      
      console.log('\n✅ 代码生成完成！');
      console.log('\n📝 下一步操作：');
      console.log(`1. 在 src/models/index.js 中添加模型关联`);
      console.log(`2. 在 src/app.js 中注册路由`);
      console.log(`3. 运行数据库迁移创建表结构`);
      console.log(`4. 测试生成的API接口`);
      
    } catch (error) {
      console.error('❌ 生成失败:', error.message);
    } finally {
      this.rl.close();
    }
  }

  async getConfig() {
    const config = {};
    
    config.name = await this.question('请输入模块名称 (如: Article): ');
    if (!config.name) {
      throw new Error('模块名称不能为空');
    }
    
    config.tableName = await this.question(`请输入表名 (默认: ${config.name.toLowerCase()}s): `) || `${config.name.toLowerCase()}s`;
    config.description = await this.question('请输入模块描述 (如: 文章管理): ') || `${config.name}管理`;
    
    // 字段配置
    console.log('\n📋 配置字段信息 (输入空行结束):');
    config.fields = [];
    
    while (true) {
      const fieldName = await this.question('字段名称: ');
      if (!fieldName) break;
      
      const fieldType = await this.question('字段类型 (STRING/INTEGER/TEXT/BOOLEAN/DATE): ') || 'STRING';
      const required = await this.question('是否必填 (y/n): ') === 'y';
      const unique = await this.question('是否唯一 (y/n): ') === 'y';
      const comment = await this.question('字段描述: ') || '';
      
      config.fields.push({
        name: fieldName,
        type: fieldType,
        required,
        unique,
        comment
      });
    }
    
    // 权限配置
    const needPermission = await this.question('是否需要权限控制 (y/n): ') === 'y';
    config.permissions = needPermission ? [
      `${config.name.toLowerCase()}:list`,
      `${config.name.toLowerCase()}:view`,
      `${config.name.toLowerCase()}:create`,
      `${config.name.toLowerCase()}:update`,
      `${config.name.toLowerCase()}:delete`
    ] : [];
    
    return config;
  }

  async generateFiles(config) {
    const files = [
      { type: 'model', path: `src/models/${config.name}.js` },
      { type: 'repository', path: `src/repositories/${config.name}Repository.js` },
      { type: 'service', path: `src/services/${config.name}Service.js` },
      { type: 'controller', path: `src/controllers/${config.name}Controller.js` },
      { type: 'route', path: `src/routes/${config.name.toLowerCase()}.js` },
      { type: 'validator', path: `src/utils/validators/${config.name.toLowerCase()}.js` }
    ];
    
    for (const file of files) {
      const content = this.generateFileContent(file.type, config);
      await this.writeFile(file.path, content);
      console.log(`✅ 生成: ${file.path}`);
    }
  }

  generateFileContent(type, config) {
    const template = this.templates[type];
    return template
      .replace(/\{\{name\}\}/g, config.name)
      .replace(/\{\{lowerName\}\}/g, config.name.toLowerCase())
      .replace(/\{\{tableName\}\}/g, config.tableName)
      .replace(/\{\{description\}\}/g, config.description)
      .replace(/\{\{fields\}\}/g, this.generateFields(config.fields))
      .replace(/\{\{validatorFields\}\}/g, this.generateValidatorFields(config.fields))
      .replace(/\{\{permissions\}\}/g, this.generatePermissions(config.permissions))
      .replace(/\{\{repositoryMethods\}\}/g, this.generateRepositoryMethods(config))
      .replace(/\{\{serviceMethods\}\}/g, this.generateServiceMethods(config))
      .replace(/\{\{controllerMethods\}\}/g, this.generateControllerMethods(config));
  }

  generateFields(fields) {
    if (!fields || fields.length === 0) {
      return `  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '内容'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    comment: '状态'
  }`;
    }
    
    return fields.map(field => {
      const typeMap = {
        'STRING': 'DataTypes.STRING(255)',
        'INTEGER': 'DataTypes.INTEGER',
        'TEXT': 'DataTypes.TEXT',
        'BOOLEAN': 'DataTypes.BOOLEAN',
        'DATE': 'DataTypes.DATE'
      };
      
      return `  ${field.name}: {
    type: ${typeMap[field.type] || 'DataTypes.STRING(255)'},
    allowNull: ${!field.required},${field.unique ? '\n    unique: true,' : ''}${field.comment ? `\n    comment: '${field.comment}'` : ''}
  }`;
    }).join(',\n');
  }

  generateValidatorFields(fields) {
    if (!fields || fields.length === 0) {
      return `    title: Joi.string().min(1).max(200).required(),
    content: Joi.string().optional(),
    status: Joi.string().valid('active', 'inactive').optional()`;
    }
    
    return fields.map(field => {
      const typeMap = {
        'STRING': 'Joi.string()',
        'INTEGER': 'Joi.number().integer()',
        'TEXT': 'Joi.string()',
        'BOOLEAN': 'Joi.boolean()',
        'DATE': 'Joi.date().iso()'
      };
      
      let validation = typeMap[field.type] || 'Joi.string()';
      if (field.required) {
        validation += '.required()';
      } else {
        validation += '.optional()';
      }
      
      return `    ${field.name}: ${validation}`;
    }).join(',\n');
  }

  generatePermissions(permissions) {
    if (!permissions || permissions.length === 0) {
      return '';
    }
    
    return permissions.map(perm => `'${perm}'`).join(', ');
  }

  generateRepositoryMethods(config) {
    return `  async findAll(options = {}) {
    const { page = 1, limit = 10, search, status } = options;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: \`%\${search}%\` } }
      ];
    }
    if (status) {
      where.status = status;
    }

    return await ${config.name}.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
  }`;
  }

  generateServiceMethods(config) {
    return `  async get${config.name}s(options = {}) {
    return await ${config.name}Repository.findAll(options);
  }

  async get${config.name}ById(id) {
    const ${config.name.toLowerCase()} = await ${config.name}Repository.findById(id);
    if (!${config.name.toLowerCase()}) {
      throw new Error('${config.description}不存在');
    }
    return ${config.name.toLowerCase()};
  }

  async create${config.name}(${config.name.toLowerCase()}Data) {
    return await ${config.name}Repository.create(${config.name.toLowerCase()}Data);
  }

  async update${config.name}(id, updateData) {
    const ${config.name.toLowerCase()} = await ${config.name}Repository.update(id, updateData);
    if (!${config.name.toLowerCase()}) {
      throw new Error('${config.description}不存在');
    }
    return ${config.name.toLowerCase()};
  }

  async delete${config.name}(id) {
    const result = await ${config.name}Repository.delete(id);
    if (!result) {
      throw new Error('${config.description}不存在');
    }
    return result;
  }`;
  }

  generateControllerMethods(config) {
    return `  async get${config.name}s(ctx) {
    try {
      const { page, limit, search, status } = ctx.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        status
      };
      
      const result = await ${config.name}Service.get${config.name}s(options);
      Response.page(ctx, result.rows, result.count, options.page, options.limit, "获取${config.description}列表成功");
    } catch (err) {
      logger.logError(ctx, err, '获取${config.description}列表失败');
      Response.error(ctx, err.message, -1, 500);
    }
  }

  async get${config.name}ById(ctx) {
    try {
      const { id } = ctx.params;
      const ${config.name.toLowerCase()} = await ${config.name}Service.get${config.name}ById(parseInt(id));
      Response.success(ctx, ${config.name.toLowerCase()}, "获取${config.description}详情成功");
    } catch (err) {
      logger.logError(ctx, err, '获取${config.description}详情失败');
      Response.error(ctx, err.message, -1, 404);
    }
  }

  async create${config.name}(ctx) {
    try {
      const ${config.name.toLowerCase()} = await ${config.name}Service.create${config.name}(ctx.request.body);
      logger.logBusiness('创建${config.description}', { ${config.name.toLowerCase()}Id: ${config.name.toLowerCase()}.id });
      Response.success(ctx, ${config.name.toLowerCase()}, "创建${config.description}成功");
    } catch (err) {
      logger.logError(ctx, err, '创建${config.description}失败');
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async update${config.name}(ctx) {
    try {
      const { id } = ctx.params;
      const ${config.name.toLowerCase()} = await ${config.name}Service.update${config.name}(parseInt(id), ctx.request.body);
      logger.logBusiness('更新${config.description}', { ${config.name.toLowerCase()}Id: id });
      Response.success(ctx, ${config.name.toLowerCase()}, "更新${config.description}成功");
    } catch (err) {
      logger.logError(ctx, err, '更新${config.description}失败');
      Response.error(ctx, err.message, -1, 400);
    }
  }

  async delete${config.name}(ctx) {
    try {
      const { id } = ctx.params;
      await ${config.name}Service.delete${config.name}(parseInt(id));
      logger.logBusiness('删除${config.description}', { ${config.name.toLowerCase()}Id: id });
      Response.success(ctx, null, "${config.description}删除成功");
    } catch (err) {
      logger.logError(ctx, err, '删除${config.description}失败');
      Response.error(ctx, err.message, -1, 400);
    }
  }`;
  }

  getModelTemplate() {
    return `const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const {{name}} = sequelize.define('{{name}}', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
{{fields}}
}, {
  tableName: '{{tableName}}',
  timestamps: true,
  comment: '{{description}}表'
});

module.exports = {{name}};
`;
  }

  getRepositoryTemplate() {
    return `const {{name}} = require('../models/{{name}}');
const { Op } = require('sequelize');

class {{name}}Repository {
  async create({{lowerName}}Data) {
    return await {{name}}.create({{lowerName}}Data);
  }

  async findById(id) {
    return await {{name}}.findByPk(id);
  }

{{repositoryMethods}}

  async update(id, updateData) {
    const {{lowerName}} = await {{name}}.findByPk(id);
    if (!{{lowerName}}) return null;
    return await {{lowerName}}.update(updateData);
  }

  async delete(id) {
    const {{lowerName}} = await {{name}}.findByPk(id);
    if (!{{lowerName}}) return false;
    await {{lowerName}}.destroy();
    return true;
  }

  async count(options = {}) {
    const where = {};
    if (options.status) {
      where.status = options.status;
    }
    return await {{name}}.count({ where });
  }
}

module.exports = new {{name}}Repository();
`;
  }

  getServiceTemplate() {
    return `const {{name}}Repository = require('../repositories/{{name}}Repository');
const logger = require('../utils/logger');

class {{name}}Service {
{{serviceMethods}}
}

module.exports = new {{name}}Service();
`;
  }

  getControllerTemplate() {
    return `const {{name}}Service = require('../services/{{name}}Service');
const Response = require('../utils/response');
const logger = require('../utils/logger');

class {{name}}Controller {
{{controllerMethods}}
}

module.exports = new {{name}}Controller();
`;
  }

  getRouteTemplate() {
    return `const Router = require("@koa/router");
const {{name}}Controller = require("../controllers/{{name}}Controller");
const authMiddleware = require("../middleware/auth");
const { checkPermission } = require("../middleware/permission");
const { createRateLimiter } = require("../middleware/rateLimiter");
const { validateSchema, {{lowerName}}Schemas } = require("../utils/validators/{{lowerName}}");

const router = new Router({
  prefix: "/api/{{lowerName}}s",
});

// 公开路由
router.get("/", 
  validateSchema({{lowerName}}Schemas.query, 'query'), 
  {{name}}Controller.get{{name}}s
);

router.get("/:id", {{name}}Controller.get{{name}}ById);

// 需要认证和权限的路由
router.use(authMiddleware);
router.use(createRateLimiter('admin'));

${this.generateRoutePermissions()}

module.exports = router;
`;
  }

  generateRoutePermissions() {
    return `router.post("/", 
  checkPermission('{{lowerName}}:create'),
  validateSchema({{lowerName}}Schemas.create), 
  {{name}}Controller.create{{name}}
);

router.put("/:id", 
  checkPermission('{{lowerName}}:update'),
  validateSchema({{lowerName}}Schemas.update), 
  {{name}}Controller.update{{name}}
);

router.delete("/:id", 
  checkPermission('{{lowerName}}:delete'),
  {{name}}Controller.delete{{name}}
);`;
  }

  getValidatorTemplate() {
    return `const Joi = require('joi');

const {{lowerName}}Schemas = {
  create: Joi.object({
{{validatorFields}}
  }),
  
  update: Joi.object({
{{validatorFields}}
  }),
  
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().optional(),
    status: Joi.string().valid('active', 'inactive').optional()
  }).unknown(true)
};

module.exports = { {{lowerName}}Schemas };
`;
  }

  async writeFile(filePath, content) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
  }

  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const generator = new CodeGenerator();
  generator.generate();
}

module.exports = CodeGenerator;