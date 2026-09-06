# Feedback som utvecklingsuppdrag

2026-09-06: Bidrakartan använder den gemensamma widgeten `@vibe/support-widget` 0.3.1.

Appägaren kan ansluta Utvecklarläge i feedbackwidgeten och sedan uttryckligen godkänna implementation och publicering per rapport. Beskrivningen är uppdraget; extra instruktion är valfri. Bilagor och den godkända sidkontexten följer med. Vanlig feedback utan kryss startar ingen kodkörning.

Cloud lagrar kö och resultat. En dold Windows-uppgift på utvecklingsdatorn hämtar ett uppdrag i taget, arbetar i separata kopior och kör kontroller. När kön varit tom i 45 sekunder publiceras godkända ändringar tillsammans på Fly. Publicerad visas först när versionen verifierats på sajten. Datorn måste vara vaken och inloggad; inkommande rapporter finns kvar i Cloud när den är offline.

Pilotens lokala konfiguration finns i `C:/Projects/vibe-development-service/bidrakartan/config.json`. Endast appfiler under `src/` och `public/` tillåts, med undantag för tester och särskilt skyddade filer. Högst 20 jobb per dygn och 20 minuter per jobb. Driftfel, konflikter och ändringar av backend, beroenden eller behörigheter kan behöva manuell hantering.

Den gemensamma implementationen och driftguiden finns i Vibe Cloud: `docs/feedback-automation.md` i arbetskopian `C:/Projects/vibe-org/vibe-cloud-feedback`. Kunskapsbasens aktuella ingång är `C:/Projects/projektportfolj/README.md`. Cloud innehåller ingen Bidrakartan-specifik agentlogik.
