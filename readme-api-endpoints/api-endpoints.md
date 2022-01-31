## Food ledger API Endpoints

### Auth

| Method | URI                            | Securized | Result                                                        |
| ------ | ------------------------------ | --------- | ------------------------------------------------------------- |
| POST   | api/v1/auth/login              | -         | Create user access token                                      |
| POST   | api/v1/auth/check-credential   | -         | Check if user email and password are valid                    |
| PATCH  | api/v1/auth/refresh-token      | -         | Refresh user access token                                     |
| PATCH  | api/v1/auth/ckeck-token        | -         | Check if user access token is valid                           |
| DELETE | api/v1/auth/logout             | Logged    | Delete user access token                                      |
| DELETE | api/v1/auth/logout-and-refresh | Logged    | Delete user access token and send needRefresh event WebSocket |

### Users

| Method | URI                                  | Securized | Result                                                                                     |
| ------ | ------------------------------------ | --------- | ------------------------------------------------------------------------------------------ |
| POST   | api/v1/users                         | -         | Create new user                                                                            |
| GET    | api/v1/users/pagination/:householdId | Logged    | Get the paginated list of users linked to a household according to the desired page number |
| GET    | api/v1/users/:userId                 | Logged    | Get user data                                                                              |
| PATCH  | api/v1/users/:userId                 | Logged    | Update user data                                                                           |
| DELETE | api/v1/users/:userId                 | Logged    | Delete a user                                                                              |

### Options

| Method | URI                    | Securized | Result              |
| ------ | ---------------------- | --------- | ------------------- |
| GET    | api/v1/options/:userId | Logged    | Get user options    |
| PATCH  | api/v1/options/:userId | Logged    | Update user options |

### Households

| Method | URI                                      | Securized | Result                   |
| ------ | ---------------------------------------- | --------- | ------------------------ |
| POST   | api/v1/households                        | -         | Create new household     |
| GET    | api/v1/households/:householdId           | Logged    | Get household data       |
| PATCH  | api/v1/households/:householdId           | Logged    | Update household data    |
| PATCH  | api/v1/households/kick-user/:householdId | Logged    | Kick user from household |

### Products

| Method | URI                                     | Securized | Result                                                                                        |
| ------ | --------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| POST   | api/v1/products                         | Logged    | Create a product                                                                              |
| GET    | api/v1/products/pagination/:householdId | Logged    | Get the paginated list of products linked to a household according to the desired page number |
| GET    | api/v1/products/download/:productId     | Logged    | Get list off all products linked to a household                                               |
| GET    | api/v1/products/:productId              | Logged    | Get product data                                                                              |
| PATCH  | api/v1/products/:productId              | Logged    | Update product data                                                                           |
| DELETE | api/v1/products/:productId              | Logged    | Delete a product                                                                              |

### Historics

| Method | URI                                      | Securized | Result                                                                                         |
| ------ | ---------------------------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| POST   | api/v1/historics                         | Logged    | Create a historic                                                                              |
| GET    | api/v1/historics/pagination/:householdId | Logged    | Get the paginated list of historics linked to a household according to the desired page number |
| GET    | api/v1/historics/download/:historicId    | Logged    | Get list off all historics linked to a household                                               |
| GET    | api/v1/historics/:historicId             | Logged    | Get historic data                                                                              |
| PATCH  | api/v1/historics/:historicId             | Logged    | Update historic data                                                                           |
| DELETE | api/v1/historics/:historicId             | Logged    | Delete a historic                                                                              |

### Brands

| Method | URI                                   | Securized | Result                                                                                      |
| ------ | ------------------------------------- | --------- | ------------------------------------------------------------------------------------------- |
| GET    | api/v1/brands/find-all/:householdId   | Logged    | Get list of all brands linked to a household                                                |
| GET    | api/v1/brands/pagination/:householdId | Logged    | Get the paginated list of brands linked to a household according to the desired page number |
| GET    | api/v1/brands/:brandId                | Logged    | Get brand data                                                                              |
| PATCH  | api/v1/brands/:brandId                | Logged    | Update brand data                                                                           |
| DELETE | api/v1/brands/:brandId                | Logged    | Delete a brand                                                                              |

### Shopping-lists

| Method | URI                                           | Securized | Result                                                                                             |
| ------ | --------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------- |
| GET    | api/v1/shopping-lists/pagination/:shoppingId  | Logged    | Get the paginated list of all shoppings linked to a household according to the desired page number |
| DELETE | api/v1/shopping-lists/:shoppingId             | Logged    | Delete a shopping                                                                                  |
| DELETE | api/v1/shopping-lists/delete-all/:householdId | Logged    | Delete all shoppings linked to a household                                                         |
| GET    | api/v1/shopping-lists/download/:shoppingId    | Logged    | Get list off all shoppings linked to a household                                                   |
| GET    | api/v1/shopping-lists/send-mail/:shoppingId   | Logged    | Send email with all shoppings linked to a household                                                |

### Statistics

| Method | URI                            | Securized | Result                                                     |
| ------ | ------------------------------ | --------- | ---------------------------------------------------------- |
| GET    | api/v1/statistics/:householdId | Logged    | Get all the statistics of the charts linked to a household |

### Product-logs

| Method | URI                                         | Securized           | Result                                                                                                |
| ------ | ------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------- |
| GET    | api/v1/product-logs/pagination/:householdId | Logged - Only Admin | Get the paginated list of all product logs linked to a household according to the desired page number |
| DELETE | api/v1/product-logs/:productLogId           | Logged - Only Admin | Delete a product log                                                                                  |
| DELETE | api/v1/product-logs/delete-all/:householdId | Logged - Only Admin | Delete all product logs linked to a household                                                         |

### Notifications

| Method | URI                                                           | Securized | Result                                                                                                     |
| ------ | ------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| GET    | api/v1/notifications/received-notification/:userId            | Logged    | Get all received notifications                                                                             |
| GET    | api/v1/notifications/sended-notification/:userId              | Logged    | Get all sended notifications                                                                               |
| GET    | api/v1/notifications/pagination-received-notification/:userId | Logged    | Get the paginated list of all received notifications linked to a user according to the desired page number |
| GET    | api/v1/notifications/pagination-sended-notification/:userId   | Logged    | Get the paginated list of all sended notifications linked to a user according to the desired page number   |
| DELETE | api/v1/notifications/:notificationId                          | Logged    | Delete a notification                                                                                      |

### Requests

| Method | URI                                                         | Securized | Result                                       |
| ------ | ----------------------------------------------------------- | --------- | -------------------------------------------- |
| GET    | api/v1/requests/delegate-admin/:notificationId              | Logged    | Get delegate-admin notification              |
| POST   | api/v1/requests/switch-admin-rights                         | Logged    | Create switch-admin-rights notification      |
| GET    | api/v1/requests/switch-admin-rights-respond/:notificationId | Logged    | Get switch-admin-rights-respond notification |
| POST   | api/v1/requests/add-user-request                            | Logged    | Create add-user-request notification         |
| GET    | api/v1/requests/add-user-respond/:notificationId            | Logged    | Get add-user-request notification            |
