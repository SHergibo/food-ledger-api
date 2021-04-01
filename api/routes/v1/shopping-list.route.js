const Express = require('express'),
      ShoppingListController = require(`${process.cwd()}/api/controllers/shopping-list.controller`);

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');
const { checkSameHousehold } = require('../../middlewares/sameHousehold.middleware');


const router = Express.Router();

router
  .route('/pagination/:householdId')
      .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ShoppingListController.findPaginate);

router
  .route('/delete-pagination/:shoppingId')
      .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ShoppingListController.removePagination);
  
router
  .route('/:householdId')
      .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ShoppingListController.removeAll);

router
  .route('/download/:householdId')
      .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ShoppingListController.download);
  
router
    .route('/send-mail/:householdId')
        .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ShoppingListController.sendMail);

module.exports = router;