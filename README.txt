VIRTUAL PLAYER

Klar til GitHub Pages.

1. Upload indholdet af denne mappe til et GitHub repository.
2. Aktivér GitHub Pages.
3. Åbn siden og log ind med den bruger, du oprettede i Supabase Authentication.

Musikken ligger IKKE i denne ZIP. Appen henter den efter login fra den private Supabase Storage bucket "Virtual player".

Appen kan: liste MP3-filer, afspille, pause, forrige/næste, automatisk næste nummer og slette filer efter bekræftelse.

VIGTIGT: Secret/service_role-nøgler må aldrig lægges i app.js. Appen bruger kun Supabase publishable key.


NYT: 'Hent musik' viser en Hent-knap ved hvert nummer. MP3-filen hentes fra den private Supabase-bucket og gemmes via telefonens/browserens normale downloadfunktion. På iPhone findes den normalt i Arkiver > Downloads.

NYT: 'Slet mapper' lader dig markere flere musikmapper og slette alle MP3-filer i dem direkte fra Supabase efter en tydelig bekræftelse.
