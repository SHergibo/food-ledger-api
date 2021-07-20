const router = require('express').Router(),
      UserRoutes = require('./user.route'),
      OptionRoutes = require('./option.route'),
      HouseholdRoutes = require('./household.route'),
      NotificationRoutes = require('./notification.route'),
      RequestRoutes = require('./request.route'),
      ProductRoutes = require('./product.route'),
      HistoricRoutes = require('./historic.route'),
      BrandRoutes = require('./brand.route'),
      ProductLogRoutes = require('./product-log.route'),
      ShoppingListRoutes = require('./shopping-list.route'),
      StatisticRoutes = require('./statistic.route'),
      AuthRoutes = require('./auth.route'),
      TokenAuthRoutes = require('./token-auth.route');
      // ScriptRoutes = require('./script.route');

router.use('/auth', AuthRoutes);
router.use('/users', UserRoutes);
router.use('/options', OptionRoutes);
router.use('/households', HouseholdRoutes);
router.use('/notifications', NotificationRoutes);
router.use('/requests', RequestRoutes);
router.use('/products', ProductRoutes);
router.use('/historics', HistoricRoutes);
router.use('/brands', BrandRoutes);
router.use('/product-logs', ProductLogRoutes);
router.use('/shopping-lists', ShoppingListRoutes);
router.use('/statistics', StatisticRoutes);
router.use('/tokens', TokenAuthRoutes);
// router.use('/scripts', ScriptRoutes);

module.exports = router;