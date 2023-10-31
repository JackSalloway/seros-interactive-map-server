# seros-interactive-map-server

Seros Interactive Map Server is the back end (API) for my Dungeons and Dragons companion app. An app created to track various entries consisting of sublocations, characters, quests and combat instances all of which are assigned under the banner of a unique location represented by a pin on the map. It also allows for the creation of multiple campaigns so all created notes can be isolated to one campaign.

## Scripts

In the project directory, you can run:

### `npm install`

Installs the relevant dependancies.

### `npm start`

Starts the server on port 5000

### `npm dev`

Starts the server on port 5000 using nodemon to apply hot reloads.

## Tech
Express: https://expressjs.com/

Mongoose: https://mongoosejs.com/

JWT: https://jwt.io/

## Using The App

### Getting Started

This app uses a `.env` file to keep any secrets secure so you will need to create a `.env` file and ensure the variables located in that file have relevant values. These variables include:

- `NODE_ENV` - should be set to "development" 
- `ACCESS_TOKEN_SECRET` - a unique secret code
- `REFRESH_TOKEN_SECRET` - a unique secret code
- `MONGODB_URI` - a relevant mongoDB URI 
- `CORS_ORIGIN_URL` - the url assigned to the front end of this application

Once these variables have been set the application can be started with the relevant command.

## Understanding The API

### Creating And Storing Data

Upon user account creation, sensitive user data is hashed then stored in the user collection.

The API performs CRUD operations on the various data types contained within the database collections. These include:

- Users
- Campaigns
- Locations
- Sublocations
- NPCs (Non-Player Characters)
- Quests
- Combat Instances
- Changelog

Schemas for these can be found within the `\models` folder.

Endpoints for these data types can be found within the `\routes` folder.

### User Authorization

Users are authorized through the use of JSON Web Tokens, to ensure that only specific users are able to access the relevant data.

## Relevant Links

seros-interactive-map-client repository: https://github.com/JackSalloway/seros-interactive-map-client

## Next steps

The things I would like to implement for the future of this app are as follows:

- Webhooks - upgrade user connection when a campaign is selected and relevant campaign data is returned so users can interact with each other.
- Unimplemented Routes - A few routes are yet to be implemented. They are as follows:
  - Delete Campaign Route
  - Remove User From Campaign Route - Route for removing users from a campaign if you are an admin
  - Leave Campaign Route - Route for leaving a campaign as a user
  - Edit Combat Instance Route
  - Delete Combat Instance Route
