# The Next bibliotek.dk API
This is the API part of the next bibliotek.dk.
The application is built with Node.js and Express, and exposes a GraphQL API. The API is used by the frontend as the one and only entrance to underlying services.

## Getting started
The development environment may be set up using npm. 

### npm
 - `npm install` installs dependencies
 - `npm run dev` starts a dev server
 - `npm test` runs jest tests

## Environment Variables
The following environment variables can be set in the application
- **PORT**
Port on which the server runs. Default is 3000.
- **MOREINFO_URL**
URL on which moreinfo runs.
- **MOREINFO_USER**
The user.
- **MOREINFO_GROUP**
The group.
- **MOREINFO_PASSWORD**
The password.
- **WORKSERVICE_URL**
The workservice URL. Default is http://work-presentation-service.cisterne.svc.cloud.dbc.dk/api/work-presentation
- **WORKSERVICE_AGENCY_ID**
The agency id
- **WORKSERVICE_PROFILE**
The profile