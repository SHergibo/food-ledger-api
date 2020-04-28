const Express = require('express'),
      UserRoutes = require('./user.route'),
      HouseholdRoutes = require('./household.route'),
      AuthRoutes = require('./auth.route'),
      TokenAuthRoutes = require('./token-auth.route');

const router = Express.Router();

router.get('/status', (req, res) => res.send(200));

router.use('/auth', AuthRoutes);
router.use('/users', UserRoutes);
router.use('/household', HouseholdRoutes);
router.use('/tokens', TokenAuthRoutes);

module.exports = router;