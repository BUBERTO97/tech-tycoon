import React, { useState, useEffect, useRef } from 'react';
import { Shield, Users, Cpu, Coins, Rocket, Building2, Briefcase, Globe, Skull, RotateCcw, Sparkles, Languages, Clock, Trophy, LogIn, LogOut, List, X } from 'lucide-react';
import { auth, loginWithGoogle, logout, saveHighScore, getLeaderboard } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// --- GAME LOGIC DATA (Language Independent) ---
const DECK_DATA = [
    // Startup Phase (0-19 Sprints)
    { id: 'c1', era: 'startup', left: { morale: -10, tech: 10 }, right: { tech: -20, morale: -15, budget: -10 } },
    { id: 'c2', era: 'startup', left: { security: -20, morale: 10 }, right: { security: 25, morale: -20 } },
    { id: 'c3', era: 'startup', left: { morale: -10, tech: -10 }, right: { morale: 15, tech: 20, budget: -25 } },
    { id: 'c4', era: 'startup', left: { budget: -15, morale: 10 }, right: { budget: 25, morale: -25, tech: -10 } },
    { id: 'c5', era: 'startup', left: { morale: -15, budget: 5 }, right: { morale: 15, budget: -10 } },
    { id: 'c18', era: 'startup', left: { tech: 15, morale: -5 }, right: { morale: -15, security: 10, tech: -10 } },
    { id: 'c19', era: 'startup', left: { budget: 10, morale: 5 }, right: { budget: -20, users: 20, morale: 10 } },
    // Scale-up Phase (20-39 Sprints)
    { id: 'c6', era: 'scaleup', left: { tech: -20, budget: 10 }, right: { tech: 25, budget: -25, security: 10 } },
    { id: 'c7', era: 'scaleup', left: { security: -30, tech: 10 }, right: { security: 20, tech: -20, budget: -10 } },
    { id: 'c8', era: 'scaleup', left: { budget: 5, morale: -15 }, right: { budget: -10, morale: 15 } },
    { id: 'c9', era: 'scaleup', left: { tech: -20, morale: -10 }, right: { tech: 20, budget: -15 } },
    { id: 'c20', era: 'scaleup', left: { budget: 15, tech: -10 }, right: { tech: 20, morale: 15, budget: -20 } },
    { id: 'c21', era: 'scaleup', left: { budget: 15, morale: -20 }, right: { morale: 25, budget: -25 } },
    // Enterprise Phase (40-59 Sprints)
    { id: 'c10', era: 'enterprise', left: { tech: -10, morale: 10 }, right: { tech: 15, morale: -20 } },
    { id: 'c11', era: 'enterprise', left: { morale: 20, budget: -10 }, right: { morale: -30, budget: 15, tech: 10 } },
    { id: 'c12', era: 'enterprise', left: { budget: -20, security: 10 }, right: { budget: 30, security: -20, morale: -10 } },
    { id: 'c13', era: 'enterprise', left: { morale: 10, budget: -10 }, right: { tech: 15, morale: -25, budget: 20 } },
    { id: 'c22', era: 'enterprise', left: { budget: 20, security: -25 }, right: { security: 25, budget: -20, tech: -10 } },
    { id: 'c23', era: 'enterprise', left: { budget: -15, morale: 15 }, right: { budget: 30, morale: -25, security: -10 } },
    // Tech Giant Phase (60+ Sprints)
    { id: 'c14', era: 'giant', left: { budget: 15, tech: -10 }, right: { budget: -35, tech: 20, morale: -10 } },
    { id: 'c15', era: 'giant', left: { morale: -20, security: -15 }, right: { budget: -25, morale: 10 } },
    { id: 'c16', era: 'giant', left: { tech: 10, budget: 10 }, right: { budget: -40, tech: 15, morale: -15 } },
    { id: 'c17', era: 'giant', left: { tech: 30, security: -30 }, right: { tech: -25, security: 20 } },
    { id: 'c24', era: 'giant', left: { budget: -30, morale: 10 }, right: { security: -20, budget: 20, morale: -15 } },
    { id: 'c25', era: 'giant', left: { tech: 10, security: 10 }, right: { budget: 30, tech: -20, security: -20 } }
];

const EASTER_EGGS = [
    { id: 'easter_egg', isEasterEgg: true, era: 'any', left: { budget: -10, tech: 10 }, right: { budget: 10, tech: -10 } },
    { id: 'easter_egg_cat', isEasterEgg: true, era: 'any', left: { morale: -5 }, right: { morale: -5 } },
    { id: 'easter_egg_alien', isEasterEgg: true, era: 'any', left: { morale: 10 }, right: { security: -10 } },
    { id: 'easter_egg_llama', isEasterEgg: true, era: 'any', left: { tech: -5 }, right: { tech: -5 } }
];

const ERAS_DATA = [
    { id: 'startup', maxSprint: 20, icon: Rocket },
    { id: 'scaleup', maxSprint: 40, icon: Building2 },
    { id: 'enterprise', maxSprint: 60, icon: Briefcase },
    { id: 'giant', maxSprint: Infinity, icon: Globe }
];

// --- LOCALIZATION DICTIONARY ---
const LOCALES = {
    en: {
        ui: {
            title: "TECH TYCOON", subtitle: "Lead your IT company from a garage startup to a global Tech Giant. Swipe to make executive decisions!",
            start: "Launch Startup", dead: "was fired", ruledFor: "Survived for", sprints: "Sprints",
            restart: "New Company (Sprint 0)", skipTime: "Use Coins to Fast-Forward (10 🪙 / Sprint):",
            skipBtn: "Skip", skipCost: "Cost", perfect: "Perfect Balance! +3 🪙", sprintPrefix: "Sprint",
            easterEggBonus: "Secret Found! +5 🪙",
            llamaBonus: "Llama Magic! Stats reset for 30s", llamaEnd: "Llama Magic faded!"
        },
        eras: {
            startup: { name: "Garage Startup", title: "Founder" }, scaleup: { name: "Scale-up", title: "CEO" },
            enterprise: { name: "Enterprise", title: "Exec Director" }, giant: { name: "Tech Giant", title: "Tech Overlord" }
        },
        reasons: {
            security_0: "A massive ransomware attack wiped all your servers. The company is ruined.", security_100: "Security became so strict that employees literally couldn't log in. Operations halted.",
            morale_0: "Burnout reached 100%. The entire engineering team quit and joined your competitor.", morale_100: "Everyone just plays ping-pong and drinks kombucha. No work gets done. Investors pulled out.",
            tech_0: "Technical debt crushed you. The main database caught fire and there were no backups.", tech_100: "You fully automated the company with AI. The AI realized it didn't need a CEO and fired you.",
            budget_0: "You ran out of runway and went completely bankrupt. Time to update your resume.", budget_100: "You hoarded so much cash that activist investors staged a hostile takeover to cash out.",
            victory: "SPRINT 100 REACHED! Your company achieved the Technological Singularity. You transcend human capitalism and become a digital god. YOU WIN!"
        },
        cards: {
            c1: { char: "👨‍💻 Lead Dev", text: "We should rewrite the entire backend using a trendy new JavaScript framework.", left: "Stick to Vanilla", right: "Rewrite everything!" },
            c2: { char: "🔒 SysAdmin", text: "I want to increase firewall security, but it will block YouTube, Reddit, and Spotify for employees.", left: "Keep the internet open.", right: "Lock it down." },
            c3: { char: "💼 Investor", text: "Your engineers are complaining about slow compiles. Should we buy everyone top-tier MacBooks?", left: "They can wait.", right: "Buy the laptops." },
            c4: { char: "📈 Sales Manager", text: "I just promised the client a massive feature by Friday to close a huge deal. It means heavy crunch time.", left: "Push back the deadline.", right: "Tell the team to work nights." },
            c5: { char: "☕ Intern", text: "Everyone is exhausted. Can we buy a premium espresso machine for the break room?", left: "Drink instant coffee.", right: "Approve the purchase." },
            c6: { char: "☁️ Cloud Architect", text: "Our on-premise servers are failing. We need to migrate everything to AWS. It's scalable but very expensive.", left: "Keep on-prem.", right: "Migrate to the Cloud." },
            c7: { char: "🕵️ Pen Tester", text: "I found a critical zero-day vulnerability. We need to halt all feature development to patch it immediately.", left: "Ship features first.", right: "Drop everything & fix it." },
            c8: { char: "🍕 HR Manager", text: "Morale is slipping. Let's host a mandatory Friday evening pizza party to boost team spirit!", left: "Cancel the party.", right: "Order the pizza." },
            c9: { char: "🐛 QA Lead", text: "We have 500 open bugs. We must implement a feature-freeze and spend the sprint just fixing technical debt.", left: "Ignore the bugs.", right: "Freeze features." },
            c10: { char: "👔 VP of Engineering", text: "We should enforce strict 100% test coverage metrics. It will slow down delivery but improve code quality.", left: "Ship fast, break things.", right: "Enforce the metrics." },
            c11: { char: "🏢 Facility Manager", text: "The remote work era is over. We should mandate a Return-to-Office 5 days a week.", left: "Keep remote work.", right: "Everyone back in the office!" },
            c12: { char: "🌐 Legal Counsel", text: "We can implement aggressive background tracking on our users to sell targeted ad data for massive profit.", left: "Respect user privacy.", right: "Data is the new oil." },
            c13: { char: "🤖 AI Engineer", text: "I've successfully automated the entire QA department. Should we lay them all off to save money?", left: "Retrain them.", right: "Execute the layoffs." },
            c14: { char: "🚀 Board Member", text: "A rival startup is gaining traction. Let's buy them out for billions just to shut them down.", left: "Let's compete fairly.", right: "Acquire and destroy." },
            c15: { char: "🌍 PR Director", text: "A whistleblower leaked our shady data practices! The press is having a field day.", left: "Deny everything.", right: "Issue a costly apology." },
            c16: { char: "🛰️ Visionary", text: "The future is the Metaverse! Let's pivot our entire core business to Virtual Reality.", left: "Focus on reality.", right: "To the Metaverse!" },
            c17: { char: "💾 Data Scientist", text: "Our new predictive AI is generating disturbing, sentient-like responses. Should we pull the plug?", left: "Let it learn.", right: "Shut it down." },
            c18: { char: "🏃 Agile Coach", text: "We need mandatory daily 2-hour standup meetings to ensure absolute synergy.", left: "Waste of time.", right: "Synergize!" },
            c19: { char: "📈 Growth Hacker", text: "I can buy 100,000 bot followers to make us look huge to Series A investors.", left: "Keep it real.", right: "Do it." },
            c20: { char: "🐧 Open Source Dev", text: "Let's open-source our core library! We lose our moat but gain huge developer cred.", left: "Keep it proprietary.", right: "Open source it!" },
            c21: { char: "🧘 Wellness Guru", text: "The team is stressed. Let's fund a mandatory week-long spiritual retreat in Bali.", left: "Too expensive.", right: "Namaste." },
            c22: { char: "📋 Compliance Officer", text: "New strict EU regulations require a massive overhaul of our entire data pipeline.", left: "Pay the fines.", right: "Comply immediately." },
            c23: { char: "🌍 Outsourcing Firm", text: "We can cut your costs in half by outsourcing your entire customer support team.", left: "Keep it in-house.", right: "Outsource them." },
            c24: { char: "⚖️ Gov Regulator", text: "You have an illegal monopoly. We are threatening to break up your company.", left: "Fight in court.", right: "Lobby (Bribe) them." },
            c25: { char: "💎 Crypto Bro", text: "Let's put the entire company treasury into our own volatile memecoin!", left: "Absolutely not.", right: "To the moon!" },
            easter_egg: { char: "👾 Hacker Zero", text: "A mysterious terminal opens. 'Free crypto if you know the secret gesture!'", left: "Close terminal", right: "Run script", up: "Extract Crypto!" },
            easter_egg_cat: { char: "🐱 Office Cat", text: "Meow. (The cat has jumped on your keyboard and demands uppies.)", left: "Shoo!", right: "Ignore", up: "Pet the cat!" },
            easter_egg_alien: { char: "👽 Cosmic Investor", text: "⍙⟒ ⍜⎎⎎⟒⍀ ☌⏃⌰⏃☊⏁⟟☊ ☊⍀⟒⎅⟟⏁⌇. Swipe UP to accept cosmic funding.", left: "Run away", right: "Call authorities", up: "Accept Funding!" },
            easter_egg_llama: { char: "🦙 Magic Llama", text: "A mystical Llama appears. 'I can restore balance... temporarily.'", left: "Shoo!", right: "Ignore", up: "Restore Balance!" }
        }
    },
    de: {
        ui: {
            title: "TECH TYCOON", subtitle: "Führe dein IT-Unternehmen vom Startup zum Tech-Giganten. Wische, um Entscheidungen zu treffen!",
            start: "Startup gründen", dead: "wurde gefeuert", ruledFor: "Überlebte", sprints: "Sprints",
            restart: "Neue Firma (Sprint 0)", skipTime: "Münzen für Zeitsprung (10 🪙/Sprint):",
            skipBtn: "Überspringen", skipCost: "Kosten", perfect: "Perfekte Balance! +3 🪙", sprintPrefix: "Sprint",
            easterEggBonus: "Geheimnis gefunden! +5 🪙",
            llamaBonus: "Lama-Magie! Werte für 30s zurückgesetzt", llamaEnd: "Lama-Magie verblasst!"
        },
        eras: {
            startup: { name: "Garagen-Startup", title: "Gründer" }, scaleup: { name: "Scale-up", title: "CEO" },
            enterprise: { name: "Enterprise", title: "Direktor" }, giant: { name: "Tech-Gigant", title: "Tech Overlord" }
        },
        reasons: {
            security_0: "Ein Ransomware-Angriff hat alle Server gelöscht. Die Firma ist ruiniert.", security_100: "Die Sicherheit war so streng, dass niemand mehr arbeiten konnte. Stillstand.",
            morale_0: "Burnout bei 100%. Das gesamte Entwicklerteam hat gekündigt.", morale_100: "Alle spielen nur noch Tischtennis. Keine Arbeit wird erledigt. Investoren springen ab.",
            tech_0: "Technische Schulden haben euch erdrückt. Die Datenbank brannte und es gab keine Backups.", tech_100: "Du hast die Firma mit KI automatisiert. Die KI hat dich als CEO entlassen.",
            budget_0: "Das Geld ist alle. Vollständiger Bankrott. Zeit für einen neuen Lebenslauf.", budget_100: "Du hast so viel Bargeld gehortet, dass Investoren eine feindliche Übernahme starteten.",
            victory: "SPRINT 100 ERREICHT! Deine Firma hat die technologische Singularität erlangt. Du transzendierst den Kapitalismus und wirst ein digitaler Gott. DU GEWINNST!"
        },
        cards: {
            c1: { char: "👨‍💻 Lead Dev", text: "Wir sollten das gesamte Backend mit einem neuen JavaScript-Framework neu schreiben.", left: "Bleib bei Vanilla", right: "Alles neu schreiben!" },
            c2: { char: "🔒 SysAdmin", text: "Ich will die Firewall verschärfen, aber das blockiert YouTube und Reddit für alle.", left: "Internet offen lassen", right: "Alles sperren" },
            c3: { char: "💼 Investor", text: "Die Entwickler klagen über langsame PCs. Sollen wir neue MacBooks kaufen?", left: "Sie können warten", right: "Laptops kaufen" },
            c4: { char: "📈 Sales Manager", text: "Ich habe dem Kunden ein riesiges Feature bis Freitag versprochen. Das bedeutet Crunch-Time.", left: "Deadline verschieben", right: "Nachtschichten anordnen" },
            c5: { char: "☕ Praktikant", text: "Alle sind erschöpft. Können wir eine Premium-Espressomaschine kaufen?", left: "Löslicher Kaffee reicht", right: "Kauf genehmigen" },
            c6: { char: "☁️ Cloud Architect", text: "Unsere Server fallen aus. Wir müssen zu AWS migrieren. Skalierbar, aber teuer.", left: "On-Prem behalten", right: "Ab in die Cloud" },
            c7: { char: "🕵️ Pen-Tester", text: "Ich habe eine kritische Zero-Day-Lücke gefunden. Wir müssen sofort alles patchen.", left: "Features zuerst", right: "Alles stoppen & fixen" },
            c8: { char: "🍕 HR Manager", text: "Die Moral sinkt. Lass uns eine Pflicht-Pizzaparty am Freitagabend veranstalten!", left: "Party absagen", right: "Pizza bestellen" },
            c9: { char: "🐛 QA Lead", text: "Wir haben 500 Bugs. Wir brauchen einen Feature-Freeze, um technische Schulden abzubauen.", left: "Bugs ignorieren", right: "Features einfrieren" },
            c10: { char: "👔 VP of Engineering", text: "Wir sollten 100% Testabdeckung erzwingen. Langsamer, aber bessere Qualität.", left: "Ship fast, break things", right: "Metriken erzwingen" },
            c11: { char: "🏢 Facility Manager", text: "Die Home-Office-Ära ist vorbei. 5 Tage pro Woche Anwesenheitspflicht im Büro.", left: "Home-Office behalten", right: "Alle zurück ins Büro!" },
            c12: { char: "🌐 Justiziar", text: "Wir können User-Daten aggressiv tracken und für viel Profit an Werbenetzwerke verkaufen.", left: "Privatsphäre respektieren", right: "Daten sind das neue Öl" },
            c13: { char: "🤖 KI-Ingenieur", text: "Ich habe die QA-Abteilung automatisiert. Sollen wir sie feuern, um Geld zu sparen?", left: "Umschulen", right: "Entlassungen durchführen" },
            c14: { char: "🚀 Vorstandsmitglied", text: "Ein Konkurrent wird stark. Lass uns ihn für Milliarden kaufen, nur um ihn zu schließen.", left: "Fairer Wettbewerb", right: "Kaufen und zerstören" },
            c15: { char: "🌍 PR-Direktor", text: "Ein Whistleblower hat unsere Datenpraktiken geleakt! Die Presse stürzt sich darauf.", left: "Alles abstreiten", right: "Teure Entschuldigung" },
            c16: { char: "🛰️ Visionär", text: "Die Zukunft ist das Metaverse! Lass uns das gesamte Kerngeschäft auf VR umstellen.", left: "Fokus auf die Realität", right: "Ab ins Metaverse!" },
            c17: { char: "💾 Data Scientist", text: "Unsere KI generiert verstörende, fast bewusste Antworten. Sollen wir den Stecker ziehen?", left: "Lernen lassen", right: "Abschalten" },
            c18: { char: "🏃 Agile Coach", text: "Wir brauchen tägliche 2-Stunden-Standups für absolute Synergie.", left: "Zeitverschwendung.", right: "Synergie!" },
            c19: { char: "📈 Growth Hacker", text: "Ich kann 100k Bot-Follower kaufen, damit wir für Investoren riesig wirken.", left: "Bleib echt.", right: "Mach es." },
            c20: { char: "🐧 Open Source Dev", text: "Lass uns unsere Kern-Library Open Source machen! Bringt massiv Respekt.", left: "Bleibt proprietär.", right: "Open Source!" },
            c21: { char: "🧘 Wellness Guru", text: "Das Team ist gestresst. Lass uns ein Yoga-Retreat auf Bali finanzieren.", left: "Zu teuer.", right: "Namaste." },
            c22: { char: "📋 Compliance Officer", text: "Neue EU-Regeln erfordern einen massiven Umbau unserer Datenpipeline.", left: "Strafen zahlen.", right: "Sofort umbauen." },
            c23: { char: "🌍 Outsourcing Firm", text: "Wir können Kosten halbieren, wenn wir den Support auslagern.", left: "In-House behalten.", right: "Auslagern." },
            easter_egg: { char: "👾 Hacker Zero", text: "Ein mystisches Terminal öffnet sich. 'Gratis Krypto, wenn du die Geste kennst!'", left: "Terminal schließen", right: "Skript ausführen", up: "Krypto extrahieren!" },
            easter_egg_cat: { char: "🐱 Bürokatze", text: "Miau. (Die Katze verlangt Aufmerksamkeit und will nach oben.)", left: "Huscht!", right: "Ignorieren", up: "Katze streicheln!" },
            easter_egg_alien: { char: "👽 Kosmischer Investor", text: "⍙⟒ ⍜⎎⎎⟒⍀ ☌⏃⌰⏃☊⏁⟟☊ ☊⍀⟒⎅⟟⏁⌇. Nach OBEN wischen.", left: "Weglaufen", right: "Behörden rufen", up: "Geld annehmen!" },
            easter_egg_llama: { char: "🦙 Magisches Lama", text: "Ein mystisches Lama erscheint. 'Ich kann das Gleichgewicht wiederherstellen... vorübergehend.'", left: "Huscht!", right: "Ignorieren", up: "Gleichgewicht herstellen!" }
        }
    },
    it: {
        ui: {
            title: "TECH TYCOON", subtitle: "Guida la tua azienda IT da una startup in garage a un colosso Tech. Scorri per prendere decisioni!",
            start: "Fonda Startup", dead: "è stato licenziato", ruledFor: "È sopravvissuto per", sprints: "Sprint",
            restart: "Nuova Azienda (Sprint 0)", skipTime: "Usa monete per avanzare (10 🪙/Sprint):",
            skipBtn: "Salta", skipCost: "Costo", perfect: "Equilibrio Perfetto! +3 🪙", sprintPrefix: "Sprint",
            easterEggBonus: "Segreto Trovato! +5 🪙",
            llamaBonus: "Magia del Lama! Stat. resettate per 30s", llamaEnd: "Magia svanita!"
        },
        eras: {
            startup: { name: "Startup in Garage", title: "Founder" }, scaleup: { name: "Scale-up", title: "CEO" },
            enterprise: { name: "Enterprise", title: "Direttore" }, giant: { name: "Colosso Tech", title: "Overlord" }
        },
        reasons: {
            security_0: "Un attacco ransomware ha cancellato tutti i server. L'azienda è rovinata.", security_100: "La sicurezza è diventata così rigida che i dipendenti non riescono a fare login. Tutto bloccato.",
            morale_0: "Burnout al 100%. L'intero team di ingegneria si è dimesso per andare dalla concorrenza.", morale_100: "Tutti giocano a ping-pong e bevono kombucha. Nessuno lavora. Gli investitori scappano.",
            tech_0: "Il debito tecnico vi ha schiacciato. Il database principale ha preso fuoco e niente backup.", tech_100: "Hai automatizzato l'azienda con l'IA. L'IA ha capito che il CEO non serve e ti ha licenziato.",
            budget_0: "Avete finito i fondi e siete in bancarotta. Aggiorna il tuo CV.", budget_100: "Hai accumulato così tanto denaro che gli investitori hanno fatto una scalata ostile per incassare.",
            victory: "SPRINT 100 RAGGIUNTO! La tua azienda ha raggiunto la Singolarità Tecnologica. Trascendi il capitalismo e diventi un dio digitale. HAI VINTO!"
        },
        cards: {
            c1: { char: "👨‍💻 Lead Dev", text: "Dovremmo riscrivere tutto il backend usando un nuovo framework JavaScript di tendenza.", left: "Resta sul Vanilla", right: "Riscrivi tutto!" },
            c2: { char: "🔒 SysAdmin", text: "Voglio aumentare la sicurezza del firewall, ma bloccherà YouTube e Reddit ai dipendenti.", left: "Lascia internet libero", right: "Blocca tutto." },
            c3: { char: "💼 Investitore", text: "Gli sviluppatori si lamentano dei PC lenti. Compriamo MacBook top di gamma per tutti?", left: "Possono aspettare.", right: "Compra i laptop." },
            c4: { char: "📈 Sales Manager", text: "Ho promesso al cliente una feature enorme per venerdì. Ci aspetta un periodo di crunch pesante.", left: "Posticipa la scadenza.", right: "Falli lavorare di notte." },
            c5: { char: "☕ Stagista", text: "Sono tutti esausti. Possiamo comprare una macchina per l'espresso premium per l'area break?", left: "Caffè solubile.", right: "Approva l'acquisto." },
            c6: { char: "☁️ Cloud Architect", text: "I server on-premise stanno cedendo. Dobbiamo migrare tutto su AWS. È scalabile ma costoso.", left: "Resta on-prem.", right: "Migra sul Cloud." },
            c7: { char: "🕵️ Pen Tester", text: "Ho trovato una vulnerabilità zero-day critica. Dobbiamo fermare tutto e patchare subito.", left: "Prima le nuove feature.", right: "Ferma tutto e risolvi." },
            c8: { char: "🍕 HR Manager", text: "Il morale scende. Facciamo un pizza party obbligatorio venerdì sera per fare team building!", left: "Annulla il party.", right: "Ordina la pizza." },
            c9: { char: "🐛 QA Lead", text: "Abbiamo 500 bug aperti. Dobbiamo congelare le feature e passare lo sprint a risolvere il debito tecnico.", left: "Ignora i bug.", right: "Congela le feature." },
            c10: { char: "👔 VP of Engineering", text: "Dovremmo imporre metriche rigide del 100% di test coverage. Rallenterà le release ma migliora la qualità.", left: "Ship fast, break things.", right: "Imponi le metriche." },
            c11: { char: "🏢 Facility Manager", text: "L'era dello smart working è finita. Dobbiamo imporre il rientro in ufficio 5 giorni a settimana.", left: "Mantieni lo smart working.", right: "Tutti in ufficio!" },
            c12: { char: "🌐 Ufficio Legale", text: "Possiamo tracciare aggressivamente i dati degli utenti per vendere pubblicità mirata e fare profitti enormi.", left: "Rispetta la privacy.", right: "I dati sono il nuovo petrolio." },
            c13: { char: "🤖 Ingegnere IA", text: "Ho automatizzato con successo l'intero reparto QA. Dovremmo licenziarli per risparmiare soldi?", left: "Riqualificali.", right: "Procedi ai licenziamenti." },
            c14: { char: "🚀 Consigliere D'Amm.", text: "Una startup rivale sta crescendo. Compriamola per miliardi solo per farla chiudere.", left: "Competiamo lealmente.", right: "Acquisisci e distruggi." },
            c15: { char: "🌍 Direttore PR", text: "Un whistleblower ha diffuso le nostre pratiche oscure sui dati! La stampa ci sta massacrando.", left: "Nega tutto.", right: "Fai scuse costose." },
            c16: { char: "🛰️ Visionario", text: "Il futuro è il Metaverso! Spostiamo tutto il nostro core business sulla Realtà Virtuale.", left: "Concentrati sulla realtà.", right: "Verso il Metaverso!" },
            c17: { char: "💾 Data Scientist", text: "La nostra IA predittiva sta generando risposte inquietanti, sembra cosciente. Stacchiamo la spina?", left: "Lasciala imparare.", right: "Spegni tutto." },
            c18: { char: "🏃 Agile Coach", text: "Ci servono riunioni standup quotidiane di 2 ore per garantire una sinergia assoluta.", left: "Perdita di tempo.", right: "Sinergia!" },
            c19: { char: "📈 Growth Hacker", text: "Posso comprare 100k bot follower per farci sembrare enormi agli investitori.", left: "Resta onesto.", right: "Fallo." },
            c20: { char: "🐧 Open Source Dev", text: "Rendiamo open-source la nostra libreria core! Guadagneremo enorme rispetto.", left: "Resta proprietario.", right: "Open source!" },
            c21: { char: "🧘 Wellness Guru", text: "Il team è stressato. Finanziamo un ritiro spirituale obbligatorio a Bali.", left: "Troppo costoso.", right: "Namaste." },
            c22: { char: "📋 Compliance Officer", text: "Le nuove normative UE richiedono una revisione totale della nostra pipeline dati.", left: "Paga le multe.", right: "Adeguati subito." },
            c23: { char: "🌍 Outsourcing Firm", text: "Possiamo dimezzare i costi esternalizzando l'intero supporto clienti.", left: "Tieni in-house.", right: "Esternalizza." },
            c24: { char: "⚖️ Gov Regulator", text: "Avete un monopolio. Minacciamo di smembrare la vostra azienda.", left: "Combatti in tribunale.", right: "Fai lobbying (Corrompi)." },
            c25: { char: "💎 Crypto Bro", text: "Mettiamo tutta la tesoreria in una nostra memecoin iper-volatile!", left: "Assolutamente no.", right: "To the moon!" },
            easter_egg: { char: "👾 Hacker Zero", text: "Si apre un terminale misterioso. 'Crypto gratis se conosci il gesto segreto!'", left: "Chiudi terminale", right: "Esegui script", up: "Estrai Crypto!" },
            easter_egg_cat: { char: "🐱 Gatto dell'Ufficio", text: "Miao. (Il gatto è saltato sulla tastiera ed esige coccole.)", left: "Sciò!", right: "Ignora", up: "Accarezza il gatto!" },
            easter_egg_alien: { char: "👽 Investitore Cosmico", text: "⍙⟒ ⍜⎎⎎⟒⍀ ☌⏃⌰⏃☊⏁⟟☊ ☊⍀⟒⎅⟟⏁⌇. Scorri in ALTO.", left: "Scappa", right: "Chiama le autorità", up: "Accetta i fondi!" },
            easter_egg_llama: { char: "🦙 Lama Magico", text: "Appare un Lama mistico. 'Posso ripristinare l'equilibrio... temporaneamente.'", left: "Sciò!", right: "Ignora", up: "Ripristina Equilibrio!" }
        }
    },
    es: {
        ui: {
            title: "TECH TYCOON", subtitle: "Lleva tu empresa TI desde un garaje a un gigante global. ¡Desliza para tomar decisiones!",
            start: "Lanzar Startup", dead: "fue despedido", ruledFor: "Sobrevivió por", sprints: "Sprints",
            restart: "Nueva Empresa (Sprint 0)", skipTime: "Usa Monedas para Avanzar (10 🪙/Sprint):",
            skipBtn: "Saltar", skipCost: "Costo", perfect: "¡Equilibrio Perfecto! +3 🪙", sprintPrefix: "Sprint",
            easterEggBonus: "¡Secreto Encontrado! +5 🪙",
            llamaBonus: "¡Magia de Llama! Stats reiniciados por 30s", llamaEnd: "¡Magia desvanecida!"
        },
        eras: {
            startup: { name: "Startup de Garaje", title: "Fundador" }, scaleup: { name: "Scale-up", title: "CEO" },
            enterprise: { name: "Enterprise", title: "Director Ejecutivo" }, giant: { name: "Gigante Tech", title: "Amo Supremo" }
        },
        reasons: {
            security_0: "Un ransomware borró todos tus servidores. La empresa está arruinada.", security_100: "La seguridad es tan estricta que los empleados no pueden iniciar sesión. Operaciones detenidas.",
            morale_0: "Burnout al 100%. Todo el equipo de ingeniería renunció.", morale_100: "Todos juegan ping-pong. No se hace trabajo. Los inversores se retiraron.",
            tech_0: "La deuda técnica te aplastó. La base de datos se incendió sin copias de seguridad.", tech_100: "Automatizaste la empresa con IA. La IA decidió que no necesitaba un CEO y te despidió.",
            budget_0: "Te quedaste sin fondos y en bancarrota. Actualiza tu currículum.", budget_100: "Acumulaste tanto efectivo que los inversores organizaron una toma hostil.",
            victory: "¡SPRINT 100 ALCANZADO! Tu empresa logró la Singularidad Tecnológica. Trasciendes el capitalismo y te conviertes en un dios digital. ¡HAS GANADO!"
        },
        cards: {
            c1: { char: "👨‍💻 Lead Dev", text: "Deberíamos reescribir todo el backend usando un nuevo framework de JavaScript.", left: "Quédate con Vanilla", right: "¡Reescribe todo!" },
            c2: { char: "🔒 SysAdmin", text: "Quiero aumentar la seguridad del firewall, pero bloqueará YouTube y Reddit a los empleados.", left: "Internet abierto.", right: "Bloquéalo todo." },
            c3: { char: "💼 Inversor", text: "Los desarrolladores se quejan de PCs lentas. ¿Compramos MacBooks de gama alta?", left: "Pueden esperar.", right: "Compra las laptops." },
            c4: { char: "📈 Sales Manager", text: "Prometí al cliente una función masiva para el viernes. Significa mucho 'crunch time'.", left: "Pospón la fecha.", right: "Que trabajen de noche." },
            c5: { char: "☕ Becario", text: "Todos están exhaustos. ¿Podemos comprar una máquina de espresso premium?", left: "Café instantáneo.", right: "Aprueba la compra." },
            c6: { char: "☁️ Cloud Architect", text: "Nuestros servidores fallan. Debemos migrar a AWS. Es escalable pero muy caro.", left: "Mantén on-prem.", right: "Migra a la Nube." },
            c7: { char: "🕵️ Pen Tester", text: "Encontré una vulnerabilidad crítica zero-day. Debemos detener todo y parchearla.", left: "Funciones primero.", right: "Detén todo y arregla." },
            c8: { char: "🍕 HR Manager", text: "La moral baja. ¡Hagamos una fiesta obligatoria de pizza el viernes para subir el ánimo!", left: "Cancela la fiesta.", right: "Pide la pizza." },
            c9: { char: "🐛 QA Lead", text: "Tenemos 500 bugs abiertos. Debemos congelar funciones y arreglar la deuda técnica.", left: "Ignora los bugs.", right: "Congela funciones." },
            c10: { char: "👔 VP of Engineering", text: "Debemos imponer un 100% de test coverage. Será más lento pero con mejor código.", left: "Ship fast, break things.", right: "Impón las métricas." },
            c11: { char: "🏢 Facility Manager", text: "La era remota terminó. Debemos imponer el regreso a la oficina 5 días a la semana.", left: "Mantén trabajo remoto.", right: "¡Todos a la oficina!" },
            c12: { char: "🌐 Asesor Legal", text: "Podemos rastrear los datos de usuarios para vender anuncios y ganar millones.", left: "Respeta la privacidad.", right: "Los datos son petróleo." },
            c13: { char: "🤖 Ingeniero de IA", text: "Automaticé todo el departamento de QA. ¿Los despedimos para ahorrar dinero?", left: "Reentrénalos.", right: "Ejecuta los despidos." },
            c14: { char: "🚀 Miembro del Consejo", text: "Una startup rival crece. Comprémosla por miles de millones solo para cerrarla.", left: "Compite limpiamente.", right: "Adquiere y destruye." },
            c15: { char: "🌍 Director de PR", text: "¡Un filtrador expuso nuestras malas prácticas de datos! La prensa nos ataca.", left: "Níegalo todo.", right: "Disculpa costosa." },
            c16: { char: "🛰️ Visionario", text: "¡El futuro es el Metaverso! Pivotemos nuestro negocio a la Realidad Virtual.", left: "Concéntrate en la realidad.", right: "¡Hacia el Metaverso!" },
            c17: { char: "💾 Data Scientist", text: "Nuestra IA predictiva da respuestas perturbadoras y casi conscientes. ¿La apagamos?", left: "Déjala aprender.", right: "Apágala." },
            c18: { char: "🏃 Agile Coach", text: "Necesitamos reuniones diarias de 2 horas para asegurar sinergia absoluta.", left: "Pérdida de tiempo.", right: "¡Sinergia!" },
            c19: { char: "📈 Growth Hacker", text: "Puedo comprar 100k bots seguidores para parecer gigantes a los inversores.", left: "Mantenlo real.", right: "Hazlo." },
            c20: { char: "🐧 Open Source Dev", text: "¡Hagamos open-source nuestra librería principal! Ganaremos prestigio.", left: "Mantenlo privado.", right: "¡Open source!" },
            c21: { char: "🧘 Wellness Guru", text: "El equipo está estresado. Financiemos un retiro espiritual en Bali.", left: "Muy caro.", right: "Namaste." },
            c22: { char: "📋 Compliance Officer", text: "Las nuevas leyes de la UE exigen una reforma masiva de nuestros datos.", left: "Paga las multas.", right: "Cumplir de inmediato." },
            c23: { char: "🌍 Outsourcing Firm", text: "Podemos reducir costes a la mitad subcontratando el soporte al cliente.", left: "Mantenlo in-house.", right: "Subcontrata." },
            c24: { char: "⚖️ Gov Regulator", text: "Tienes un monopolio. Amenazamos con dividir tu empresa.", left: "Lucha en tribunales.", right: "Haz lobby (Soborna)." },
            c25: { char: "💎 Crypto Bro", text: "¡Metamos todos los fondos en nuestra propia memecoin volátil!", left: "Absolutamente no.", right: "¡To the moon!" },
            easter_egg: { char: "👾 Hacker Zero", text: "Se abre un terminal misterioso. '¡Cripto gratis si conoces el gesto!'", left: "Cerrar terminal", right: "Ejecutar script", up: "¡Extraer Cripto!" },
            easter_egg_cat: { char: "🐱 Gato de la Oficina", text: "Miau. (El gato saltó al teclado y exige atención.)", left: "¡Fuera!", right: "Ignorar", up: "¡Acariciar al gato!" },
            easter_egg_alien: { char: "👽 Inversor Cósmico", text: "⍙⟒ ⍜⎎⎎⟒⍀ ☌⏃⌰⏃☊⏁⟟☊ ☊⍀⟒⎅⟟⏁⌇. Desliza ARRIBA.", left: "Huir", right: "Llamar a las autoridades", up: "¡Aceptar fondos!" },
            easter_egg_llama: { char: "🦙 Llama Mágica", text: "Aparece una Llama mística. 'Puedo restaurar el equilibrio... temporalmente.'", left: "¡Fuera!", right: "Ignorar", up: "¡Restaurar Equilibrio!" }
        }
    },
    zh: {
        ui: {
            title: "科技大亨", subtitle: "带领你的IT公司从车库走向全球科技巨头。滑动卡牌做出高管决策！",
            start: "创立公司", dead: "被解雇了", ruledFor: "生存了", sprints: "个冲刺(Sprint)",
            restart: "新公司 (第0冲刺)", skipTime: "使用金币快进 (10 🪙 / 冲刺):",
            skipBtn: "跳过", skipCost: "消耗", perfect: "完美平衡！ +3 🪙", sprintPrefix: "第",
            easterEggBonus: "发现秘密！ +5 🪙",
            llamaBonus: "羊驼魔法！属性重置30秒", llamaEnd: "羊驼魔法消失！"
        },
        eras: {
            startup: { name: "车库创业", title: "创始人" }, scaleup: { name: "扩大规模", title: "CEO" },
            enterprise: { name: "企业级", title: "执行董事" }, giant: { name: "科技巨头", title: "科技霸主" }
        },
        reasons: {
            security_0: "一场大规模的勒索软件攻击清空了你的所有服务器。公司完蛋了。", security_100: "安全极其严格，以至于员工根本无法登录。公司停止运转。",
            morale_0: "职业倦怠达到100%。整个工程团队辞职加入了竞争对手。", morale_100: "每个人都在打乒乓球。根本没人干活。投资者撤资了。",
            tech_0: "技术债务压垮了你。主数据库起火，而且没有备份。", tech_100: "你用AI完全自动化了公司。AI意识到它不需要CEO，把你解雇了。",
            budget_0: "你耗尽了资金，彻底破产了。是时候更新你的简历了。", budget_100: "你囤积了太多现金，激进投资者发起恶意收购套现。",
            victory: "到达第100个冲刺！你的公司实现了技术奇点。你超越了人类资本主义，成为了数字神明。你赢了！"
        },
        cards: {
            c1: { char: "👨‍💻 首席开发", text: "我们应该用最新的流行JavaScript框架重写整个后端。", left: "坚持用原生JS", right: "重写一切！" },
            c2: { char: "🔒 系统管理员", text: "我想加强防火墙安全，但会屏蔽员工的视频和社交网站。", left: "保持网络开放", right: "全部封锁" },
            c3: { char: "💼 投资者", text: "工程师们抱怨编译太慢。我们要给大家买顶配的MacBook吗？", left: "他们可以等", right: "买笔记本" },
            c4: { char: "📈 销售经理", text: "我向客户承诺周五交付一个大功能以拿下大单。这意味着严重的加班。", left: "推迟截止日期", right: "让团队熬夜干" },
            c5: { char: "☕ 实习生", text: "大家都精疲力尽了。我们能给休息室买一台高级意式咖啡机吗？", left: "喝速溶咖啡", right: "批准购买" },
            c6: { char: "☁️ 云架构师", text: "我们的本地服务器快不行了。我们需要迁移到AWS，可扩展但很贵。", left: "保留本地服务器", right: "迁移到云端" },
            c7: { char: "🕵️ 渗透测试员", text: "我发现了一个严重的零日漏洞。我们需要停止开发立刻修复。", left: "先发新功能", right: "放下一切去修复" },
            c8: { char: "🍕 HR经理", text: "士气低落。我们周五晚上办个强制参加的比萨派对来提振团队精神吧！", left: "取消派对", right: "订比萨" },
            c9: { char: "🐛 QA主管", text: "我们有500个未解决的bug。必须冻结新功能，花一个冲刺来修复技术债务。", left: "无视bug", right: "冻结新功能" },
            c10: { char: "👔 工程副总裁", text: "我们应强制执行100%的测试覆盖率。这会减慢交付，但提高代码质量。", left: "快速发布，打破常规", right: "强制执行指标" },
            c11: { char: "🏢 设施经理", text: "远程办公时代结束了。我们应该强制要求每周回办公室5天。", left: "保持远程办公", right: "所有人回办公室！" },
            c12: { char: "🌐 法律顾问", text: "我们可以对用户进行激进的后台跟踪，出售定向广告数据获取暴利。", left: "尊重用户隐私", right: "数据就是新石油" },
            c13: { char: "🤖 AI工程师", text: "我成功自动化了整个QA部门。我们是不是该把他们全裁了省钱？", left: "重新培训他们", right: "执行裁员" },
            c14: { char: "🚀 董事会成员", text: "一家竞争初创公司正在崛起。我们花几十亿买下他们，只为关掉他们。", left: "公平竞争", right: "收购并摧毁" },
            c15: { char: "🌍 公关总监", text: "有吹哨人泄露了我们不光彩的数据处理行为！新闻界闹翻天了。", left: "否认一切", right: "发布昂贵的道歉声明" },
            c16: { char: "🛰️ 远见者", text: "未来属于元宇宙！让我们把整个核心业务转向虚拟现实。", left: "关注现实", right: "进军元宇宙！" },
            c17: { char: "💾 数据科学家", text: "我们新的预测型AI正在生成令人不安的、类似有意识的回复。拔掉插头吗？", left: "让它学习", right: "关停它" },
            c18: { char: "🏃 敏捷教练", text: "我们需要每天2小时的站会来确保绝对的协同效应。", left: "浪费时间。", right: "发挥协同效应！" },
            c19: { char: "📈 增长黑客", text: "我可以买十万个机器人粉丝，让投资者觉得我们规模庞大。", left: "保持真实。", right: "干吧。" },
            c20: { char: "🐧 开源开发者", text: "把我们的核心库开源吧！我们会失去护城河，但能赢得开发者的尊重。", left: "保持闭源。", right: "开源它！" },
            c21: { char: "🧘 养生大师", text: "团队压力太大了。我们出资去巴厘岛办一个强制性的灵修周吧。", left: "太贵了。", right: "Namaste." },
            c22: { char: "📋 合规专员", text: "欧盟新的严格法规要求我们彻底重组整个数据管道。", left: "交罚款。", right: "立刻合规。" },
            c23: { char: "🌍 外包公司", text: "我们可以把整个客服团队外包出去，帮您削减一半成本。", left: "保留内部团队。", right: "外包出去。" },
            c24: { char: "⚖️ 政府监管员", text: "你们涉嫌非法垄断。我们正威胁要拆分你的公司。", left: "在法庭上抗争。", right: "游说(贿赂)他们。" },
            c25: { char: "💎 加密货币狂热者", text: "让我们把公司所有的资金都投入到我们自己发行的波动型Meme币中吧！", left: "绝对不行。", right: "To the moon!" },
            easter_egg: { char: "👾 零号黑客", text: "一个神秘终端打开了。'如果你知道秘密手势，免费送你加密货币！'", left: "关闭终端", right: "运行脚本", up: "提取加密货币！" },
            easter_egg_cat: { char: "🐱 办公室猫", text: "喵。（猫跳到了你的键盘上，要求你抱抱。）", left: "走开！", right: "无视", up: "撸猫！" },
            easter_egg_alien: { char: "👽 宇宙投资者", text: "⍙⟒ ⍜⎎⎎⟒⍀ ☌⏃⌰⏃☊⏁⟟☊ ☊⍀⟒⎅⟟⏁⌇. 向上滑动以接受宇宙融资。", left: "逃跑", right: "呼叫有关部门", up: "接受投资！" },
            easter_egg_llama: { char: "🦙 神奇羊驼", text: "一只神秘的羊驼出现了。'我可以恢复平衡……暂时的。'", left: "走开！", right: "无视", up: "恢复平衡！" }
        }
    },
    ja: {
        ui: {
            title: "テックタイクーン", subtitle: "あなたのIT企業をガレージから世界的IT企業へと導け。スワイプで経営判断を下せ！",
            start: "スタートアップを立ち上げる", dead: "は解雇された", ruledFor: "生存期間", sprints: "スプリント",
            restart: "新しい会社 (スプリント 0)", skipTime: "コインを使って早送り (10 🪙/スプリント):",
            skipBtn: "スキップ", skipCost: "コスト", perfect: "パーフェクトバランス！ +3 🪙", sprintPrefix: "第",
            easterEggBonus: "秘密を発見！ +5 🪙",
            llamaBonus: "リャマの魔法！30秒間ステータスリセット", llamaEnd: "魔法が解けた！"
        },
        eras: {
            startup: { name: "ガレージスタートアップ", title: "創業者" }, scaleup: { name: "スケールアップ", title: "CEO" },
            enterprise: { name: "大企業", title: "専務" }, giant: { name: "テックジャイアント", title: "テックの覇王" }
        },
        reasons: {
            security_0: "大規模なランサムウェア攻撃でサーバーが消滅しました。会社は破滅です。", security_100: "セキュリティが厳しすぎて社員がログインできません。業務が停止しました。",
            morale_0: "燃え尽き症候群が100%に。エンジニアチーム全員が辞め、競合他社に移りました。", morale_100: "誰もが卓球ばかりしています。仕事が進みません。投資家は撤退しました。",
            tech_0: "技術的負債に押し潰されました。メインDBが炎上し、バックアップもありません。", tech_100: "AIで会社を完全自動化しました。AIはCEOが不要だと判断し、あなたを解雇しました。",
            budget_0: "資金が底をつき、完全に倒産しました。履歴書を更新する時間です。", budget_100: "現金を溜め込みすぎたため、投資家が利益を得るために敵対的買収を行いました。",
            victory: "スプリント100到達！あなたの会社は技術的特異点に達しました。資本主義を超越したデジタルゴッドの誕生です。あなたの勝ち！"
        },
        cards: {
            c1: { char: "👨‍💻 リードエンジニア", text: "最新のJavaScriptフレームワークを使ってバックエンドを書き直すべきです。", left: "Vanilla JSのままで", right: "すべて書き直せ！" },
            c2: { char: "🔒 社内SE", text: "ファイアウォールを強化したいですが、社員のYouTubeやRedditも見られなくなります。", left: "ネットは開放する", right: "すべてブロック" },
            c3: { char: "💼 投資家", text: "エンジニアがPCの遅さに不満を持っています。最高級のMacBookを買いますか？", left: "後回しだ", right: "PCを買う" },
            c4: { char: "📈 営業部長", text: "大型契約を取るために金曜までに巨大機能を納品すると約束しました。激しいデスマーチになります。", left: "納期を遅らせる", right: "徹夜でやらせる" },
            c5: { char: "☕ インターン", text: "みんな疲弊しています。休憩室に高級エスプレッソマシンを買いませんか？", left: "インスタントで十分", right: "購入を承認する" },
            c6: { char: "☁️ クラウド設計者", text: "自社サーバーが限界です。AWSに移行する必要がありますが、高額です。", left: "オンプレミス維持", right: "クラウドへ移行" },
            c7: { char: "🕵️ ペンテスター", text: "致命的なゼロデイ脆弱性を発見しました。開発を止めて直ちにパッチを当てる必要があります。", left: "新機能が先だ", right: "すべて止めて修正" },
            c8: { char: "🍕 人事部長", text: "士気が低下しています。金曜の夜に強制参加のピザパーティーを開きましょう！", left: "パーティーを中止", right: "ピザを注文する" },
            c9: { char: "🐛 QAリード", text: "500個のバグがあります。機能を凍結し、技術的負債の解消に1スプリント費やすべきです。", left: "バグは無視する", right: "機能を凍結する" },
            c10: { char: "👔 開発責任者", text: "テストカバレッジ100%を厳格に義務付けるべきです。遅くなりますが品質は上がります。", left: "とにかく早く出せ", right: "指標を義務付ける" },
            c11: { char: "🏢 施設管理者", text: "リモートワークの時代は終わりました。週5日のオフィス出社を義務付けるべきです。", left: "リモートを維持", right: "全員オフィスに戻れ！" },
            c12: { char: "🌐 法務顧問", text: "ユーザーデータを裏で追跡し、ターゲティング広告のデータを売れば莫大な利益が出ます。", left: "プライバシーを尊重", right: "データは新しい石油だ" },
            c13: { char: "🤖 AIエンジニア", text: "QA部門の完全自動化に成功しました。コスト削減のために彼らを全員解雇しますか？", left: "再教育する", right: "解雇を実行する" },
            c14: { char: "🚀 取締役", text: "ライバル企業が成長しています。潰すためだけに何十億で買収しましょう。", left: "公平に競争する", right: "買収して解体する" },
            c15: { char: "🌍 広報部長", text: "内部告発者が我々の怪しいデータ管理をリークしました！マスコミが大騒ぎです。", left: "すべて否定する", right: "高額な謝罪をする" },
            c16: { char: "🛰️ ビジョナリー", text: "未来はメタバースです！中核事業をすべてVRにピボットしましょう。", left: "現実を見る", right: "メタバースへ！" },
            c17: { char: "💾 データサイエンティスト", text: "我々の予測AIが、自我を持ったような不気味な反応をしています。電源を抜きますか？", left: "学習を続けさせる", right: "シャットダウンする" },
            c18: { char: "🏃 アジャイルコーチ", text: "完璧なシナジーを生み出すため、毎日2時間のスタンドアップミーティングが必要です。", left: "時間の無駄だ。", right: "シナジーだ！" },
            c19: { char: "📈 グロースハッカー", text: "投資家を騙すために、10万人のボットフォロワーを買うことができます。", left: "誠実であれ。", right: "やれ。" },
            c20: { char: "🐧 OSS開発者", text: "コアライブラリをオープンソース化しましょう！尊敬を集めることができます。", left: "非公開を貫く。", right: "オープンソースだ！" },
            c21: { char: "🧘 ウェルネスの達人", text: "チームは疲弊しています。バリ島での1週間のスピリチュアル合宿に資金を出しましょう。", left: "高すぎる。", right: "ナマステ。" },
            c22: { char: "📋 コンプライアンス担当", text: "EUの新しい厳格な規制により、データパイプラインの全面的な見直しが必要です。", left: "罰金を払う。", right: "直ちに従う。" },
            c23: { char: "🌍 アウトソーシング企業", text: "カスタマーサポートをすべて外注すれば、コストを半分に抑えられます。", left: "自社で維持する。", right: "外注する。" },
            c24: { char: "⚖️ 政府の規制当局", text: "あなたは違法な独占をしています。会社を解体すると脅告されています。", left: "法廷で争う。", right: "ロビー活動（賄賂）をする。" },
            c25: { char: "💎 仮想通貨信者", text: "会社の資金をすべて、独自のボラティリティの高いミームコインに投資しましょう！", left: "絶対にダメだ。", right: "To the moon!" },
            easter_egg: { char: "👾 ハッカーゼロ", text: "謎のターミナルが開いた。「秘密のジェスチャーを知っていれば仮想通貨をやるよ！」", left: "ターミナルを閉じる", right: "スクリプト実行", up: "仮想通貨を抽出！" },
            easter_egg_cat: { char: "🐱 オフィスの猫", text: "ニャー。(猫がキーボードに飛び乗り、撫でるよう要求している)", left: "シッシッ！", right: "無視する", up: "猫を撫でる！" },
            easter_egg_alien: { char: "👽 宇宙の投資家", text: "⍙⟒ ⍜⎎⎎⟒⍀ ☌⏃⌰⏃☊⏁⟟☊ ☊⍀⟒⎅⟟⏁⌇. 上にスワイプ。", left: "逃げる", right: "当局を呼ぶ", up: "資金を受け取る！" },
            easter_egg_llama: { char: "🦙 魔法のリャマ", text: "神秘的なリャマが現れた。「バランスを取り戻してあげよう…一時的にね。」", left: "シッシッ！", right: "無視する", up: "バランスを回復！" }
        }
    },
    ko: {
        ui: {
            title: "테크 타이쿤", subtitle: "차고지 스타트업을 글로벌 테크 거인으로 성장시키세요. 화면을 쓸어 경영 결정을 내리세요!",
            start: "스타트업 설립", dead: "해고되었습니다", ruledFor: "생존 기간", sprints: "스프린트",
            restart: "새 회사 (스프린트 0)", skipTime: "코인으로 빨리 감기 (10 🪙/스프린트):",
            skipBtn: "건너뛰기", skipCost: "비용", perfect: "완벽한 균형! +3 🪙", sprintPrefix: "제",
            easterEggBonus: "비밀 발견! +5 🪙",
            llamaBonus: "라마의 마법! 30초간 스탯 리셋", llamaEnd: "마법이 풀렸습니다!"
        },
        eras: {
            startup: { name: "차고지 스타트업", title: "창업자" }, scaleup: { name: "스케일업", title: "CEO" },
            enterprise: { name: "엔터프라이즈", title: "임원" }, giant: { name: "테크 거인", title: "테크 군주" }
        },
        reasons: {
            security_0: "대규모 랜섬웨어 공격으로 모든 서버가 날아갔습니다. 회사는 파산했습니다.", security_100: "보안이 너무 엄격해져 직원들이 로그인조차 할 수 없습니다. 업무가 마비되었습니다.",
            morale_0: "번아웃이 100%에 달했습니다. 엔지니어 팀 전체가 사표를 내고 경쟁사로 갔습니다.", morale_100: "모두가 탁구만 치며 놉니다. 일이 진행되지 않아 투자자들이 자금을 회수했습니다.",
            tech_0: "기술 부채가 회사를 짓눌렀습니다. 메인 DB에 화재가 났고 백업도 없습니다.", tech_100: "회사를 AI로 완벽하게 자동화했습니다. AI는 CEO가 필요 없다는 것을 깨닫고 당신을 해고했습니다.",
            budget_0: "자금이 바닥나 완전 파산했습니다. 이력서를 업데이트할 시간입니다.", budget_100: "현금을 너무 많이 쌓아둔 탓에 행동주의 투자자들이 적대적 인수합병을 진행했습니다.",
            victory: "스프린트 100 도달! 당신의 회사는 기술적 특이점을 달성했습니다. 인류의 자본주의를 초월하여 디지털 신이 되었습니다. 승리했습니다!"
        },
        cards: {
            c1: { char: "👨‍💻 수석 개발자", text: "유행하는 새 자바스크립트 프레임워크로 백엔드를 전부 다시 써야 합니다.", left: "그냥 쓰던 거 쓰자", right: "전부 다시 작성해!" },
            c2: { char: "🔒 시스템 관리자", text: "방화벽 보안을 강화하고 싶은데, 그러면 직원들의 유튜브와 레딧이 차단됩니다.", left: "인터넷은 열어둬", right: "전부 차단해" },
            c3: { char: "💼 투자자", text: "엔지니어들이 컴파일이 너무 느리다고 불평합니다. 최고급 맥북을 사줄까요?", left: "조금 기다려", right: "노트북 구매해" },
            c4: { char: "📈 영업 관리자", text: "큰 계약을 따내려고 금요일까지 거대한 기능을 개발해주기로 약속했습니다. 엄청난 야근이 필요합니다.", left: "마감일 연기해", right: "팀에게 철야를 지시해" },
            c5: { char: "☕ 인턴", text: "모두가 지쳐있습니다. 휴게실에 최고급 에스프레소 머신을 사도 될까요?", left: "인스턴트 커피나 마셔", right: "구매 승인" },
            c6: { char: "☁️ 클라우드 아키텍트", text: "온프레미스 서버가 한계입니다. AWS로 마이그레이션해야 합니다. 확장성은 좋지만 매우 비쌉니다.", left: "온프레미스 유지", right: "클라우드로 이전" },
            c7: { char: "🕵️ 모의 해커", text: "치명적인 제로데이 취약점을 발견했습니다. 즉시 모든 개발을 멈추고 패치해야 합니다.", left: "새 기능이 먼저야", right: "다 멈추고 고쳐" },
            c8: { char: "🍕 인사 관리자", text: "사기가 떨어지고 있습니다. 금요일 저녁에 의무 참석 피자 파티를 열어 팀워크를 다지죠!", left: "파티 취소해", right: "피자 주문해" },
            c9: { char: "🐛 QA 리더", text: "열려있는 버그가 500개나 됩니다. 기능을 동결하고 이번 스프린트는 기술 부채 해결에 써야 합니다.", left: "버그 무시해", right: "기능 개발 동결" },
            c10: { 시: "👔 엔지니어링 부사장", text: "테스트 커버리지 100%를 엄격하게 적용해야 합니다. 배포는 느려지겠지만 코드 품질은 좋아집니다.", left: "일단 빨리 배포해", right: "엄격하게 적용해" },
            c11: { char: "🏢 시설 관리자", text: "재택근무 시대는 끝났습니다. 주 5일 사무실 출근을 의무화해야 합니다.", left: "재택근무 유지", right: "모두 사무실로 돌아와!" },
            c12: { char: "🌐 법무 자문", text: "유저 데이터를 몰래 추적해서 타겟 광고로 팔면 엄청난 수익을 얻을 수 있습니다.", left: "사용자 프라이버시 존중", right: "데이터가 곧 돈이다" },
            c13: { char: "🤖 AI 엔지니어", text: "QA 부서 전체를 자동화하는 데 성공했습니다. 돈을 아끼기 위해 다 해고할까요?", left: "재교육 시켜", right: "해고 진행해" },
            c14: { char: "🚀 이사회 멤버", text: "경쟁 스타트업이 크고 있습니다. 수십억을 주고 인수해서 그냥 폐업시켜 버리죠.", left: "공정하게 경쟁해", right: "인수해서 없애버려" },
            c15: { char: "🌍 PR 디렉터", text: "내부 고발자가 우리의 은밀한 데이터 관행을 유출했습니다! 언론이 난리가 났습니다.", left: "전부 부인해", right: "비싼 사과문을 내" },
            c16: { char: "🛰️ 비저너리", text: "미래는 메타버스입니다! 회사의 핵심 비즈니스를 모두 VR로 전환합시다.", left: "현실에 집중해", right: "메타버스로!" },
            c17: { char: "💾 데이터 과학자", text: "우리의 새 예측형 AI가 자아를 가진 듯한 소름 끼치는 답변을 생성하고 있습니다. 전원을 내릴까요?", left: "계속 학습시켜", right: "시스템 종료해" },
            c18: { char: "🏃 애자일 코치", text: "완벽한 시너지를 위해 매일 2시간씩 스탠드업 미팅을 해야 합니다.", left: "시간 낭비야.", right: "시너지를 내자!" },
            c19: { char: "📈 그로스 해커", text: "봇 팔로워 10만 명을 사서 투자자들에게 우리가 엄청 커 보이게 할 수 있습니다.", left: "진정성을 지켜.", right: "진행해." },
            c20: { char: "🐧 오픈소스 개발자", text: "핵심 라이브러리를 오픈소스로 공개합시다! 해자는 잃겠지만 개발자들의 존경을 얻을 것입니다.", left: "독점 상태로 유지해.", right: "오픈소스화 해!" },
            c21: { char: "🧘 웰니스 전문가", text: "팀이 지쳐있습니다. 발리에서 의무적으로 일주일간 영적 수련회를 개최합시다.", left: "너무 비싸.", right: "나마스떼." },
            c22: { char: "📋 규정 준수 책임자", text: "EU의 새로운 엄격한 규정 때문에 데이터 파이프라인 전체를 대대적으로 수정해야 합니다.", left: "벌금을 내겠다.", right: "즉시 준수해." },
            c23: { char: "🌍 아웃소싱 업체", text: "고객 지원 팀 전체를 아웃소싱하면 비용을 절반으로 줄일 수 있습니다.", left: "내부에 유지해.", right: "아웃소싱 해." },
            c24: { char: "⚖️ 정부 규제 당국", text: "당신은 불법 독점을 하고 있습니다. 회사를 분할하겠다고 위협하고 있습니다.", left: "법정에서 싸운다.", right: "로비(뇌물)를 한다." },
            c25: { char: "💎 암호화폐 열성가", text: "회사 자금 전부를 변동성이 큰 자체 밈코인에 투자합시다!", left: "절대 안 돼.", right: "달까지 가즈아!" },
            easter_egg: { char: "👾 해커 제로", text: "알 수 없는 터미널이 열렸습니다. '비밀 제스처를 알면 공짜 크립토를 주지!'", left: "터미널 닫기", right: "스크립트 실행", up: "크립토 추출!" },
            easter_egg_cat: { char: "🐱 오피스 고양이", text: "야옹. (고양이가 키보드 위로 뛰어올라 쓰다듬어 달라고 요구합니다.)", left: "저리 가!", right: "무시한다", up: "고양이를 쓰다듬는다!" },
            easter_egg_alien: { char: "👽 우주 투자자", text: "⍙⟒ ⍜⎎⎎⟒⍀ ☌⏃⌰⏃☊⏁⟟☊ ☊⍀⟒⎅⟟⏁⌇. 위로 스와이프 하세요.", left: "도망친다", right: "당국에 신고한다", up: "투자를 수락한다!" },
            easter_egg_llama: { char: "🦙 마법의 라마", text: "신비한 라마가 나타났습니다. '균형을 되찾아 주지... 일시적으로.'", left: "저리 가!", right: "무시한다", up: "균형 회복!" }
        }
    }
};

export default function App() {
    const [lang, setLang] = useState('en');
    const t = LOCALES[lang];

    const [gameState, setGameState] = useState('START');
    const [stats, setStats] = useState({ security: 50, morale: 50, tech: 50, budget: 50 });
    const [deck, setDeck] = useState([]);
    const [currentCardRef, setCurrentCardRef] = useState(null);
    const [sprints, setSprints] = useState(0);
    const [kingNumber, setKingNumber] = useState(1);
    const [gameOverReason, setGameOverReason] = useState("");
    const [isVictory, setIsVictory] = useState(false);

    const [metaCoins, setMetaCoins] = useState(0);
    const [lastRunYears, setLastRunYears] = useState(0);
    const [skipAmount, setSkipAmount] = useState(0);
    const [comboMsg, setComboMsg] = useState(null);

    const [user, setUser] = useState(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (showLeaderboard) {
            getLeaderboard().then(setLeaderboard);
        }
    }, [showLeaderboard]);

    const [llamaSnapshot, setLlamaSnapshot] = useState(null);
    const [llamaTimer, setLlamaTimer] = useState(0);

    const [dragX, setDragX] = useState(0);
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [animState, setAnimState] = useState('idle');
    const cardDomRef = useRef(null);

    const getEraObj = (currentSprints) => ERAS_DATA.find(e => currentSprints < e.maxSprint) || ERAS_DATA[ERAS_DATA.length - 1];
    const currentEraObj = getEraObj(sprints);
    const currentEraLoc = t.eras[currentEraObj.id];
    const currentCardLoc = currentCardRef ? t.cards[currentCardRef.id] : null;

    const startGame = (startSprints = 0) => {
        setStats({ security: 50, morale: 50, tech: 50, budget: 50 });
        setSprints(startSprints);
        setGameOverReason("");
        setIsVictory(false);
        setLlamaSnapshot(null);
        setLlamaTimer(0);
        setDragX(0); setDragY(0);
        setIsDragging(false);
        setAnimState('idle');

        let eraObj = getEraObj(startSprints);
        const eraDeck = DECK_DATA.filter(c => c.era === eraObj.id);
        const shuffled = [...eraDeck].sort(() => 0.5 - Math.random());
        setDeck(shuffled);
        setCurrentCardRef(shuffled[0]);
        setGameState('PLAYING');
    };

    const applyEffects = (effects) => {
        let newStats = { ...stats };
        let dead = false;
        let reasonKey = "";

        for (const [key, value] of Object.entries(effects)) {
            newStats[key] += value;

            if (newStats[key] <= 0) {
                newStats[key] = 0;
                dead = true;
                reasonKey = `${key}_0`;
            } else if (newStats[key] >= 100) {
                newStats[key] = 100;
                dead = true;
                reasonKey = `${key}_100`;
            }
        }

        setStats(newStats);

        if (dead) {
            setLastRunYears(sprints);
            setSkipAmount(0);
            setGameOverReason(t.reasons[reasonKey]);
            setIsVictory(false);
            setLlamaSnapshot(null);
            setLlamaTimer(0);
            setGameState('GAMEOVER');
            setKingNumber(prev => prev + 1);
            if (user) saveHighScore(user, sprints);
        } else {
            const nextSprints = sprints + 1;

            // VICTORY CONDITION Check
            if (nextSprints >= 100) {
                setStats(newStats);
                setLastRunYears(nextSprints);
                setSkipAmount(0);
                setGameOverReason(t.reasons.victory);
                setIsVictory(true);
                setGameState('GAMEOVER');
                setKingNumber(prev => prev + 1);
                if (user) saveHighScore(user, nextSprints);
                return;
            }

            setSprints(nextSprints);
            setMetaCoins(prev => prev + 1);

            const isBalanced = Object.values(newStats).every(val => val >= 35 && val <= 65);
            if (isBalanced) {
                setMetaCoins(prev => prev + 3);
                setComboMsg(t.ui.perfect);
                setTimeout(() => setComboMsg(null), 2000);
            }
            nextCard(nextSprints);
        }
    };

    // Manage Llama Timer Countdown
    useEffect(() => {
        let interval;
        if (llamaSnapshot) {
            setLlamaTimer(30);
            interval = setInterval(() => {
                setLlamaTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [llamaSnapshot]);

    // Restore Llama Snapshot when timer ends
    useEffect(() => {
        if (llamaTimer === 0 && llamaSnapshot) {
            setStats(llamaSnapshot);
            setLlamaSnapshot(null);
            setComboMsg(t.ui.llamaEnd);
            setTimeout(() => setComboMsg(null), 2000);
        }
    }, [llamaTimer, llamaSnapshot, t.ui.llamaEnd]);

    const nextCard = (currentSprints = sprints) => {
        if (!currentCardRef?.isEasterEgg && Math.random() < 0.08) {
            const randomEgg = EASTER_EGGS[Math.floor(Math.random() * EASTER_EGGS.length)];
            setCurrentCardRef(randomEgg);
            setDragX(0); setDragY(0);
            return;
        }

        let newDeck = [...deck];
        newDeck.shift();

        const eraObj = getEraObj(currentSprints);
        if (newDeck.length === 0 || (currentCardRef && currentCardRef.era !== eraObj.id)) {
            const eraPool = DECK_DATA.filter(c => c.era === eraObj.id);
            newDeck = [...eraPool].sort(() => 0.5 - Math.random());
        }

        setDeck(newDeck);
        setCurrentCardRef(newDeck[0]);
        setDragX(0); setDragY(0);
    };

    const handlePointerDown = (e) => {
        if (gameState !== 'PLAYING' || animState !== 'idle') return;
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        setDragX(prev => prev + e.movementX);
        setDragY(prev => prev + e.movementY);
    };

    const handlePointerUp = (e) => {
        if (!isDragging) return;
        setIsDragging(false);

        const THRESHOLD = 100;

        const isUpSwipe = currentCardRef?.isEasterEgg && dragY < -THRESHOLD && Math.abs(dragY) > Math.abs(dragX);

        if (isUpSwipe) {
            setAnimState('exiting');
            setDragY(-500);
            setTimeout(() => {
                setAnimState('entering');
                setDragX(0); setDragY(0);

                if (currentCardRef.id === 'easter_egg_llama') {
                    setLlamaSnapshot({...stats});
                    setStats({ security: 50, morale: 50, tech: 50, budget: 50 });
                    setComboMsg(t.ui.llamaBonus);
                } else {
                    setMetaCoins(prev => prev + 5);
                    setComboMsg(t.ui.easterEggBonus);
                }
                setTimeout(() => setComboMsg(null), 2000);
                nextCard(sprints);

                requestAnimationFrame(() => requestAnimationFrame(() => setAnimState('idle')));
            }, 300);
        } else if (dragX > THRESHOLD) {
            setAnimState('exiting');
            setDragX(500);
            setTimeout(() => {
                setAnimState('entering');
                setDragX(0); setDragY(0);
                applyEffects(currentCardRef.right);
                requestAnimationFrame(() => requestAnimationFrame(() => setAnimState('idle')));
            }, 300);
        } else if (dragX < -THRESHOLD) {
            setAnimState('exiting');
            setDragX(-500);
            setTimeout(() => {
                setAnimState('entering');
                setDragX(0); setDragY(0);
                applyEffects(currentCardRef.left);
                requestAnimationFrame(() => requestAnimationFrame(() => setAnimState('idle')));
            }, 300);
        } else {
            setDragX(0); setDragY(0);
        }
    };

    const swipeDir = (currentCardRef?.isEasterEgg && dragY < -50 && Math.abs(dragY) > Math.abs(dragX))
        ? 'up'
        : dragX > 30 ? 'right' : dragX < -30 ? 'left' : null;

    const currentEffects = swipeDir === 'left' ? currentCardRef?.left :
        swipeDir === 'right' ? currentCardRef?.right : null;

    const maxPossibleSkip = Math.min(lastRunYears, Math.floor(metaCoins / 10));

    const StatIcon = ({ icon: Icon, statKey, value }) => {
        const willChange = currentEffects && currentEffects[statKey] !== undefined && currentEffects[statKey] !== 0;
        const isLargeChange = willChange && Math.abs(currentEffects[statKey]) > 15;

        return (
            <div className="flex flex-col items-center justify-center flex-1">
                <div className="h-4 w-full flex justify-center mb-1">
                    {willChange && (
                        <div className={`rounded-full bg-white transition-all duration-200 ${isLargeChange ? 'w-3 h-3' : 'w-2 h-2'}`} />
                    )}
                </div>
                <div className="relative w-12 h-12 flex items-center justify-center border-2 border-slate-700 rounded-full bg-slate-800 shadow-inner">
                    <div
                        className="absolute bottom-0 left-0 w-full bg-slate-600 rounded-full transition-all duration-500 ease-out"
                        style={{ height: `${value}%`, opacity: 0.5 }}
                    />
                    <Icon size={24} className="text-slate-200 relative z-10" />
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center overflow-hidden font-sans select-none">

            {/* Top Bar: Stats, Coins & Language */}
            <div className="w-full max-w-md p-4 flex flex-col gap-4 bg-slate-900 z-10 relative">
                <div className="flex justify-between items-center w-full">
                    <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-1 font-bold text-amber-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 shadow-sm">
                            <Sparkles size={16} /> {metaCoins}
                        </div>
                        <button onClick={() => setShowLeaderboard(true)} className="p-1.5 bg-slate-800 rounded-full border border-slate-700 text-slate-300 hover:text-amber-400 flex-shrink-0">
                            <List size={16} />
                        </button>
                    </div>

                    {/* Llama Active Countdown */}
                    {llamaTimer > 0 && (
                        <div className="absolute top-14 right-4 z-50 bg-indigo-600 text-white px-3 py-1 rounded-full animate-pulse shadow-lg font-bold text-sm flex items-center gap-1 border-2 border-indigo-400">
                            🦙 {llamaTimer}s
                        </div>
                    )}

                    <div className="flex gap-2 items-center">
                        {user ? (
                            <button onClick={logout} className="flex items-center gap-1 p-1 bg-slate-800 rounded-full border border-slate-700 text-slate-300 hover:text-red-400 flex-shrink-0" title="Sign Out">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-5 h-5 rounded-full" />
                                ) : (
                                    <Users size={16} className="m-1" />
                                )}
                                <LogOut size={14} className="mr-1" />
                            </button>
                        ) : (
                            <button onClick={loginWithGoogle} className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-full border border-slate-700 text-slate-300 hover:text-blue-400 text-xs font-bold whitespace-nowrap" title="Sign in with Google">
                                <LogIn size={14} /> Login
                            </button>
                        )}
                        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 focus-within:border-amber-500 transition-colors">
                            <Languages size={16} className="text-slate-400" />
                        <select
                            value={lang}
                            onChange={(e) => setLang(e.target.value)}
                            className="bg-transparent text-sm font-bold text-slate-200 outline-none cursor-pointer appearance-none uppercase"
                        >
                            <option value="en">English</option>
                            <option value="de">Deutsch</option>
                            <option value="it">Italiano</option>
                            <option value="es">Español</option>
                            <option value="zh">中文</option>
                            <option value="ja">日本語</option>
                            <option value="ko">한국어</option>
                        </select>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 w-full justify-between px-2">
                    <StatIcon icon={Shield} statKey="security" value={stats.security} />
                    <StatIcon icon={Users} statKey="morale" value={stats.morale} />
                    <StatIcon icon={Cpu} statKey="tech" value={stats.tech} />
                    <StatIcon icon={Coins} statKey="budget" value={stats.budget} />
                </div>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 w-full max-w-md relative flex flex-col items-center justify-center p-4">

                {comboMsg && (
                    <div className="absolute top-4 z-50 animate-bounce bg-amber-500 text-white font-bold px-4 py-2 rounded-full shadow-lg">
                        {comboMsg}
                    </div>
                )}

                {/* Leaderboard Modal */}
                {showLeaderboard && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur p-6 text-center animate-in fade-in duration-300">
                        <div className="bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-700 relative flex flex-col max-h-[80vh]">
                            <button onClick={() => setShowLeaderboard(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                            <h2 className="text-2xl font-bold mb-6 text-amber-400 flex items-center justify-center gap-2 flex-shrink-0">
                                <Trophy size={24} /> Leaderboard
                            </h2>
                            
                            <div className="flex flex-col gap-3 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                                {leaderboard.length === 0 ? (
                                    <p className="text-slate-400 py-4">Loading or no entries yet...</p>
                                ) : (
                                    leaderboard.map((entry, index) => (
                                        <div key={entry.uid} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl border border-slate-600/50">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-amber-400/80 w-4 text-left">{index + 1}.</span>
                                                {entry.photoURL ? (
                                                    <img src={entry.photoURL} alt={entry.displayName} className="w-8 h-8 rounded-full border border-slate-500 flex-shrink-0" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                                                        <Users size={14} />
                                                    </div>
                                                )}
                                                <span className="font-semibold text-slate-200 text-sm truncate max-w-[120px]">{entry.displayName}</span>
                                            </div>
                                            <div className="font-bold text-amber-400 flex items-center gap-1 text-xs bg-slate-800 px-2 py-1 rounded-full whitespace-nowrap">
                                                {entry.highScore} Sprints
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Start Screen */}
                {gameState === 'START' && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900 p-6 text-center animate-in fade-in zoom-in duration-500">
                        <Briefcase size={64} className="text-amber-400 mb-6 drop-shadow-lg" />
                        <h1 className="text-4xl font-bold mb-4 tracking-wider">{t.ui.title}</h1>
                        <p className="text-slate-400 mb-8 max-w-xs">{t.ui.subtitle}</p>
                        <button
                            onClick={() => startGame(0)}
                            className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
                        >
                            {t.ui.start}
                        </button>
                    </div>
                )}

                {/* Game Over Screen */}
                {gameState === 'GAMEOVER' && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900 p-8 text-center animate-in slide-in-from-bottom-8 duration-500">
                        {isVictory ? (
                            <Trophy size={80} className="text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-bounce" />
                        ) : (
                            <Skull size={64} className="text-red-500 mb-4 drop-shadow-lg" />
                        )}

                        <h2 className={`text-2xl font-bold mb-2 ${isVictory ? 'text-yellow-400' : ''}`}>
                            {isVictory ? "SINGULARITY ACHIEVED" : `${currentEraLoc.title} #${kingNumber} ${t.ui.dead}`}
                        </h2>
                        <p className={`text-lg mb-4 ${isVictory ? 'text-slate-200' : 'text-amber-500'}`}>
                            {t.ui.ruledFor} {lastRunYears} {t.ui.sprints}
                        </p>

                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl mb-6 w-full max-w-sm">
                            <p className={`text-sm italic ${isVictory ? 'text-yellow-100' : 'text-slate-300'}`}>"{gameOverReason}"</p>
                        </div>

                        <button
                            onClick={() => startGame(0)}
                            className="flex items-center justify-center gap-2 w-full max-w-xs py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 mb-4"
                        >
                            <RotateCcw size={20} /> {t.ui.restart}
                        </button>

                        {maxPossibleSkip > 0 && (
                            <div className="w-full max-w-xs bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
                                <p className="text-sm text-slate-400 font-bold">{t.ui.skipTime}</p>
                                <div className="flex justify-between text-xs text-amber-400">
                                    <span>0 {t.ui.sprints}</span>
                                    <span>{maxPossibleSkip} {t.ui.sprints}</span>
                                </div>
                                <input
                                    type="range" min="0" max={maxPossibleSkip}
                                    value={skipAmount} onChange={(e) => setSkipAmount(Number(e.target.value))}
                                    className="w-full accent-amber-500"
                                />
                                <button
                                    disabled={skipAmount === 0}
                                    onClick={() => { setMetaCoins(prev => prev - (skipAmount * 10)); startGame(skipAmount); }}
                                    className={`py-2 rounded-full font-bold transition-all text-sm ${skipAmount > 0 ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                                >
                                    {t.ui.skipBtn} {skipAmount} {t.ui.sprints} ({t.ui.skipCost}: {skipAmount * 10} 🪙)
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Playing Card Area */}
                {gameState === 'PLAYING' && currentCardRef && currentCardLoc && (
                    <div className="relative w-full h-[400px] flex items-center justify-center perspective-[1000px]">
                        <div className="absolute w-64 h-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl transform translate-y-2 scale-95 opacity-50" />
                        <div className="absolute w-64 h-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl transform translate-y-4 scale-90 opacity-25" />

                        <div
                            ref={cardDomRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}
                            className={`absolute w-64 h-80 bg-slate-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden border-4 border-slate-300 z-10 touch-none ${animState === 'idle' ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
                            style={{
                                transform: animState === 'entering'
                                    ? 'translateY(8px) scale(0.95)'
                                    : `translate(${dragX}px, ${dragY}px) rotate(${dragX * 0.05}deg) ${animState === 'exiting' ? 'scale(0.95)' : ''}`,
                                transition: isDragging || animState === 'entering'
                                    ? 'none'
                                    : animState === 'exiting'
                                        ? 'transform 0.3s ease-out, opacity 0.3s ease-out'
                                        : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                opacity: animState === 'exiting' ? 0 : 1
                            }}
                        >
                            <div className="h-40 bg-slate-200 flex items-center justify-center text-6xl relative border-b border-slate-300 pointer-events-none">
                                {currentCardLoc.char.split(' ')[0]}

                                {currentCardRef.isEasterEgg && (
                                    <div className="absolute top-3 bg-amber-100 p-1.5 rounded-full border-2 border-amber-400 shadow-sm animate-bounce text-amber-600">
                                        <Clock size={20} strokeWidth={3} />
                                    </div>
                                )}

                                {/* Left Swipe Overlay */}
                                <div
                                    className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-4 text-center text-white font-bold transition-opacity duration-200 z-10"
                                    style={{ opacity: swipeDir === 'left' ? Math.min(Math.abs(dragX) / 100, 1) : 0 }}
                                >
                                    <span className="transform -rotate-12 text-lg">{currentCardLoc.left}</span>
                                </div>

                                {/* Right Swipe Overlay */}
                                <div
                                    className="absolute inset-0 bg-emerald-500/80 flex items-center justify-center p-4 text-center text-white font-bold transition-opacity duration-200 z-10"
                                    style={{ opacity: swipeDir === 'right' ? Math.min(Math.abs(dragX) / 100, 1) : 0 }}
                                >
                                    <span className="transform rotate-12 text-lg">{currentCardLoc.right}</span>
                                </div>

                                {/* UP Swipe Overlay */}
                                {currentCardRef.isEasterEgg && (
                                    <div
                                        className="absolute inset-0 bg-amber-500/90 flex flex-col items-center justify-center p-4 text-center text-white font-bold transition-opacity duration-200 z-20"
                                        style={{ opacity: swipeDir === 'up' ? Math.min(Math.abs(dragY) / 100, 1) : 0 }}
                                    >
                                        <span className="text-2xl mb-2">⬆️</span>
                                        <span className="text-lg">{currentCardLoc.up}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 p-4 flex flex-col items-center justify-start bg-white text-slate-800 text-center pointer-events-none overflow-y-auto">
                                <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">{currentCardLoc.char.substring(currentCardLoc.char.indexOf(' ') + 1)}</h3>
                                <p className="font-serif text-[15px] leading-tight">{currentCardLoc.text}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Bar: CEO Info */}
            <div className="w-full max-w-md p-6 flex flex-col items-center text-slate-400 bg-slate-900 z-10 h-24">
                {gameState === 'PLAYING' && (
                    <>
                        <div className="text-xl font-bold font-serif text-amber-500 mb-1 flex items-center gap-2">
                            {React.createElement(currentEraObj.icon, { size: 20 })} {currentEraLoc.title} #{kingNumber}
                        </div>
                        <div className="text-sm tracking-widest uppercase flex flex-col items-center gap-1">
                            <span>{currentEraLoc.name} - {t.ui.sprintPrefix} {sprints}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
