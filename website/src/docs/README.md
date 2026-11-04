# Documentation readme
This readme is for the developers of the FBI-API. 

The Get started page includes `<InternalMonitoring />`. It renders Services and
Howru sections only when `useCredentialNetwork()` reports an internal request
and Settings → Network is set to Internal. Selecting External hides both sections
and their menu entries.
Their headings are then picked up by the documentation menu. On browser hostnames
ending in `.svc.cloud.dbc.dk`, localhost, or loopback addresses, monitoring links
default to HTTP on the same hostname, port 9599. The Kubernetes Service must expose
that port. `INTERNAL_MONITORING_URL` in
`src/config.js` overrides this address. On public hostnames, no link is shown
unless an override is configured. This setting does not proxy or expose monitoring
endpoints through the public website.


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
In graphQL the deprecation flag should be set on the field, which is deprecated.

Deprecation in the schema could look like this:

```
type SomeType {
 field: [Type!]! @deprecated(reason: "Use 'Type.field' instead expires: 01/01-2099")
 ...,
}
```

! deprecation MUST contain an 'expires' substring, in the dd/mm-yyyy format.

The field/type can still be accessed and user of the API will still get the requested data, but the subject will no longer be auto suggested and will get highlighted as deprecated when used.

Draft fields can reuse the same GraphQL mechanism, but must start their reason with `@draft`.

Draft in the schema could look like this:

```
type SomeType {
 field: [Type!]! @deprecated(reason: "@draft")
 ...,
}
```

Draft fields are shown as `@draft` in the website schema printer, are excluded from the changelog, and do not require an `expires` date.

### Changelog
Deprecation is automatically added to the changelog table.

### Draft Log
Draft fields are automatically added to the draft log table for the current token permissions.
