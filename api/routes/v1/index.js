const Express = require('express'),
      UserRoutes = require('./user.route'),
      HouseholdRoutes = require('./household.route'),
      NotificationRoutes = require('./notification.route'),
      RequestRoutes = require('./request.route'),
      ProductRoutes = require('./product.route'),
      HistoricRoutes = require('./historic.route'),
      BrandRoutes = require('./brand.route'),
      AuthRoutes = require('./auth.route'),
      TokenAuthRoutes = require('./token-auth.route');

const router = Express.Router();

router.get('/status', (req, res) => res.send(200));

router.use('/auth', AuthRoutes);
router.use('/users', UserRoutes);
router.use('/households', HouseholdRoutes);
router.use('/notifications', NotificationRoutes);
router.use('/requests', RequestRoutes);
router.use('/products', ProductRoutes);
router.use('/historics', HistoricRoutes);
router.use('/brands', BrandRoutes);
router.use('/tokens', TokenAuthRoutes);

module.exports = router;