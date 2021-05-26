# Autoloading Datasources
All files in this folder (and subfolders) will be loaded at runtime.

In order to be loaded, the filename must end with `.datasource.js` and export a load function taking key as argument.
Example: openformat.datasource.js may be accessed in a resolver `context.datasources.openformat.load("some-pid");`. Note that, the beginning of the filename determines the name of the datasource.

Performance metrics for datasources are found at http://localhost:9599/metrics

To enable Redis caching for a datasource, export options object like 
```
export const options {
  redis: {
    prefix: 'cache-key-prefix',
    ttl: 60 * 60 * 24
    staleWhileRevalidate: 60 * 60 * 24 * 30 // optional
  }
}
```
If staleWhileRevalidate is set, a cached value exceeding ttl will be returned to the user, and the value will be refreshed in the background. If cached value exceeds staleWhileRevalidate the value is refreshed before returning to the user.

Add howru check to datasource by exporting a function named status. Checks are executed when visiting http:localhost:3000/howru.

Override default batch loader by exporting a function named batchLoader.