# Documentation readme
This readme is for the developers of the FBI-API. 


## These are the examples


The filename must match a root path in the graphql schema. Only examples that the given token gives access to is shown.


## Deprecating
When deprecating fields or types in the FBI-API, users of the API must be notified
in time by the following procedure.

### Documentation

#### Deprecating entire root types or documentation sections
Documentation which has its own heading/subHeading in the documentation menu should have the title wrapped in the `<DeprecationTitle />` component. This will set a deprecation flag on the menu item in the docs menu.

```
<DeprecationTitle>
  ## ExampleHeading
</DeprecationTitle>
```

This could be useful if a entire Type (maybe root) is removed or renamed.

If renamed, a new documentation section with the new name should be created.

Furthermore A deprecation notification box should be added to the top of the deprecated documentation section. See [#Deprecating-single-fields-or-types](https://github.com/DBCDK/fbi-api-gateway/edit/master/website/src/docs/README.md#deprecating-single-fields-or-types)

#### Deprecating single fields or types
Deprecating a single field or type can be done by adding a deprecation notification to the top of all examples where the current field or type is used.

Creating a deprecation notification box can bed done by using the `<DeprecationBox />` component.

```
<DeprecationBox deprecated="01/02-2023" expires="01/05-2023">
 Field `field` is now deprecated and will be removed in future. The field is
 replaced by a new `newField`. See [link](link) for further
 details and examples.
</DeprecationBox>
```
⚠️ A deprecation and expiration date should always be given!

InlineGraphiql examples and other supported documentation components and markup can be included in the children of the `<DeprecationBox />` component.

### GraphQL Schema
In graphQL the deprecation flag should be set on the field or type, which is deprecated.

Deprecation in the schema could look like this:

```
type SomeType {
 field: [Type!]! @deprecated(reason: "Use 'Type.field.field'")
 ...,
}
```

The field/type can still be accessed and user of the API will still get the requested data, but the subject will no longer be auto suggested and will get highlighted as deprecated when used.