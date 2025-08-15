const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const fs = require("fs");
const { customKeyRateLimit } = require("../middleware/rateLimiter");
const config = require("../config");
const logger = require("./logger");

// 创建邮件传输器
const transporter = nodemailer.createTransporter({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

// 验证邮件配置
transporter.verify((error, success) => {
  if (error) {
    logger.error('邮件服务配置错误', { error: error.message });
  } else {
    logger.info('邮件服务配置成功');
  }
});

// 邮件模板配置
const EMAIL_TEMPLATES = {
  // 邮箱验证模板
  emailVerification: {
    subject: '邮箱验证 - 商城系统',
    template: 'email-verification.ejs'
  },
  
  // 密码重置模板
  passwordReset: {
    subject: '密码重置 - 商城系统',
    template: 'password-reset.ejs'
  },
  
  // 订单确认模板
  orderConfirmation: {
    subject: '订单确认 - 商城系统',
    template: 'order-confirmation.ejs'
  },
  
  // 订单状态更新模板
  orderStatusUpdate: {
    subject: '订单状态更新 - 商城系统',
    template: 'order-status-update.ejs'
  },
  
  // 欢迎邮件模板
  welcome: {
    subject: '欢迎加入商城系统',
    template: 'welcome.ejs'
  },
  
  // 账户安全提醒模板
  securityAlert: {
    subject: '账户安全提醒 - 商城系统',
    template: 'security-alert.ejs'
  }
};

// 获取模板路径
function getTemplatePath(templateName) {
  return path.join(__dirname, '../templates/email', templateName);
}

// 渲染邮件模板
async function renderTemplate(templateName, data = {}) {
  try {
    const templatePath = getTemplatePath(templateName);
    
    // 检查模板文件是否存在
    if (!fs.existsSync(templatePath)) {
      throw new Error(`邮件模板不存在: ${templateName}`);
    }
    
    // 添加通用数据
    const templateData = {
      ...data,
      siteName: config.siteName || '商城系统',
      siteUrl: config.siteUrl || process.env.BASE_URL || 'http://localhost:3000',
      supportEmail: config.email.supportEmail || config.email.from,
      currentYear: new Date().getFullYear(),
      timestamp: new Date().toLocaleString('zh-CN')
    };
    
    const html = await ejs.renderFile(templatePath, templateData);
    return html;
  } catch (error) {
    logger.error('邮件模板渲染失败', {
      template: templateName,
      error: error.message
    });
    throw error;
  }
}

// 发送邮件基础函数
async function sendMail({ to, subject, html, text, attachments = [] }) {
  try {
    const mailOptions = {
      from: `${config.siteName || '商城系统'} <${config.email.from}>`,
      to,
      subject,
      html,
      text,
      attachments
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    logger.info('邮件发送成功', {
      to,
      subject,
      messageId: result.messageId
    });
    
    return result;
  } catch (error) {
    logger.error('邮件发送失败', {
      to,
      subject,
      error: error.message
    });
    throw error;
  }
}

// 使用模板发送邮件
async function sendTemplateEmail(templateType, to, data = {}) {
  try {
    const template = EMAIL_TEMPLATES[templateType];
    if (!template) {
      throw new Error(`未知的邮件模板类型: ${templateType}`);
    }
    
    const html = await renderTemplate(template.template, data);
    
    return await sendMail({
      to,
      subject: template.subject,
      html
    });
  } catch (error) {
    logger.error('模板邮件发送失败', {
      templateType,
      to,
      error: error.message
    });
    throw error;
  }
}

// 创建邮件限流中间件
const emailRateLimit = customKeyRateLimit('email', (ctx) => ctx.email || ctx.request.body.email);

// 邮件限流检查
async function rateLimitMail(email) {
  const mockCtx = {
    email,
    ip: '127.0.0.1',
    method: 'POST',
    url: '/email-send',
    headers: {},
    state: {},
    set: () => {},
    body: null,
    status: 200
  };

  await new Promise((resolve, reject) => {
    emailRateLimit(mockCtx, resolve).catch(reject);
  });
}

// 发送邮箱验证邮件
async function sendEmailVerification(email, username = '') {
  try {
    // 限流检查
    await rateLimitMail(email);
    
    // 生成验证token并存入redis
    const redis = require("./redis");
    const verifyToken = Buffer.from(`${email}:${Date.now()}`).toString("base64");
    const redisKey = `verify:email:${verifyToken}`;
    await redis.set(redisKey, email, "EX", 10 * 60); // 10分钟有效
    
    // 生成验证链接
    const verifyUrl = `${config.siteUrl || process.env.BASE_URL || "http://localhost:3000"}/api/users/verify-email?token=${verifyToken}`;
    
    // 发送邮件
    await sendTemplateEmail('emailVerification', email, {
      username: username || email.split('@')[0],
      verifyUrl,
      expiryMinutes: 10
    });
    
    logger.logBusiness('发送邮箱验证邮件', { email, username });
  } catch (error) {
    logger.error('发送邮箱验证邮件失败', {
      email,
      error: error.message
    });
    throw error;
  }
}

// 发送密码重置邮件
async function sendPasswordReset(email, username, resetToken) {
  try {
    await rateLimitMail(email);
    
    const resetUrl = `${config.siteUrl || process.env.BASE_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
    
    await sendTemplateEmail('passwordReset', email, {
      username,
      resetUrl,
      expiryMinutes: 30
    });
    
    logger.logBusiness('发送密码重置邮件', { email, username });
  } catch (error) {
    logger.error('发送密码重置邮件失败', {
      email,
      error: error.message
    });
    throw error;
  }
}

// 发送订单确认邮件
async function sendOrderConfirmation(email, orderData) {
  try {
    await sendTemplateEmail('orderConfirmation', email, {
      username: orderData.username,
      orderNo: orderData.orderNo,
      totalAmount: orderData.totalAmount,
      items: orderData.items,
      address: orderData.address,
      orderDate: orderData.createdAt
    });
    
    logger.logBusiness('发送订单确认邮件', { 
      email, 
      orderNo: orderData.orderNo 
    });
  } catch (error) {
    logger.error('发送订单确认邮件失败', {
      email,
      orderNo: orderData.orderNo,
      error: error.message
    });
    throw error;
  }
}

// 发送订单状态更新邮件
async function sendOrderStatusUpdate(email, orderData) {
  try {
    const statusText = {
      pending: '待支付',
      paid: '已支付',
      shipped: '已发货',
      delivered: '已送达',
      cancelled: '已取消'
    };
    
    await sendTemplateEmail('orderStatusUpdate', email, {
      username: orderData.username,
      orderNo: orderData.orderNo,
      status: orderData.status,
      statusText: statusText[orderData.status] || orderData.status,
      updateTime: new Date().toLocaleString('zh-CN')
    });
    
    logger.logBusiness('发送订单状态更新邮件', { 
      email, 
      orderNo: orderData.orderNo,
      status: orderData.status
    });
  } catch (error) {
    logger.error('发送订单状态更新邮件失败', {
      email,
      orderNo: orderData.orderNo,
      error: error.message
    });
    throw error;
  }
}

// 发送欢迎邮件
async function sendWelcomeEmail(email, username) {
  try {
    await sendTemplateEmail('welcome', email, {
      username
    });
    
    logger.logBusiness('发送欢迎邮件', { email, username });
  } catch (error) {
    logger.error('发送欢迎邮件失败', {
      email,
      error: error.message
    });
    throw error;
  }
}

// 发送安全提醒邮件
async function sendSecurityAlert(email, alertData) {
  try {
    await sendTemplateEmail('securityAlert', email, {
      username: alertData.username,
      alertType: alertData.type,
      alertMessage: alertData.message,
      ip: alertData.ip,
      userAgent: alertData.userAgent,
      timestamp: alertData.timestamp || new Date().toLocaleString('zh-CN')
    });
    
    logger.logBusiness('发送安全提醒邮件', { 
      email, 
      alertType: alertData.type 
    });
  } catch (error) {
    logger.error('发送安全提醒邮件失败', {
      email,
      error: error.message
    });
    throw error;
  }
}

// 批量发送邮件
async function sendBulkEmails(emails, templateType, data = {}) {
  const results = [];
  
  for (const email of emails) {
    try {
      await sendTemplateEmail(templateType, email, data);
      results.push({ email, success: true });
    } catch (error) {
      results.push({ 
        email, 
        success: false, 
        error: error.message 
      });
    }
  }
  
  logger.info('批量邮件发送完成', {
    total: emails.length,
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  });
  
  return results;
}

module.exports = {
  // 基础函数
  sendMail,
  renderTemplate,
  sendTemplateEmail,
  
  // 限流相关
  rateLimitMail,
  emailRateLimit,
  
  // 具体邮件类型
  sendEmailVerification,
  sendPasswordReset,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendWelcomeEmail,
  sendSecurityAlert,
  
  // 批量发送
  sendBulkEmails,
  
  // 配置和工具
  EMAIL_TEMPLATES,
  transporter
};