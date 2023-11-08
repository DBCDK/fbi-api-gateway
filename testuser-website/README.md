This is a test user login page, that is embedded in FBI-API.

## Getting Started

Setup dev environment variables:
 - copy *.env.local_template* to *.env.local*
 - Edit variables inside *.env.local*

 note that these variables are not necessary in production, since configuration is POST'ed
 from the origin website. In dev mode however, it may be nice to use the login page without coming
 from origin website.


run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
