# Autoloading the GraphQL schema
All files in this folder (and subfolders) will be checked for type definitions and resolvers at runtime.

In order to be loaded, the file must export a string named `typeDef` and an array of resolvers named `resolvers`.

## Schema root 
The schema root is defined in [root.js](/src/schema/root.js).
