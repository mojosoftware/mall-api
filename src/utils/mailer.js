const nodemailer = require("nodemailer");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const redis = require("./redis");
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

// 邮箱限流：每分钟最多1次
const emailLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "register_email",
  points: 1,
  duration: 10 * 60,
});

async function rateLimitMail(email)  {

  try {
    //  限流检查
    await emailLimiter.consume(email);

    // 生成验证token并存入redis，24小时有效
    const verifyToken = Buffer.from(`${email}:${Date.now()}`).toString(
      "base64"
    );
    const redisKey = `verify:email:${verifyToken}`;
    await redis.set(redisKey, email, "EX", 10 * 60);

    // 生成验证链接
    const verifyUrl = `${
      process.env.BASE_URL || "http://localhost:3000"
    }/api/users/verify-email?token=${verifyToken}`;

    // 发送邮件;
    await sendMail({
      to: email,
      subject: "邮箱验证",
      html: `<p>欢迎注册，请点击下方链接完成邮箱验证（10分钟内有效）：</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
    
  } catch (e) {
    throw new Error("邮件已经发送，若未收到请检查垃圾邮件或十分钟后重新发送");
  }
}

module.exports = { sendMail , rateLimitMail};
