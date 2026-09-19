VIRTUAL PLAYER

Klar til GitHub Pages.

1. Upload indholdet af denne mappe til et GitHub repository.
2. Aktivér GitHub Pages.
3. Åbn siden og log ind med den bruger, du oprettede i Supabase Authentication.

Musikken ligger IKKE i denne ZIP. Appen henter den efter login fra den private Supabase Storage bucket "Virtual player".

Appen kan: liste MP3-filer, afspille, pause, forrige/næste, automatisk næste nummer og slette filer efter bekræftelse.

VIGTIGT: Secret/service_role-nøgler må aldrig lægges i app.js. Appen bruger kun Supabase publishable key.
