# Node API for TodoList project

## NPM packages installation

$ npm install

## Endpoints

### Users

|Method	| URI | Securized | Result |
|---	|---	|---	|---	|
| POST  |  api/v1/users 	| - 	| Create new user |
| GET   |  api/v1/users/:userId 	| Logged 	| Get user informations  |
| PATCH 	|  api/v1/users/:userId 	| Logged 	|  Update some fields of a user document |
| DELETE 	|  api/v1/users/:userId 	| Logged 	|  Delete a user |

### Tokens

|Method	| URI | Securized | Result |
|---	|---	|---	|---	|
| POST  |  api/v1/tokens/:tokenId 	| - 	| generate new token-auth |
| PATCH 	|  api/v1/tokens/:tokenId 	| - 	| Update used field of a token-auth |