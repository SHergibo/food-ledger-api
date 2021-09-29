const router = require('express').Router(),
      ShoppingListController = require(`${process.cwd()}/api/controllers/shopping-list.controller`),
      { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware'),
      { checkSameHousehold } = require('../../middlewares/sameHousehold.middleware'),
      { isWaiting } = require('../../middlewares/isWaiting.middleware');

router
  .route('/pagination/:householdId')
    .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ShoppingListController.findPaginate);

router
  .route('/:shoppingId')
    .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, isWaiting, ShoppingListController.remove);

router
  .route('/delete-all/:householdId')
    .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, isWaiting, ShoppingListController.removeAll);

router
  .route('/download/:householdId')
    .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ShoppingListController.download);

router
  .route('/send-mail/:householdId')
    .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ShoppingListController.sendMail);

module.exports = router;