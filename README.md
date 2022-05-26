# Food ledger REST API

Food ledger API is a simple REST API developed using Node.js, Express and MongoDB. This API is used to save the data of all your food and non-perishable food. If you want, you can use [food-ledger-front](https://github.com/SHergibo/food-ledger-front) with this API to be able to directly use all the features of this API on your browser.

The main goal of this API is to send you an alert (via gmail) on future products whose expiration date is close, allowing you not to waste the food you forgot at the bottom of your cupboard.

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
git clone https://github.com/SHergibo/food-ledger-api.git
cd food-ledger-api
rm -rf .git
```

#### 2) Add your environments data

Rename `development-sample.env`, `production-sample.env` and `test-sample.env` to `development.env`, `production.env` and `test.env`.

In these files, you need to add your `JWT_SECRET`, you can also change your DB name in `MONGO_URI`, for example `mongodb://localhost:27017/my-rest-api`.

In `production.env`, you can add one or multiple urls in `CORS_ORIGIN` for security reasons. Only those urls will have access to the REST API.

For example:
for one url: `CORS_ORIGIN = "www.example.com"`
for multiple urls: `CORS_ORIGIN = ["www.example.com", "www.example2.com"]`

#### 3) Create your SendGrid account to receive email

This API uses [SendGrid](https://sendgrid.com/) to receive/send emails. If you want to receive/send emails, you need to create a SendGrid account. Then, follow the initial step to add a sender email or domain, and then create an API key.

Once you have added a sender email or domain and generated your SendGrid API key, you need to add them in your `development.env` and `production.env`.

For example:
`SENDGRID_FROM = "your sender email or domain here"`
`SENDGRID_API_KEY = "your SendGrid API key here"`

After that, you need to create a template for your email. To create a template, go to Email API menu in your SendGrid account and click on Dynamic Templates. Here, click on create a Dynamic Template, add a name and click on Create. Next, click on your new template and click on Add version, select Blank Template and then Code Editor. Delete everything in the editor and go to [here](https://github.com/SHergibo/food-ledger-api/blob/master/api/views/layouts/email-sendgrid-list-template.hbs), copy and paste everything from this file to the template editor in SendGrid, save and return to the previous page.

Now click on your template, copy the Template ID and paste it in yout development.env and production.env.

for example:
`SENDGRID_LIST_TEMPLATE_ID = "your template id here"`

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
