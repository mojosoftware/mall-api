const Router = require('koa-router');
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middleware/auth');
const sessionMiddleware = require('../middleware/session');

const router = new Router({
  prefix: '/api/users'
});

// 公开路由
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/session/:sessionId/validate', UserController.validateSession);

// 需要认证的路由
router.use(authMiddleware);

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.post('/logout', UserController.logout);
router.post('/change-password', UserController.changePassword);

// Session管理路由
router.get('/sessions', UserController.getActiveSessions);
router.post('/logout-all', UserController.logoutAllSessions);
router.delete('/sessions/:sessionId', UserController.logoutSession);

module.exports = router; 