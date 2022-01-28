## Food ledger API Endpoints

### Users

| Method | URI                  | Securized | Result                                |
| ------ | -------------------- | --------- | ------------------------------------- |
| POST   | api/v1/users         | -         | Create new user                       |
| GET    | api/v1/users/:userId | Logged    | Get user informations                 |
| PATCH  | api/v1/users/:userId | Logged    | Update some fields of a user document |
| DELETE | api/v1/users/:userId | Logged    | Delete a user                         |

### Auth

| Method | URI                       | Securized | Result                    |
| ------ | ------------------------- | --------- | ------------------------- |
| POST   | api/v1/auth/login         | -         | Create user access token  |
| PATCH  | api/v1/auth/refresh-token | -         | Refresh user access token |
| DELETE | api/v1/auth/logout        | -         | Delete user access token  |
