# Loan V2 – handoff til FBI API

> **Forældet:** Denne kontrakt beskriver den tidligere model for aktive lån.
> Den må ikke bruges til den kommende UserData-ændring. Se i stedet
> `PATRON_LOANS_USERDATA_WORKFILE.md`, som beskriver den nye minimale kontrakt
> for historical loans. Aktuelle lån hentes fortsat fra OpenUserStatus.

## Formål og status

Dette dokument beskriver den **implementerede** UserData-kontrakt, som FBI API
skal migrere `Patron.loans` og de kommende loan-mutationer til.

UserData:

```text
repository: /home/mtni/projects/bibliotekdk-next-userdata
branch:     sp-1567-loan-history
```

Implementerede endpoints:

```text
POST   /v2/loan/get
POST   /v2/loan/add
DELETE /v2/loan/delete
```

Den maskinlæsbare kontrakt findes efter deploy på:

```text
GET /openapi.json
GET /docs
```

Harvesting, FBI API-cutover og det kommende separate loan-consent-felt er ikke
implementeret i UserData endnu. ADD bruges foreløbigt til manuelle testdata.

## Afgrænsning i FBI API

Kun Patron-kontrakten migreres til Loan V2. Eksisterende legacy-operationer,
herunder `User.loans`, renew-flow og direkte OpenUserStatus-brug uden for
`Patron.loans`, må ikke ændres som sideeffekt.

Den nuværende `Patron.loans` læser fra OpenUserStatus gennem loaderen `loans`
og udfører filter, sortering og pagination i `PatronLoans.items`. Efter
migrationen er UserData autoritativ for den gemte loan collection.

FBI API skal derfor:

1. erstatte OpenUserStatus-loaderen i `Patron.loans` med en separat UserData V2
   GET-datasource;
2. flytte `orderBy`, `status`, `offset` og `limit` fra
   `PatronLoans.items(...)` til `Patron.loans(...)`;
3. videresende argumenterne til UserData uden lokal filtrering, sortering eller
   pagination;
4. bruge UserDatas `hitcount`, item-rækkefølge og item-status direkte;
5. tilføje separate ADD/DELETE-datasources til de kommende mutationer;
6. lade legacy loaders og schemafelter være urørte.

## Authentication og trusted context

Alle tre endpoints kræver:

```http
Authorization: Bearer <samme access token som FBI API modtog>
Content-Type: application/json
```

FBI API må kun videresende tokenet. Der er ingen token exchange og intet
service-token.

FBI API må ikke sende ejer- eller Smaug-kontekst i body, herunder:

```text
smaugUserId
userId
ingestionMethod
clientId
application
key
bookmarksKey
```

UserData kalder selv Smaug configuration og userinfo parallelt. Loans kræver
ikke `gateway.bookmarks.key/app`; en gyldig token-konfiguration uden bookmark
config er gyldig for Loan V2.

Ejeren afledes udelukkende sådan:

```text
userinfo.attributes.uniqueId -> Loan.userId -> User.smaugUserId
```

Token og Authorization-header må aldrig logges eller indgå i datasource-fejl.

## GET `/v2/loan/get`

### Request

```json
{
  "orderBy": "DUEDATE_ASC",
  "status": "ACTIVE",
  "offset": 0,
  "limit": 10
}
```

Alle felter er valgfrie:

| Felt | Værdier/default |
| --- | --- |
| `orderBy` | `DUEDATE_ASC` (default), `DUEDATE_DESC`, `TITLE_ASC`, `TITLE_DESC` |
| `status` | `ACTIVE`, `OVERDUE`, `null`/udeladt for alle |
| `offset` | heltal >= 0, default 0 |
| `limit` | heltal 1–100, default 10 |

Tom default-body er gyldig:

```json
{}
```

Der er ikke et `agencyIds`-filter i første version. Ukendte felter afvises med
HTTP 400.

### Response

```json
{
  "hitcount": 1,
  "status": "OK",
  "items": [
    {
      "id": "45fb4d52-d7f7-4c36-a94f-37a00eb60163",
      "agencyId": "710100",
      "source": "OPENUSERSTATUS",
      "sourceLoanId": "120200589",
      "dueDate": "2026-09-23T22:00:00.000Z",
      "status": "ACTIVE",
      "sourceMaterialId": "23424916",
      "sourceMaterialIdType": "FAUST",
      "snapshot": {
        "version": 1,
        "pid": null,
        "workId": null,
        "title": "Efter uvejret",
        "creator": null,
        "materialType": "Bog",
        "workType": null,
        "edition": "1. udgave",
        "pages": "196 sider",
        "publisher": "Borgen 2007",
        "language": "dan"
      }
    }
  ]
}
```

Semantik:

- `hitcount` beregnes efter statusfilter og før pagination;
- rækkefølgen er deterministisk og har UUID som tie-breaker;
- titel sorteres via dansk ICU-collation, null sidst;
- `dueDate` er RFC 3339 og kan blive serialiseret som UTC `Z`, selv hvis input
  havde et lokalt offset;
- UserData beregner `ACTIVE`/`OVERDUE` efter `Europe/Copenhagen`; FBI API må
  ikke genberegne status ved at slice timestamp-strengen;
- `status: OK` betyder et succesfuldt opslag;
- `CONSENT_REQUIRED` er reserveret til den kommende consent-story og vil da
  blive returneret sammen med `hitcount: 0` og `items: []`;
- `userId`, `ingestionMethod`, `titleSort` og interne timestamps returneres
  ikke.

### Anbefalet GraphQL-flytning

Den moderne schemaform bør være:

```graphql
extend type Patron {
  loans(
    orderBy: OrderLoansByEnum
    status: PatronLoanStatusEnum
    offset: Int
    limit: PaginationLimitScalar
  ): PatronLoans!
}

type PatronLoans {
  hitcount: Int!
  status: PatronLoansOverallStatusEnum!
  items: [PatronLoanItem!]!
}
```

`PatronLoans.items` må efter cutover ikke have argumenter eller udføre ny
sortering/pagination.

Gatewaymapping:

```text
PatronLoans.hitcount       <- response.hitcount
PatronLoans.status         <- response.status
PatronLoans.items          <- response.items i uændret rækkefølge
PatronLoanItem.id          <- item.id (offentligt UserData-UUID)
PatronLoanItem.dueDate     <- item.dueDate
PatronLoanItem.status      <- item.status
PatronLoanItem.account     <- find konto via item.agencyId
PatronLoanItem.agency      <- eksisterende library-opslag via item.agencyId
PatronLoanItem.snapshot    <- item.snapshot
```

FBI API skal ikke længere mappe `loanId -> id` eller bygge snapshot fra
`titleId/title/creator/materialType`.

Materialeopslag:

- `sourceMaterialIdType: FAUST`: brug `sourceMaterialId` som faustnummer til
  manifestation-opslag;
- `PID`: kan mappes til PID-opslag, når gatewayen understøtter det;
- `null`, `OTHER` eller ukendt type: returnér materialefeltet som null, medmindre
  en eksplicit adapter er implementeret;
- snapshot er fallback, hvis materialeopslag ikke kan løses.

Tilføj `CONSENT_REQUIRED` til gatewayens overall-status enum, før consent
aktiveres i UserData.

## ADD `/v2/loan/add`

ADD opretter kun serverklassificerede `MANUAL`-rækker. Klienten kan ikke sende
`ingestionMethod`.

Endpointet er beskyttet af UserData-konfigurationen:

```text
LOAN_MANUAL_ADDS_ENABLED
```

Default er true uden for production og false i production. FBI API kan som
ekstra sikkerhed undlade at eksponere mutationens schemafelt, medmindre det er
aktiveret for den pågældende deployment/kunde.

### Request

```json
{
  "loans": [
    {
      "agencyId": "710100",
      "source": "MANUAL",
      "sourceLoanId": "optional-idempotency-key",
      "dueDate": "2026-09-24T00:00:00+02:00",
      "sourceMaterialId": "23424916",
      "sourceMaterialIdType": "FAUST",
      "snapshot": {
        "pid": null,
        "workId": null,
        "title": "Efter uvejret",
        "creator": null,
        "materialType": "Bog",
        "workType": null,
        "edition": "1. udgave",
        "pages": "196 sider",
        "publisher": "Borgen 2007",
        "language": "dan"
      }
    }
  ]
}
```

Batchkrav:

- `loans` er required og skal indeholde 1–100 elementer;
- hele body og hvert item er strict; ukendte felter afvises;
- strukturel validering sker før første database-write;
- et strukturelt gyldigt batch returnerer ét resultat pr. input i samme
  rækkefølge, også ved dubletter og per-item databasefejl.

Inputfelter:

| Felt | Krav |
| --- | --- |
| `agencyId` | required, non-empty string, maks. 128 tegn |
| `source` | optional; default `MANUAL`; `^[A-Z][A-Z0-9_-]{0,63}$` |
| `sourceLoanId` | optional; non-empty string, maks. 512 tegn; UserData genererer UUID ved udeladelse |
| `dueDate` | required RFC 3339 timestamp med `Z` eller eksplicit offset |
| `sourceMaterialId` | optional string/null |
| `sourceMaterialIdType` | optional string/null; samme uppercase identifier-format som source |
| `snapshot` | required object; alle metadatafelter i objektet er optional/string/null |

Tilladte snapshot-inputfelter:

```text
pid
workId
title
creator
materialType
workType
edition
pages
publisher
language
```

FBI API må ikke sende `snapshot.version`; UserData tilføjer `version: 1` og
normaliserer manglende kendte felter til null. En ikke-null snapshotværdi skal
være en non-empty string.

### Source-idempotens

Manuel unikhed er:

```text
authenticated userId + agencyId + MANUAL + source + sourceLoanId
```

Hvis `sourceLoanId` udelades, genererer UserData et UUID, og hvert kald opretter
et nyt testlån.

Hvis hele identiteten allerede findes:

- eksisterende række ændres ikke;
- due date og snapshot overskrives ikke;
- eksisterende offentligt UUID returneres;
- status bliver `already_exists`.

Samme `sourceLoanId` hos en anden bruger, agency eller source er ikke en
konflikt. En fremtidig `HARVEST`-række med samme source-identitet er heller
ikke en konflikt.

### Response

```json
{
  "results": [
    {
      "id": "45fb4d52-d7f7-4c36-a94f-37a00eb60163",
      "source": "MANUAL",
      "sourceLoanId": "optional-idempotency-key",
      "status": "ok"
    },
    {
      "id": "77ef8dd5-fd79-4593-9dd6-93caf18850c8",
      "source": "MANUAL",
      "sourceLoanId": "duplicate-key",
      "status": "already_exists"
    }
  ]
}
```

Per-item-status:

```text
ok
already_exists
unknown_error
```

`id` er kun null ved `unknown_error`.

Når det separate loan-consent-felt implementeres, vil ADD desuden kræve aktivt
samtykke og ellers returnere HTTP 403 `LOAN_CONSENT_REQUIRED`. Det check er
reserveret, men ikke aktivt i den nuværende UserData-version.

## DELETE `/v2/loan/delete`

### Request

```json
{
  "loanIds": [
    "45fb4d52-d7f7-4c36-a94f-37a00eb60163"
  ]
}
```

- `loanIds` er required med 1–100 UUID'er;
- ID'et er det offentlige UserData `Loan.id`, ikke `sourceLoanId`;
- UserData scopes altid på den autentificerede bruger;
- fremmede UUID'er behandles som `not_found` og afslører ingen data.

Intern UserData-semantik, som FBI API ikke skal efterligne:

- `MANUAL` slettes permanent;
- `HARVEST` fjernes atomisk og erstattes af en permanent minimal suppression;
- suppression forhindrer fremtidig genhøstning/visning;
- gentaget delete af samme suppressed offentlige UUID er idempotent `ok`;
- suppression har ingen TTL;
- en kommende consent-tilbagetrækning sletter både loans og suppressions.

### Response

```json
{
  "results": [
    {
      "id": "45fb4d52-d7f7-4c36-a94f-37a00eb60163",
      "sourceLoanId": "120200589",
      "status": "ok"
    },
    {
      "id": "62f80fc3-bd14-44c3-a79f-f88c552b4793",
      "sourceLoanId": null,
      "status": "not_found"
    }
  ]
}
```

Per-item-status:

```text
ok
not_found
unknown_error
```

Dubletter i requesten giver ét resultat pr. input i samme rækkefølge.

## HTTP-fejlkontrakt

Alle ikke-2xx svar har formen:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "..."
  }
}
```

| HTTP | Code | Betydning |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | Ugyldig JSON, body, felt eller værdi |
| 401 | `MISSING_ACCESS_TOKEN` | Manglende/malformed Bearer-header |
| 401 | `INVALID_ACCESS_TOKEN` | Smaug eller userinfo afviser token |
| 403 | `MISSING_USER_ID` | `userinfo.attributes.uniqueId` mangler |
| 403 | `LOAN_MANUAL_ADDS_DISABLED` | Manuel ADD er ikke aktiveret |
| 403 | `LOAN_CONSENT_REQUIRED` | Reserveret til kommende consent-check |
| 500 | `INTERNAL_ERROR` | Uventet intern fejl uden per-item-resultat |
| 503 | `AUTH_SERVICE_UNAVAILABLE` | Smaug/userinfo timeout, 5xx eller ugyldig JSON |

FBI API bør mappe auth-fejl til sin eksisterende unauthenticated-status,
manual-add-disabled til en stabil mutation-fejl/status og øvrige servicefejl
til `FAILED`, uden at medtage Authorization eller rå datasource-request i logs.

## Datasource-checkliste

Opret tre separate datasources/loaders, eksempelvis:

```text
userDataV2GetLoans
userDataV2AddLoans
userDataV2DeleteLoans
```

For alle tre:

- brug de præcise routes og HTTP-metoder ovenfor;
- forward `Authorization: Bearer ${context.accessToken}`;
- send aldrig user ID eller Smaug/bookmark context i body;
- parse UserDatas stabile error envelope og bevar `error.code` til resolverens
  statusmapping;
- log aldrig token/header/requestobjekt med credentials;
- undgå at genbruge legacy `loans`-loaderen, så V1 og Patron V2 ikke kobles;
- mutation-loaders skal ryddes efter kald eller på anden måde undgå DataLoader-
  caching af writes, som Bookmark V2 gør.

## Resolver-checkliste

### `Patron.loans`

- kræv `context.accessToken`;
- send kun GET-argumenterne og tokenet;
- brug service-hitcount og service-status direkte;
- returnér items uændret og i serviceorden;
- udfør ikke nested pagination/filter/sortering.

### `PatronLoanItem`

- brug `id`, ikke `loanId`;
- brug serviceberegnet `status`;
- map account/agency via `agencyId`;
- brug canonical `snapshot` direkte;
- resolve manifestation/materiale ud fra
  `sourceMaterialIdType/sourceMaterialId`;
- behold snapshot som fallback ved manglende materialeopslag.

### Mutationer

- oversæt GraphQL-input til præcis ADD/DELETE-body;
- send ikke `ingestionMethod` eller `snapshot.version`;
- bevar ét statusitem pr. input i samme rækkefølge;
- map lowercase service-statuser deterministisk til GraphQL enums;
- ADD-feltet kan skjules i deployments, hvor manuelle adds ikke skal tilbydes;
- DELETE sender offentlige UserData-UUID'er fra GET-resultaterne.

## Kendte efterfølgende opgaver

- separat loan-consent-felt i UserData;
- consent epoch/race-beskyttelse og sletning af Loan/LoanSuppression ved
  tilbagetrækning;
- intern harvesting med suppression-check før upsert;
- eventuelle nye sourcefelter og snapshot-versioner, når de faktiske
  leverandørkontrakter kendes;
- FBI API GraphQL-schema/mutationsdesign og cutover fra OpenUserStatus.

UserData-modellen er bevidst evolvérbar: stabil identitet og queryfelter er
typede kolonner, mens udstillingsmetadata ligger i et versionsstyret JSONB-
snapshot. FBI API bør derfor behandle ukendte fremtidige nullable metadata som
additive kontraktudvidelser.
