# Patron historical loans – UserData handoff

## Afgrænsning

`Patron` har nu to uafhængige datastrømme:

- `currentLoans` hentes live fra OpenUserStatus af FBI API Gateway.
- `historicalLoans` hentes fra UserData.

UserData skal **kun** eje historiske lån. Den kommende tredjepartskilde og dens
endelige datamodel er endnu ukendt, så denne kontrakt er bevidst minimal og må
forventes at blive udvidet.

Den tidligere Loan V2-kontrakt med `dueDate`, `ACTIVE`/`OVERDUE` og endpoints
under `/v2/loan/*` er erstattet af kontrakten i dette dokument.

## Minimal datamodel

Anbefalede felter på en `HistoricalLoan`-tabel:

| Felt | Type | Bemærkning |
| --- | --- | --- |
| `id` | UUID, required, PK | Offentlig UserData-identifikator; bruges ved delete. |
| `userId` | String, required, FK | Reference til `User.smaugUserId`; afledes fra access token. |
| `agencyId` | String, nullable | Biblioteket, hvis det kendes. |
| `loanedAt` | Date, nullable | Udlånsdato uden klokkeslæt. |
| `returnedAt` | Date, nullable | Afleveringsdato uden klokkeslæt. |
| `materialId` | String, required i den manuelle første version | PID eller faustnummer. Kan muligvis blive nullable ved fremtidig harvesting. |
| `materialIdType` | enum/string, required | Foreløbig `PID` eller `FAUST`. |
| `snapshot` | JSONB, nullable | Servergenereret fallback-metadata. |
| `source` | String, required | Internt felt; `MANUAL` for testdata, senere provider-navn. Eksponeres ikke i GraphQL nu. |
| `sourceLoanId` | String, required | Internt deduplikerings-ID; generér UUID for manuelle poster. Eksponeres ikke i GraphQL nu. |
| `createdAt` | DateTime, required | Auditfelt. |
| `updatedAt` | DateTime, required | Auditfelt. |

Relationen til `User` bør bruge `onDelete: Cascade`. UserData skal udlede
brugeren via `userinfo.attributes.uniqueId`; request bodies må aldrig kunne
vælge `userId`.

`loanedAt` og `returnedAt` er nullable, fordi den fremtidige leverandørs
datakvalitet ikke kendes. UserData må ikke opfinde standarddatoer.

### Snapshot

Gatewayen resolver manifestationen og konstruerer snapshot ved manuel add.
GraphQL-klienten kan ikke sende snapshotdata.

```json
{
  "version": 1,
  "pid": "870970-basis:23424916",
  "workId": "work-of:870970-basis:23424916",
  "title": "Efter uvejret",
  "creator": "Kenneth Bøgh Andersen",
  "materialType": "BOOK",
  "workType": "LITERATURE",
  "periodical": {
    "edition": "Årg. 10",
    "pages": "S. 12-15",
    "publisher": "Eksempelbladet",
    "language": "dan"
  }
}
```

Alle metadatafelter er nullable. `periodical` er nullable og samler kun
metadata om værtsudgivelsen. UserData kan sætte eller validere `version: 1`.

## Forventet REST-kontrakt

```text
POST   /v2/historical-loan/get
POST   /v2/historical-loan/add
DELETE /v2/historical-loan/delete
```

Alle kald bruger:

```http
Authorization: Bearer <patronens access token>
Content-Type: application/json
```

### Get

Request:

```json
{
  "offset": 0,
  "limit": 10
}
```

Begge felter er valgfrie. Anbefalede defaults er `offset = 0` og `limit = 10`.
`hitcount` beregnes før pagination, mens `items` kun indeholder den ønskede
side.

Response:

```json
{
  "status": "OK",
  "hitcount": 1,
  "items": [
    {
      "id": "45fb4d52-d7f7-4c36-a94f-37a00eb60163",
      "agencyId": "710100",
      "loanedAt": "2026-05-01",
      "returnedAt": "2026-05-20",
      "materialId": "23424916",
      "materialIdType": "FAUST",
      "snapshot": {
        "version": 1,
        "title": "Efter uvejret",
        "periodical": null
      }
    }
  ]
}
```

Returnér ikke `userId`, `source`, `sourceLoanId` eller interne timestamps.

### Add – kun testbrug

Request:

```json
{
  "loans": [
    {
      "agencyId": "710100",
      "loanedAt": "2026-05-01",
      "returnedAt": "2026-05-20",
      "materialId": "23424916",
      "materialIdType": "FAUST",
      "snapshot": {
        "pid": "870970-basis:23424916",
        "workId": "work-of:870970-basis:23424916",
        "title": "Efter uvejret",
        "creator": "Kenneth Bøgh Andersen",
        "materialType": "BOOK",
        "workType": "LITERATURE",
        "periodical": null
      }
    }
  ]
}
```

`agencyId`, `loanedAt` og `returnedAt` kan være `null`. I den manuelle første
version er `materialId`, `materialIdType` og et gateway-genereret snapshot
til stede. UserData sætter internt `source = MANUAL` og genererer
`sourceLoanId` som UUID; de må ikke modtages fra GraphQL-klienten.

Response, i samme rækkefølge som input:

```json
{
  "results": [
    {
      "id": "45fb4d52-d7f7-4c36-a94f-37a00eb60163",
      "materialId": "23424916",
      "status": "ok"
    }
  ]
}
```

Understøttede item-statuser: `ok`, `already_exists`, `unknown_error`.

### Delete

Request:

```json
{
  "ids": ["45fb4d52-d7f7-4c36-a94f-37a00eb60163"]
}
```

Response:

```json
{
  "results": [
    {
      "id": "45fb4d52-d7f7-4c36-a94f-37a00eb60163",
      "materialId": "23424916",
      "status": "ok"
    }
  ]
}
```

Delete skal altid scopes til den autentificerede bruger.

- En manuel række (`source = MANUAL`) slettes fysisk med det samme.
- En høstet række suppresses, så næste harvest ikke genskaber den.

Understøttede item-statuser: `ok`, `not_found`, `unknown_error`.

## Fejlkontrakt

Gatewayen forstår blandt andet disse stabile fejlkoder:

```text
MISSING_ACCESS_TOKEN
INVALID_ACCESS_TOKEN
MISSING_USER_ID
HISTORICAL_LOAN_MANUAL_ADDS_DISABLED
HISTORICAL_LOAN_CONSENT_REQUIRED
```

Det gamle `LOAN_*`-prefix accepteres midlertidigt af gatewayen, men den nye
UserData-implementering bør bruge `HISTORICAL_LOAN_*`.

## GraphQL-kontrakten i gatewayen

```graphql
type Patron {
  currentLoans(
    orderBy: OrderLoansByEnum
    status: PatronLoanStatusEnum
    offset: Int
    limit: PaginationLimitScalar
  ): PatronCurrentLoans!

  historicalLoans(
    offset: Int
    limit: PaginationLimitScalar
  ): PatronHistoricalLoans!
}

type PatronHistoricalLoans {
  hitcount: Int!
  status: PatronLoansOverallStatusEnum!
  items: [HistoricalLoan!]!
}

type HistoricalLoan {
  id: String!
  loanedAt: Date
  returnedAt: Date
  agency: PatronAgency
  manifestation: Manifestation
  snapshot: PatronMaterialSnapshot
}
```

Mutationerne hedder `addHistoricalLoans` og `deleteHistoricalLoans` under
`PatronMutation`. Eksisterende loan-operationer på `User` og root, inklusive
renew, ændres ikke.
