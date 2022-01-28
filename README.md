#Food ledger REST API

Food ledger API is a simple REST API developed using Node.js, Express and MongoDB. This API is used to save the data of all your food and non-perishable food. If you want, you can use [food-ledger-front](https://github.com/SHergibo/food-ledger-front) with this API to be able to directly use all the functionality of this API on your browser.

The main goal of this API is to send you an alert (via gmail) on future products that have a near expiration date, allowing you not to waste food that you have forgotten at the bottom of your cupboard.

Another goal of the API is to automatically generate a shopping list with all the products you have consumed lately.

This API also automatically generates a whole system of statistics allowing you to visualize the number of products that will be expired according to the month of the year, the number of products and calories per type of product and finally the total number of products in your stock per week throughout the year.

Finally, this API offers an invitation system allowing you to invite other users in your family. These users will be able to use, update and view your database.

## Features

- CORS enabled
- Express + MongoDB ([Mongoose](http://mongoosejs.com/))
- Uses [helmet](https://github.com/helmetjs/helmet) to set some HTTP headers for security
- Load environment variables from .env files with [dotenv](https://github.com/rolodato/dotenv-safe)
- Gzip compression with [compression](https://github.com/expressjs/compression)
- Sanitize inputs against query selector injection attacks with [mongo-sanitize](https://github.com/vkarpov15/mongo-sanitize)
- Uses [isomorphic-dompurify](https://www.npmjs.com/package/isomorphic-dompurify) to clean all incoming data before storing them in the database
- Tests with [Jest](https://jestjs.io/)
- Logging with [morgan](https://github.com/expressjs/morgan)
- Authentication and Authorization with [passport](http://passportjs.org)
- Uses [socket-io](http://passportjs.org) to send in real time update / notification to the front-end
- Send email with [Nodemailer](https://nodemailer.com/about/) via gmail with [googleapis](https://www.npmjs.com/package/googleapis)
- Uses [cron](https://www.npmjs.com/package/cron) to execute function on a schedule (for example: sending your shopping list a the end of the week)

## Requirements

- [Node v16.13+](https://nodejs.org/en/download/current/)
- [MongoDB v4.2](https://docs.mongodb.com/v4.2/installation/)

## Getting Started

#### 1) Clone the repo

```bash
git clone https://github.com/SHergibo/back-bone.git
cd back-bone
rm -rf .git
```

#### 2) Add your environments data

Rename `development-sample.env`, `production-sample.env` and `test-sample.env` to `development.env`, `production.env` and `test.env`.

In these files, you need to add your `JWT_SECRET`, you can alse change your DB name in `MONGO_URI`, for example `mongodb://localhost:27017/my-rest-api`.

In `production.env`, you can add one or multiple urls in `CORS_ORIGIN` for security reasons. Only those urls will have access to the REST API.

For example:
for one url: `CORS_ORIGIN = "www.example.com"`
for multiple urls: `CORS_ORIGIN = ["www.example.com", "www.example2.com"]`

#### 3) Add your secrets gmail data

This API used googleapis to send email to your gmail account. If you want to receive information about products that are close to their expiration date, you must have a gmail account, because there is no other option to send emails in this API.

First thing to do, you need to rename `secrets-sample.js` to `secrets.js` in the config folder.

Next, you need to add the gmail address in the `MAIL` value.

Lastly, you need to generate your `CLIENT_ID`, `CLIENT_SECRET` and `REFRESH_TOKEN`, to generate these value, read the information below.

##### 1) Generate your `CLIENT_ID` and `CLIENT_SECRET`

- Go to [Google Cloud](https://console.cloud.google.com/) and create a new project.
- Search for “APIs & Services”
- Click on “Credentials” > Click “+ Create credentials” > “OAuth client ID”
- Type: Web Application
- Name: “Enter Your Name of Client”
- Authorized redirect URIs: https://developers.google.com/oauthplayground
- Copy both the Client ID and Client Secret in `secrets.js`.

##### 2) Generate your `REFRESH_TOKEN`

- Go to [Oauth Playground](https://developers.google.com/oauthplayground/) > Click on Setting icon on the right > Enable Use your own Oauth credentials > Enter Oauth Client ID & Oauth Client Secret that you get from the above step > Close
- In Select & Authorize APIs, Type https://mail.google.com > Authorize APIs > Login with the account that you want to send from (same as MAIL in `secrets.js`).
- Click Exchange authorization code for tokens > Copy Refresh Token in `secrets.js`

#### 4) Install dependencies

```bash
npm install
```

#### 5) Running the app

Locally

```bash
npm run dev
```

In production

```bash
npm run start
```

Running the test

```bash
npm run test
```

## Endpoints

See food ledger API endpoints [here](https://github.com/SHergibo/food-ledger-api/tree/master/readme-api-endpoints/api-endpoints.md)

## License

[MIT License](README.md) - [Sacha Hergibo](https://github.com/SHergibo)
