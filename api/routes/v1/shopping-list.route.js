const Express = require('express'),
      ShoppingListController = require(`${process.cwd()}/api/controllers/shopping-list.controller`);

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');
const { checkSameHousehold } = require('../../middlewares/sameHouseholdCode.middleware');


const router = Express.Router();

router
  .route('/pagination/:householdCode')
      .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ShoppingListController.findPaginate);

router
  .route('/delete-pagination/:shoppingId')
      .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ShoppingListController.removePagination);
  
router
  .route('/:householdCode')
      .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ShoppingListController.removeAll);

router
  .route('/download/:householdCode')
      .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ShoppingListController.download);
  
router
    .route('/send-mail/:householdCode')
        .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ShoppingListController.sendMail);

module.exports = router;