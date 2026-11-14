## [t1] Plan custom-domain multi-club tenancy
- Codebase/domain discoveries: `app.js` globally authenticates before module mounts; `feature.js` caches one singleton `club_features` map; app and SPA are same-origin on one server; schema has singleton settings/site state and globally unique court numbers/site slugs; jobs, role channels, and file storage are global by kind.
- Wrong assumptions and corrections: the supplied rearchitecture context (`context.md`, `board.md`, `decisions.md`, role log/inbox, and artifact tree) did not exist in this workspace; no upstream artifact was provided. The repository has an empty migration directory and no tenant/domain registry.
- Techniques/patterns worth reusing: use host-resolved trusted tenant context, bind it to sessions, scope query and side-effect layers as well as routes, preserve the current records under a stable default tenant, and test the migration on a copied legacy DB before cutover.
- Learnings consumed: [(none)]
