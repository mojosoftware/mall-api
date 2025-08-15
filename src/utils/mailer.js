const nodemailer = require("nodemailer");
const { customKeyRateLimit } = require("../middleware/rateLimiter");
const config = require("../config");

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure, // true for 465, false for other ports
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

async function sendMail({ to, subject, html }) {
  return transporter.sendMail({
    from: config.email.from,
    to,
    subject,
    html,
  });
}

// 创建邮件限流中间件
const emailRateLimit = customKeyRateLimit('email', (ctx) => ctx.email || ctx.request.body.email);

async function rateLimitMail(email) {
  // 创建模拟的ctx对象用于限流检查
  const mockCtx = {
    email,
    ip: '127.0.0.1', // 默认IP
    method: 'POST',
    url: '/email-send',
    headers: {},
    state: {},
    set: () => {},
    body: null,
    status: 200
  };

  // 使用限流中间件检查
  await new Promise((resolve, reject) => {
    emailRateLimit(mockCtx, resolve).catch(reject);
  });

  // 生成验证token并存入redis，10分钟有效
  const redis = require("./redis");
  const verifyToken = Buffer.from(`${email}:${Date.now()}`).toString("base64");
  const redisKey = `verify:email:${verifyToken}`;
  await redis.set(redisKey, email, "EX", 10 * 60);

  // 生成验证链接
  const verifyUrl = `${
    process.env.BASE_URL || "http://localhost:3000"
  }/api/users/verify-email?token=${verifyToken}`;

  // 发送邮件
  await sendMail({
    to: email,
    subject: "邮箱验证",
    html: `<p>欢迎注册，请点击下方链接完成邮箱验证（10分钟内有效）：</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
}

