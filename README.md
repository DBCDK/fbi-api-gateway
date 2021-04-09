# The Next bibliotek.dk API
This is the API part of the next bibliotek.dk.
The application is built with Node.js and Express, and exposes a GraphQL API. The API is used by the frontend as the one and only entrance to underlying services.

## Getting started
The development environment may be set up using npm. 

### npm
 - `npm install` installs dependencies
 - `npm run dev` starts a dev server
 - `npm test` runs jest tests

## Notes on performance
A single query to the API typically leads to requests being sent to several underlying data sources. This is perfectly fine, and one of the strengths of GraphQL. But if data loading is not handled properly it results in an excessive number of network request round-trips.

We use [DataLoader library](https://github.com/graphql/dataloader) (a port of Facebooks "Loader" API) and a Redis cache for mitigating these challenges.

- **Per request caching (DataLoader)**
DataLoader has a builtin memory cache, preventing multiple requests for the same resource from happening in the same GraphQL request.
- **Per request batching (DataLoader)**
Batching is the primary feature of DataLoader. It groups requests to the same resource and let us (if the data source supports it) fetch the data in a single request. Even though, a data source does not support batch requests it is still highly beneficial. As soon as data is in the Redis cache, we fetch it using a batch requests.
- **Global cache (Redis)**
We use a global Redis cache shared across all GraphQL instances
- **Complex query analysis**
Queries are analyzed before execution, and if they are too complex they are rejected.
These queries are typically highly nested, leading to a high number of requests to underlying data sources.



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
The group.
- **MOREINFO_TIME_TO_LIVE_SECONDS**
Time for data to live in the Redis cache in seconds. Default is 86400.
- **MOREINFO_PREFIX**
The prefix to be used for keys in the Redis cache. This may be changed to invalidate entries. Default is moreinfo-1. 
- **OPENFORMAT_URL**
The workservice URL. Default is http://openformat-php-master.frontend-prod.svc.cloud.dbc.dk/server.php
- **OPENFORMAT_TIME_TO_LIVE_SECONDS**
Time for data to live in the Redis cache in seconds. Default is 86400.
- **OPENFORMAT_PREFIX**
The prefix to be used for keys in the Redis cache. This may be changed to invalidate entries. Default is openformat-1. 
- **REDIS_HOST**
The Redis host. Default is 127.0.0.1.
- **REDIS_PORT**
The Redis port. Default is 6379.
- **REDIS_PREFIX**
The prefix to be used for entire application. Change this and all entries are invalidated. Default is bibdk-api-1.
- **REDIS_ENABLED**
Default is true.
- **WORKSERVICE_URL**
The workservice URL. Default is http://work-presentation-service.cisterne.svc.cloud.dbc.dk/api/work-presentation
- **WORKSERVICE_AGENCY_ID**
The agency id
- **WORKSERVICE_PROFILE**
The profile
- **WORKSERVICE_TIME_TO_LIVE_SECONDS**
Time for data to live in the Redis cache in seconds. Default is 86400.
- **WORKSERVICE_PREFIX**
The prefix to be used for keys in the Redis cache. This may be changed to invalidate entries. Default is workservice-1. 