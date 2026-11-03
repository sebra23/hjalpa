import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  Buildings,
  CalendarCheck,
  ChatCircle,
  Database,
  EnvelopeSimple,
  Check,
  Copy,
  FileText,
  Microphone,
  PaperPlaneRight,
  PhoneCall,
  PhoneDisconnect,
  Plus,
  Quotes,
  ShieldCheck,
  Sparkle,
  Star,
  User,
  Waveform,
  WhatsappLogo,
  X,
} from "@phosphor-icons/react";
import {
  companyInputSchema,
  emptyCompanyInput,
  exampleCompanyInput,
  getIndustryServices,
  industryRegister,
  swedishCounties,
  type CompanyInput,
} from "@contracts/company";
import type { ChatMessage } from "@contracts/chat";
import { trpc } from "@/providers/trpc";
import { buildMillisEmbedUrl, millisAgentPrompt } from "@/lib/millis";
import PrivateHome from "@/pages/PrivateHome";

type FormErrors = Partial<Record<keyof CompanyInput, string>>;
type SavedProfile = CompanyInput & { publicId: string };

const stripePaymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK?.trim() ?? "";
const hasStripePaymentLink = /^https:\/\/(buy|checkout)\.stripe\.com\//.test(stripePaymentLink);

const planFeatures = [
  "100 samtalsminuter varje månad",
  "Svarar på samtal dygnet runt",
  "Bokar jobb direkt i kalendern",
  "Ställer följdfrågor till kunder",
  "Samlar in underlag till offerter",
  "Samtalssammanfattningar via SMS eller mejl",
  "Personlig hjälp att komma igång",
];

const faqItems = [
  {
    question: "Vad är Hjälpa?",
    answer: "Hjälpa är en AI-assistent som svarar på samtal och chattar i ditt företags namn. Den ställer följdfrågor, sammanfattar kundens behov och förbereder nästa steg.",
  },
  {
    question: "Kan Hjälpa svara när jag är upptagen?",
    answer: "Ja. Hjälpa kan ta emot samtal när du inte kan svara själv. Kunden får hjälp direkt och du får en tydlig sammanfattning av vad samtalet handlade om.",
  },
  {
    question: "Kan Hjälpa boka direkt i min kalender?",
    answer: "Ja, när din kalender är kopplad kan Hjälpa hitta lediga tider och boka in jobbet. Du bestämmer vilka tider och bokningsregler som ska gälla.",
  },
  {
    question: "Kan Hjälpa skapa och skicka offerter?",
    answer: "Hjälpa kan samla kundens uppgifter och förbereda offertunderlaget. Du kan granska underlaget innan det skickas vidare till ditt kundsystem.",
  },
  {
    question: "Behöver jag kunna något om AI?",
    answer: "Nej. Du beskriver företaget, tjänsterna och hur samtalen ska hanteras. Hjälpa använder uppgifterna i samtalet utan att du behöver förstå tekniken bakom.",
  },
  {
    question: "Hur testar jag Hjälpa?",
    answer: "Fyll i företagsuppgifterna i formuläret och välj Röst eller Chatt. Samma demoprofil används i båda testen.",
  },
  {
    question: "Vad kostar det?",
    answer: "Första 14 dagarna är gratis. Därefter kostar Hjälpa Företag 499 kr/mån i 12 månader. Sedan är ordinarie pris 1 499 kr/mån. Alla priser är exklusive moms.",
  },
];

const footerInfoContent = {
  privacy: {
    title: "Dataskydd i demon",
    intro: "Så används uppgifter när du testar Hjälpa och förbereder registreringen.",
    sections: [
      { heading: "Demoprofilen", text: "Företagsuppgifterna används för att skapa och anpassa din demoprofil. Samma profil används för både röst och chatt." },
      { heading: "Röst och chatt", text: "När du använder testen skickas profiluppgifter och meddelanden till Millis för att leverera funktionen. Webbläsaren frågar om mikrofonåtkomst vid rösttest." },
      { heading: "Registrering", text: "Kontaktuppgifterna i tresstegsformuläret används för sammanställningen innan du går vidare till Stripe. Hjälpa tar inte emot kortuppgifter i formuläret." },
      { heading: "Känsliga uppgifter", text: "Dela inte känsliga personuppgifter eller andra sekretessbelagda uppgifter i röst- och chattesten." },
    ],
  },
  payment: {
    title: "Provperiod och betalning",
    intro: "Priser och betalningsflöde för Hjälpa Företag.",
    sections: [
      { heading: "14 dagar gratis", text: "Första 14 dagarna är kostnadsfria. Därefter kostar Hjälpa Företag 499 kr/mån i 12 månader. Sedan är ordinarie pris 1 499 kr/mån." },
      { heading: "Priser och avtal", text: "Alla priser är exklusive moms. Abonnemanget har ingen bindningstid." },
      { heading: "Stripe", text: "Registrering och betalning slutförs hos Stripe. Stripe ansvarar för sitt eget betalningsflöde och sin hantering av betalningsuppgifter." },
    ],
  },
  cookies: {
    title: "Cookie-information",
    intro: "Information om cookies och liknande teknik på Hjälpa-sidan.",
    sections: [
      { heading: "Egna funktioner", text: "Sidan använder inga egna analys- eller marknadsföringskakor. Formulärval hålls i sidans minne medan du använder den." },
      { heading: "Millis", text: "Rösttestet öppnar innehåll från Millis först när du startar det. Millis kan då använda nödvändig teknisk lagring för att leverera funktionen." },
      { heading: "Stripe", text: "Stripe öppnas som extern tjänst när registreringen är kopplad. Där gäller Stripes egen information om cookies och dataskydd." },
    ],
  },
};

function Field({ label, htmlFor, error, className = "", children }: { label: string; htmlFor: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <div className={`field ${className}`.trim()}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? <p className="field-error" id={`${htmlFor}-error`}>{error}</p> : null}
    </div>
  );
}

export default function Home() {
  const reduceMotion = useReducedMotion();
  const [audience, setAudience] = useState<"company" | "private">("company");
  const [form, setForm] = useState<CompanyInput>(emptyCompanyInput);
  const [errors, setErrors] = useState<FormErrors>({});
  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
  const [demoMode, setDemoMode] = useState<"voice" | "chat">("voice");
  const [sessionActive, setSessionActive] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
  const [signupPhone, setSignupPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupUpdates, setSignupUpdates] = useState("SMS");
  const [signupStart, setSignupStart] = useState("Så snart som möjligt");
  const [signupConsent, setSignupConsent] = useState(false);
  const [signupCompanyEditing, setSignupCompanyEditing] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [footerInfo, setFooterInfo] = useState<keyof typeof footerInfoContent | null>(null);
  const [profileId] = useState(() => new URLSearchParams(window.location.search).get("profil"));
  const chatLogRef = useRef<HTMLDivElement>(null);
  const voicePanelRef = useRef<HTMLElement>(null);
  const scrollToDemoAfterSaveRef = useRef(false);
  const signupDialogRef = useRef<HTMLDialogElement>(null);
  const footerInfoDialogRef = useRef<HTMLDialogElement>(null);

  const profileQuery = trpc.company.byId.useQuery(
    { publicId: profileId ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: Boolean(profileId), retry: false },
  );

  const createProfile = trpc.company.create.useMutation({
    onSuccess: (profile) => {
      const next = { ...profile, urgentInstructions: profile.urgentInstructions ?? "", consent: true };
      setSavedProfile(next);
      setForm(next);
      setSessionActive(false);
      setChatMessages([]);
      setChatInput("");
      setSaveMessage(`${profile.companyName} är sparad. Röst- och chattesten är redo.`);
      const url = new URL(window.location.href);
      url.searchParams.set("profil", profile.publicId);
      window.history.replaceState({}, "", url);
      scrollToDemoAfterSaveRef.current = true;
    },
  });

  const chatMutation = trpc.chat.message.useMutation({
    onSuccess: (result) => {
      setChatMessages((current) => [...current, { role: "assistant", content: result.message }]);
    },
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    const next = { ...profileQuery.data, urgentInstructions: profileQuery.data.urgentInstructions ?? "", consent: true };
    setForm(next);
    setSavedProfile(next);
  }, [profileQuery.data]);

  useEffect(() => {
    if (!savedProfile || !scrollToDemoAfterSaveRef.current) return;
    scrollToDemoAfterSaveRef.current = false;
    if (!window.matchMedia("(max-width: 959px)").matches) return;

    const timer = window.setTimeout(() => {
      voicePanelRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [savedProfile, reduceMotion]);

  useEffect(() => {
    if (!chatLogRef.current) return;
    chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [chatMessages, chatMutation.isPending, sessionActive]);

  const embedUrl = useMemo(
    () => savedProfile ? buildMillisEmbedUrl(savedProfile, savedProfile.publicId) : "",
    [savedProfile],
  );

  function update<K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "industry") next.services = getIndustryServices(String(value));
      if (key === "serviceArea") next.city = String(value);
      return next;
    });
    setErrors((current) => ({
      ...current,
      [key]: undefined,
      ...(key === "industry" ? { services: undefined } : {}),
      ...(key === "serviceArea" ? { city: undefined } : {}),
    }));
    setSaveMessage("");
    setSavedProfile(null);
    setSessionActive(false);
    setChatMessages([]);
    setChatInput("");
    chatMutation.reset();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveMessage("");
    const result = companyInputSchema.safeParse(form);
    if (!result.success) {
      const nextErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof CompanyInput;
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      const firstKey = Object.keys(nextErrors)[0];
      document.getElementById(firstKey)?.focus();
      return;
    }
    setErrors({});
    createProfile.mutate(result.data);
  }

  function fillExample() {
    setForm(exampleCompanyInput);
    setErrors({});
    setSavedProfile(null);
    setSessionActive(false);
    setChatMessages([]);
    setChatInput("");
    chatMutation.reset();
    setSaveMessage("Exemplet är ifyllt. Spara för att förbereda samtalet.");
  }

  function resetDemo() {
    setForm(emptyCompanyInput);
    setErrors({});
    setSavedProfile(null);
    setSessionActive(false);
    setChatMessages([]);
    setChatInput("");
    chatMutation.reset();
    setSaveMessage("");
    const url = new URL(window.location.href);
    url.searchParams.delete("profil");
    window.history.replaceState({}, "", url);
  }

  function changeDemoMode(mode: "voice" | "chat") {
    setDemoMode(mode);
    setSessionActive(false);
    chatMutation.reset();
  }

  function startDemo() {
    if (!savedProfile) return;
    if (demoMode === "chat" && chatMessages.length === 0) {
      setChatMessages([{
        role: "assistant",
        content: `Hej! Du har kommit till ${savedProfile.companyName}. Vad kan jag hjälpa dig med?`,
      }]);
    }
    setSessionActive(true);
  }

  function sendChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = chatInput.trim();
    if (!savedProfile || !content || chatMutation.isPending) return;

    const nextMessages: ChatMessage[] = [...chatMessages, { role: "user", content }];
    setChatMessages(nextMessages);
    setChatInput("");
    chatMutation.mutate({
      publicId: savedProfile.publicId,
      profile: savedProfile,
      messages: nextMessages,
    });
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(millisAgentPrompt);
      setCopyMessage("Agentprompten är kopierad.");
    } catch {
      setCopyMessage("Kopiering misslyckades. Markera prompten och kopiera den manuellt.");
    }
  }

  function openSignup() {
    setSignupStep(1);
    setSignupConsent(false);
    setSignupCompanyEditing(!(savedProfile ?? form).companyName.trim());
    setSignupError("");
    signupDialogRef.current?.showModal();
  }

  function closeSignup() {
    signupDialogRef.current?.close();
  }

  function openFooterInfo(topic: keyof typeof footerInfoContent) {
    setFooterInfo(topic);
    footerInfoDialogRef.current?.showModal();
  }

  function closeFooterInfo() {
    footerInfoDialogRef.current?.close();
  }

  function handleSignupSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSignupError("");

    if (signupStep === 1) {
      setSignupStep(2);
      return;
    }

    if (signupStep === 2) {
      setSignupStep(3);
      return;
    }

    if (!signupConsent) return;

    if (!hasStripePaymentLink) {
      setSignupError("Stripe är inte kopplat ännu. Ingen registrering eller betalning har startats.");
      return;
    }

    window.location.assign(stripePaymentLink);
  }

  const isRestoring = Boolean(profileId) && profileQuery.isLoading;
  const signupProfile = savedProfile ?? form;

  if (audience === "private") {
    return (
      <PrivateHome
        onSelectCompany={() => {
          setAudience("company");
          window.scrollTo({ top: 0, behavior: "auto" });
        }}
      />
    );
  }

  return (
    <div className="site-shell" id="top">
      <header className="site-header">
        <a className="brand brand-wordmark" href="#top" aria-label="Hjälpa, till sidans början">Hjälpa.</a>
        <div className="header-actions">
          <nav className="main-nav" aria-label="Huvudmeny">
            <a href="#pris">Pris</a>
            <a href="#sa-fungerar-det">Så fungerar det</a>
          </nav>
          <div className="audience-toggle" role="group" aria-label="Välj målgrupp">
            <button type="button" aria-pressed={audience === "company"} onClick={() => setAudience("company")}>Företag</button>
            <button type="button" aria-pressed="false" onClick={() => setAudience("private")}>Privatperson</button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <motion.div
            className="hero-copy"
            initial={reduceMotion ? false : { y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="hero-kicker">DIN AI-ASSISTENT FÖR SERVICEFÖRETAG</p>
            <h1 id="hero-title">Du kan inte svara på alla samtal.<br />Men din nya kollega kan.</h1>
            <p className="hero-intro">Varje missat samtal kan vara ett förlorat jobb. Hjälpa finns där för dina kunder när du inte hinner.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#demo">Testa med ditt företag <ArrowUpRight size={18} /></a>
              <a className="button button-ghost" href="#sa-fungerar-det">Så fungerar det</a>
            </div>
            <div className="customer-logo-line" aria-label="Kunder och exempel">
              <span className="customer-logo-label">Kunder och exempel</span>
              <ul className="customer-logos">
                <li>Lasses Rör</li>
                <li>Målarbröder</li>
                <li>Rikards El</li>
                <li>El Syd</li>
                <li>Helsingborgs Tak</li>
                <li>Lindqvists Rör</li>
                <li>NORDVERK</li>
                <li>Fastighetsform</li>
                <li>EL / SERVICE</li>
                <li>Nordisk Städ</li>
              </ul>
            </div>
          </motion.div>

          <div className="hero-artifacts" aria-label="Omdömen, GDPR och kontroll">
            <motion.article
              className="artifact artifact-profile artifact-trustpilot"
              initial={reduceMotion ? false : { x: -18, y: 12 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.65, delay: reduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="artifact-heading"><span>Kundomdömen</span><Star size={17} /></div>
              <strong className="trust-wordmark">Trustpilot</strong>
              <div className="trust-stars" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((star) => <Star key={star} size={18} />)}
              </div>
              <p className="trust-connection"><span aria-hidden="true" />Konto kopplas senare</p>
            </motion.article>

            <motion.article
              className="artifact artifact-call artifact-google"
              initial={reduceMotion ? false : { x: 18, y: -8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.65, delay: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="artifact-heading"><span>Kundomdömen</span><Star size={17} /></div>
              <strong className="trust-wordmark">Google <span>Reviews</span></strong>
              <div className="trust-stars" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((star) => <Star key={star} size={18} />)}
              </div>
              <p className="trust-connection"><span aria-hidden="true" />Konto kopplas senare</p>
            </motion.article>

            <motion.article
              className="artifact artifact-steps artifact-security"
              initial={reduceMotion ? false : { y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: reduceMotion ? 0 : 0.38, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="artifact-heading"><span>GDPR</span><ShieldCheck size={18} /></div>
              <strong>Tryggt att testa</strong>
              <p>Tydligt samtycke före röst- och chattest.</p>
              <span className="trust-security-note"><Check size={14} weight="bold" />Inga känsliga uppgifter i demon</span>
            </motion.article>

          </div>

        </section>

        <section className="demo-section" id="demo" aria-labelledby="demo-title">
          <div className="section-heading">
            <h2 id="demo-title">Lär känna din nya kollega.</h2>
            <p>Berätta om ditt företag så får du se hur Hjälpa kan underlätta din arbetsdag.</p>
          </div>

          {profileQuery.isError ? (
            <div className="notice notice-error" role="alert">
              <p>Den sparade demoprofilen kunde inte hämtas. Skapa en ny profil för att fortsätta.</p>
              <button className="text-button" type="button" onClick={resetDemo}>Skapa ny demoprofil</button>
            </div>
          ) : null}

          <div className="demo-workspace">
            {isRestoring ? (
              <div className="form-skeleton" aria-label="Hämtar demoprofil">
                <span /><span /><span /><span /><span />
              </div>
            ) : (
              <form className="company-form" onSubmit={handleSubmit} noValidate>
                <div className="form-toolbar">
                  <h3>Berätta om ditt företag</h3>
                  <button className="text-button" type="button" onClick={fillExample}>
                    <Plus size={16} weight="bold" /> Fyll exempel
                  </button>
                </div>

                <div className="form-grid">
                  <Field className="field-span-full" label="Företagsnamn" htmlFor="companyName" error={errors.companyName}>
                    <input id="companyName" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} aria-describedby={errors.companyName ? "companyName-error" : undefined} aria-invalid={Boolean(errors.companyName)} autoComplete="organization" placeholder="Till exempel Lindqvists Rör" />
                  </Field>
                  <Field label="Förnamn" htmlFor="contactName" error={errors.contactName}>
                    <input id="contactName" value={form.contactName} onChange={(e) => update("contactName", e.target.value)} aria-describedby={errors.contactName ? "contactName-error" : undefined} aria-invalid={Boolean(errors.contactName)} autoComplete="given-name" placeholder="Erik" />
                  </Field>
                  <Field label="Ort" htmlFor="serviceArea" error={errors.serviceArea}>
                    <select id="serviceArea" value={form.serviceArea} onChange={(e) => update("serviceArea", e.target.value)} aria-describedby={errors.serviceArea ? "serviceArea-error" : undefined} aria-invalid={Boolean(errors.serviceArea)}>
                      <option value="" disabled>Välj län</option>
                      {swedishCounties.map((county) => <option key={county} value={county}>{county}</option>)}
                    </select>
                  </Field>
                  <Field className="field-span-full" label="Bransch" htmlFor="industry" error={errors.industry}>
                    <select id="industry" value={form.industry} onChange={(e) => update("industry", e.target.value)} aria-describedby={errors.industry ? "industry-error" : "industry-help"} aria-invalid={Boolean(errors.industry)}>
                      <option value="" disabled>Välj bransch</option>
                      {industryRegister.map((entry) => <option key={entry.name} value={entry.name}>{entry.name}</option>)}
                    </select>
                    {!errors.industry ? <p className="field-help" id="industry-help">Tjänster fylls i automatiskt.</p> : null}
                  </Field>
                </div>

                <div className="consent-block">
                  <label htmlFor="consent">
                    <input id="consent" type="checkbox" checked={form.consent} onChange={(e) => update("consent", e.target.checked)} aria-describedby={errors.consent ? "consent-error" : undefined} />
                    <span>Jag godkänner att mina företagsuppgifter och meddelanden används i Hjälpas röst- och chattest.</span>
                  </label>
                  {errors.consent ? <p className="field-error" id="consent-error">{errors.consent}</p> : null}
                </div>

                {createProfile.isError ? <p className="form-error" role="alert">Det går inte att spara demoprofiler just nu. Försök igen senare.</p> : null}
                {saveMessage ? <p className="form-success" role="status"><Check size={18} weight="bold" />{saveMessage}</p> : null}

                <div className="form-actions">
                  <button className="button button-primary" type="submit" disabled={createProfile.isPending}>
                    {createProfile.isPending ? "Sparar demoprofil..." : "Skapa min assistent"}
                    {!createProfile.isPending ? <ArrowRight size={18} weight="bold" /> : null}
                  </button>
                  {savedProfile || form.companyName ? <button className="text-button" type="button" onClick={resetDemo}>Börja om</button> : null}
                </div>
              </form>
            )}

            <aside ref={voicePanelRef} className="voice-panel" aria-label="Röst- eller chattest med Hjälpa">
              <div className="demo-mode-toggle" role="group" aria-label="Välj demoläge">
                <button type="button" aria-pressed={demoMode === "voice"} onClick={() => changeDemoMode("voice")}>
                  <Microphone size={17} weight={demoMode === "voice" ? "fill" : "regular"} /> Röst
                </button>
                <button type="button" aria-pressed={demoMode === "chat"} onClick={() => changeDemoMode("chat")}>
                  <ChatCircle size={17} weight={demoMode === "chat" ? "fill" : "regular"} /> Chatt
                </button>
              </div>

              <div className="voice-panel-heading">
                <span className="voice-label">
                  {demoMode === "voice" ? <Microphone size={18} weight="fill" /> : <ChatCircle size={18} weight="fill" />}
                  {demoMode === "voice" ? "Rösttest" : "Textchatt"}
                </span>
                {savedProfile && !sessionActive ? <span className="ready-label">{demoMode === "voice" ? "Klar att ringa" : "Klar att chatta"}</span> : null}
              </div>

              {sessionActive && savedProfile && demoMode === "voice" ? (
                <div className="call-view">
                  <iframe
                    src={embedUrl}
                    title={`Testsamtal med ${savedProfile.companyName}`}
                    allow="microphone"
                    scrolling="no"
                    width="100%"
                    height="100%"
                  />
                  <button className="button button-on-dark" type="button" onClick={() => setSessionActive(false)}>
                    <PhoneDisconnect size={18} weight="fill" /> Stäng testet
                  </button>
                </div>
              ) : sessionActive && savedProfile && demoMode === "chat" ? (
                <div className="chat-view">
                  <div className="chat-card">
                    <div className="chat-card-heading">
                      <span className="chat-avatar" aria-hidden="true"><Asterisk size={24} /></span>
                      <span><strong>Hjälpa-assistenten</strong><small>Exempel på samtal</small></span>
                    </div>
                    <div className="chat-log" ref={chatLogRef} aria-live="polite" aria-busy={chatMutation.isPending}>
                      {chatMessages.map((message, index) => (
                        <p className={`chat-bubble chat-bubble-${message.role}`} key={`${message.role}-${index}`}>{message.content}</p>
                      ))}
                      {chatMutation.isPending ? <p className="chat-bubble chat-bubble-assistant chat-thinking">Assistenten skriver...</p> : null}
                    </div>
                    {chatMutation.isError ? (
                      <p className="chat-error" role="alert">
                        {chatMutation.error.data?.code === "PRECONDITION_FAILED" ? "Textchatten är inte aktiverad ännu." : "Chatten kunde inte svara just nu. Försök igen senare."}
                      </p>
                    ) : null}
                    <form className="chat-composer" onSubmit={sendChatMessage}>
                      <label className="sr-only" htmlFor="chat-message">Meddelande till företagets assistent</label>
                      <input id="chat-message" value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Skriv ett meddelande..." maxLength={4000} disabled={chatMutation.isPending} />
                      <button type="submit" aria-label="Skicka meddelande" disabled={!chatInput.trim() || chatMutation.isPending}>
                        <PaperPlaneRight size={18} weight="fill" />
                      </button>
                    </form>
                  </div>
                  <button className="button button-on-dark" type="button" onClick={() => setSessionActive(false)}>Avsluta chatten</button>
                </div>
              ) : savedProfile ? (
                <div className="call-ready">
                  <div>
                    <p className="call-company">{savedProfile.companyName}</p>
                    <p>Samma företagsuppgifter, tjänster, ort och ton används i både röst och chatt.</p>
                  </div>
                  <div className="profile-facts">
                    <span><Buildings size={17} />{savedProfile.industry}</span>
                    <span><ShieldCheck size={17} />{demoMode === "voice" ? "Inspelning hanteras i Hjälpa" : "Meddelanden hanteras i Hjälpa"}</span>
                  </div>
                  <button className="button button-light" type="button" onClick={startDemo}>
                    {demoMode === "voice" ? <Microphone size={19} weight="fill" /> : <ChatCircle size={19} weight="fill" />}
                    {demoMode === "voice" ? "Starta rösttest" : "Starta textchatt"}
                  </button>
                  <p className="privacy-note">{demoMode === "voice" ? "Webbläsaren frågar om mikrofonåtkomst. Avsluta genom att stoppa samtalet i Hjälpa eller stänga testet." : "Meddelanden hanteras i Hjälpa när du skickar dem. Dela inga känsliga uppgifter."}</p>
                </div>
              ) : (
                <div className="voice-empty">
                  {demoMode === "voice" ? <Microphone size={44} weight="thin" aria-hidden="true" /> : <ChatCircle size={44} weight="thin" aria-hidden="true" />}
                  <h3>{demoMode === "voice" ? "Här händer det." : "Chatta med assistenten."}</h3>
                  <p>Spara företagsprofilen först. Samma uppgifter används sedan för både röst och chatt direkt här.</p>
                </div>
              )}
            </aside>
          </div>
        </section>

        <section className="process-section" id="sa-fungerar-det" aria-labelledby="process-title">
          <div className="background-artifact background-summary" aria-hidden="true">
            <div className="background-artifact-heading"><span>Samtalssammanfattning</span><Check size={16} weight="bold" /></div>
            <strong>Offert på badrumsrenovering</strong>
            <p>Kundens behov, adress och önskad tid är samlade.</p>
            <div className="background-artifact-detail"><span>2 min 14 s</span><span className="background-artifact-status">Klar</span></div>
          </div>
          <div className="conversation-thread thread-process" aria-hidden="true">
            <span className="thread-node-active" /><i /><span /><i /><span />
          </div>
          <div className="process-heading">
            <h2 id="process-title">Samtalet är bara början.</h2>
            <p>Kunden ringer ert vanliga nummer. Hjälpa svarar, ställer följdfrågor och skickar allt vidare där ni jobbar.</p>
          </div>
          <div className="process-grid">
            <article className="process-card">
              <span className="process-number">01</span>
              <h3>Kunden ringer</h3>
              <p>Till ert vanliga nummer.</p>
              <div className="process-visual process-incoming" aria-hidden="true">
                <div className="process-main-icon"><PhoneCall size={54} weight="thin" /></div>
                <div className="process-speech">
                  <User size={20} />
                  <span>”Hej! Jag skulle vilja få en offert.”</span>
                </div>
              </div>
              <ArrowRight className="process-arrow" size={20} aria-hidden="true" />
            </article>
            <article className="process-card process-card-active">
              <span className="process-number">02</span>
              <h3>Hjälpa svarar</h3>
              <p>Tar emot samtalet i ert namn.</p>
              <div className="process-visual process-answer" aria-hidden="true">
                <div className="process-main-icon"><Waveform size={54} weight="thin" /></div>
                <div className="process-speech">
                  <Sparkle size={20} weight="fill" />
                  <span>”Hej! Tack för att du ringer Lindqvists Rör, hur kan jag hjälpa dig?”</span>
                </div>
              </div>
              <ArrowRight className="process-arrow" size={20} aria-hidden="true" />
            </article>
            <article className="process-card">
              <span className="process-number">03</span>
              <h3>Tar jobbet vidare</h3>
              <p>Hjälpa hanterar samtalet och gör det som behövs.</p>
              <div className="process-visual process-task-list">
                <div><CalendarCheck size={22} /><span>Bokar i kalendern</span></div>
                <div><ChatCircle size={22} /><span>Ställer följdfrågor</span></div>
                <div><FileText size={22} /><span>Förbereder offert</span></div>
              </div>
              <ArrowRight className="process-arrow" size={20} aria-hidden="true" />
            </article>
            <article className="process-card">
              <span className="process-number">04</span>
              <h3>Ni får allt direkt</h3>
              <p>Som SMS, WhatsApp, mejl eller till ert CRM.</p>
              <div className="process-visual process-channel-grid">
                <div><ChatCircle size={24} /><span>SMS</span></div>
                <div><WhatsappLogo size={24} /><span>WhatsApp</span></div>
                <div><EnvelopeSimple size={24} /><span>Mejl</span></div>
                <div><Database size={24} /><span>CRM</span></div>
              </div>
            </article>
          </div>
          <p className="process-footnote"><span aria-hidden="true" />Enkelt för kunden. Enkelt för er.</p>
        </section>

        <section className="stories-section" aria-labelledby="stories-title">
          <div className="background-artifact background-booking" aria-hidden="true">
            <div className="background-artifact-heading"><span>Nästa bokning</span><CalendarCheck size={17} /></div>
            <strong>Torsdag 09:30</strong>
            <p>Servicebesök hos kund. Adress och kontaktuppgifter finns med.</p>
            <div className="background-artifact-detail"><span>Lindqvists Rör</span><span className="background-artifact-status">Bokad</span></div>
          </div>
          <div className="conversation-thread thread-stories" aria-hidden="true">
            <span /><i /><span className="thread-node-active" /><i /><span />
          </div>
          <div className="stories-heading">
            <h2 id="stories-title">En kollega att räkna med.</h2>
            <p>Så upplever andra företagare att ha Hjälpa vid sin sida.</p>
            <small>Exempeltexter tills verifierade kundberättelser läggs in.</small>
          </div>
          <div className="stories-grid">
            <article className="artifact story-card">
              <div className="artifact-heading"><span>Hantverkare</span><Quotes size={19} /></div>
              <blockquote>”Jag behöver inte avbryta ett jobb för att svara. Kunden får hjälp direkt och jag får en tydlig sammanfattning när jag är klar.”</blockquote>
              <p className="story-meta">Exempeltext</p>
            </article>
            <article className="artifact story-card">
              <div className="artifact-heading"><span>Serviceföretagare</span><Quotes size={19} /></div>
              <blockquote>”När jag ringer tillbaka vet jag redan vad kunden behöver, var jobbet är och hur brådskande det är.”</blockquote>
              <p className="story-meta story-meta-warm">Exempeltext</p>
            </article>
            <article className="artifact story-card">
              <div className="artifact-heading"><span>Fastighetsservice</span><Quotes size={19} /></div>
              <blockquote>”Efter samtalet finns bokningen och offertunderlaget med. Det sparar både tid och en hel del kvällsarbete.”</blockquote>
              <p className="story-meta story-meta-mint">Exempeltext</p>
            </article>
          </div>
        </section>

        <section className="pricing-section" id="pris" aria-labelledby="pricing-title">
          <div className="pricing-value">
            <p className="pricing-kicker">Ett paket. All hjälp du behöver.</p>
            <h2 id="pricing-title">En extra kollega.<br />Utan en extra lön.</h2>
            <p className="pricing-intro">Få hjälp med kunderna, bokningarna och administrationen. Till ett pris som gör det enkelt att börja.</p>
            <div className="pricing-value-list">
              <div className="pricing-value-row">
                <PhoneCall size={23} weight="regular" aria-hidden="true" />
                <div><h3>Svarar när du inte kan</h3><p>Kunden får hjälp direkt, även när du står mitt i ett jobb.</p></div>
              </div>
              <div className="pricing-value-row">
                <CalendarCheck size={23} weight="regular" aria-hidden="true" />
                <div><h3>Från samtal till nästa steg</h3><p>Bokningar, följdfrågor och offertunderlag samlas i samma flöde.</p></div>
              </div>
              <div className="pricing-value-row">
                <User size={23} weight="regular" aria-hidden="true" />
                <div><h3>Personlig uppstart</h3><p>Få hjälp att ställa in Hjälpa efter företagets arbetssätt.</p></div>
              </div>
            </div>
          </div>

          <article className="artifact pricing-card" aria-label="Pris för Hjälpa Företag">
            <div className="pricing-card-top">
              <h3>Hjälpa Företag</h3>
              <span className="pricing-badge">14 dagar gratis</span>
            </div>
            <p className="pricing-old"><s>Ordinarie 1 499 kr/mån</s></p>
            <p className="pricing-price">499 kr <span>/mån</span></p>
            <p className="pricing-trial">Första 14 dagarna är gratis. Ingen bindningstid.</p>
            <p className="pricing-terms">Därefter 499 kr/mån i 12 månader. Sedan 1 499 kr/mån. Exkl. moms.</p>
            <ul className="pricing-features">
              {planFeatures.map((feature) => <li key={feature}><Check size={18} weight="bold" aria-hidden="true" />{feature}</li>)}
            </ul>
            <button className="button button-primary pricing-cta" type="button" onClick={openSignup}>
              Kom igång med Hjälpa <ArrowRight size={18} weight="bold" />
            </button>
            <p className="pricing-footnote">Inga långa avtal. Du bestämmer hur länge du vill fortsätta.</p>
          </article>
        </section>

        <section className="faq-section" aria-labelledby="faq-title">
          <div className="background-artifact background-quote" aria-hidden="true">
            <div className="background-artifact-heading"><span>Offertunderlag</span><FileText size={17} /></div>
            <strong>Redo för granskning</strong>
            <p>Kunduppgifter och arbetsomfattning har samlats in från samtalet.</p>
            <div className="background-artifact-lines"><span /><span /><span /></div>
          </div>
          <div className="conversation-thread thread-faq" aria-hidden="true">
            <span /><i /><span /><i /><span className="thread-node-active" />
          </div>
          <div className="faq-heading">
            <h2 id="faq-title">Bra att veta.</h2>
          </div>
          <div className="faq-list">
            {faqItems.map((item) => (
              <details key={item.question}>
                <summary>
                  <span>{item.question}</span>
                  <Plus className="faq-icon" size={20} aria-hidden="true" />
                </summary>
                <div className="faq-answer"><p>{item.answer}</p></div>
              </details>
            ))}
          </div>
        </section>

        <section className="setup-section" aria-labelledby="setup-title">
          <details>
            <summary>
              <span><strong id="setup-title">För dig som ställer in Hjälpa</strong><small>Prompt och metadata för personaliseringen</small></span>
              <ArrowUpRight size={22} weight="bold" />
            </summary>
            <div className="setup-content">
              <p>Klistra in prompten i agentinställningarna. Variablerna hämtas från formuläret när testet byggs. Samtalsflöde, avbrott, tidsgränser, inspelning och integritet ställs in i agentverktyget.</p>
              <pre>{millisAgentPrompt}</pre>
              <button className="button button-secondary" type="button" onClick={copyPrompt}><Copy size={17} weight="bold" /> Kopiera agentprompt</button>
              {copyMessage ? <p className="copy-status" role="status">{copyMessage}</p> : null}
            </div>
          </details>
        </section>
      </main>

      <dialog
        className="signup-dialog"
        ref={signupDialogRef}
        aria-labelledby="signup-title"
        aria-describedby="signup-description"
        onClose={() => setSignupError("")}
        onClick={(event) => { if (event.target === event.currentTarget) closeSignup(); }}
      >
        <div className="signup-shell">
          <button className="signup-close" type="button" onClick={closeSignup}>Stäng registrering <X size={18} /></button>
          <div className="signup-brand-row">
            <span className="signup-brand">Hjälpa.</span>
            <span>Steg {signupStep} av 3</span>
          </div>
          <div className="signup-progress" aria-hidden="true">
            {[1, 2, 3].map((step) => <span className={signupStep >= step ? "is-complete" : ""} key={step} />)}
          </div>

          <form className="signup-form" onSubmit={handleSignupSubmit}>
            {signupStep === 1 ? (
              <>
                <div className="signup-heading">
                  <h2 id="signup-title">Hur når vi dig?</h2>
                  <p id="signup-description">{signupProfile.companyName ? `Vi har redan uppgifterna om ${signupProfile.companyName}.` : "Fyll i dina kontaktuppgifter för att gå vidare."}</p>
                </div>
                <div className="signup-fields">
                  <div className="field">
                    <label htmlFor="signup-phone">Mobilnummer</label>
                    <input id="signup-phone" type="tel" autoComplete="tel" placeholder="070 123 45 67" value={signupPhone} onChange={(event) => setSignupPhone(event.target.value)} required minLength={7} />
                  </div>
                  <div className="field">
                    <label htmlFor="signup-email">E-postadress</label>
                    <input id="signup-email" type="email" autoComplete="email" placeholder="namn@foretag.se" value={signupEmail} onChange={(event) => setSignupEmail(event.target.value)} required />
                  </div>
                </div>
                <div className="signup-actions signup-actions-end">
                  <button className="button button-primary" type="submit">Fortsätt <ArrowRight size={18} weight="bold" /></button>
                </div>
              </>
            ) : null}

            {signupStep === 2 ? (
              <>
                <div className="signup-heading">
                  <h2 id="signup-title">Hur vill du ha hjälp?</h2>
                  <p id="signup-description">Välj hur du vill få uppdateringar och när du vill komma igång.</p>
                </div>
                <fieldset className="signup-options">
                  <legend>Uppdateringar efter samtal</legend>
                  {["SMS", "E-post", "WhatsApp, om anslutning stöds"].map((option) => (
                    <label key={option}><input type="radio" name="signup-updates" value={option} checked={signupUpdates === option} onChange={() => setSignupUpdates(option)} /><span>{option}</span></label>
                  ))}
                </fieldset>
                <fieldset className="signup-options">
                  <legend>Önskad start</legend>
                  {["Så snart som möjligt", "Inom en vecka", "Inom en månad", "Jag vill prata först"].map((option) => (
                    <label key={option}><input type="radio" name="signup-start" value={option} checked={signupStart === option} onChange={() => setSignupStart(option)} /><span>{option}</span></label>
                  ))}
                </fieldset>
                <div className="signup-actions">
                  <button className="button button-ghost" type="button" onClick={() => setSignupStep(1)}>Tillbaka</button>
                  <button className="button button-primary" type="submit">Fortsätt <ArrowRight size={18} weight="bold" /></button>
                </div>
              </>
            ) : null}

            {signupStep === 3 ? (
              <>
                <div className="signup-heading">
                  <h2 id="signup-title">Snart är din nya kollega redo.</h2>
                  <p id="signup-description">Kontrollera uppgifterna innan du går vidare till Stripe.</p>
                </div>
                <div className="signup-plan">
                  <div className="pricing-card-top"><h3>Hjälpa Företag</h3><span className="pricing-badge">14 dagar gratis</span></div>
                  <p className="signup-plan-price">499 kr/mån <s>1 499 kr</s></p>
                  <p>14 dagar gratis. Därefter 499 kr/mån i 12 månader. Sedan 1 499 kr/mån. Exkl. moms.</p>
                  <ul><li><Check size={16} weight="bold" />100 samtalsminuter per månad</li><li><Check size={16} weight="bold" />Ingen bindningstid</li><li><Check size={16} weight="bold" />Personlig uppstart</li></ul>
                  <dl>
                    <div>
                      <dt>{signupCompanyEditing ? <label htmlFor="signup-company">Företag</label> : "Företag"}</dt>
                      <dd>{signupCompanyEditing ? <input className="signup-company-input" id="signup-company" autoComplete="organization" placeholder="Företagsnamn" value={signupProfile.companyName} onChange={(event) => update("companyName", event.target.value)} required /> : signupProfile.companyName}</dd>
                    </div>
                    <div><dt>Kontakt</dt><dd>{signupProfile.contactName || "Inte ifyllt"}</dd></div>
                    <div><dt>Telefon</dt><dd>{signupPhone}</dd></div>
                    <div><dt>E-post</dt><dd>{signupEmail}</dd></div>
                    <div><dt>Uppdateringar</dt><dd>{signupUpdates}</dd></div>
                    <div><dt>Start</dt><dd>{signupStart}</dd></div>
                  </dl>
                </div>
                <label className="signup-consent"><input type="checkbox" checked={signupConsent} onChange={(event) => setSignupConsent(event.target.checked)} required /><span>Jag vill komma igång med Hjälpa och har tagit del av prisinformationen och den kostnadsfria provperioden.</span></label>
                {signupError ? <p className="signup-error" role="alert">{signupError}</p> : null}
                <div className="signup-actions">
                  <button className="button button-ghost" type="button" onClick={() => setSignupStep(2)}>Tillbaka</button>
                  <button className="button button-primary" type="submit">Gå vidare till Stripe <ArrowUpRight size={18} weight="bold" /></button>
                </div>
              </>
            ) : null}
            <p className="signup-footnote">Ingen betalning sker här. Du slutför registreringen hos Stripe.</p>
          </form>
        </div>
      </dialog>

      <dialog
        className="info-dialog"
        ref={footerInfoDialogRef}
        aria-labelledby="footer-info-title"
        aria-describedby="footer-info-description"
        onClose={() => setFooterInfo(null)}
        onClick={(event) => { if (event.target === event.currentTarget) closeFooterInfo(); }}
      >
        {footerInfo ? (
          <div className="info-shell">
            <button className="info-close" type="button" onClick={closeFooterInfo}>Stäng <X size={18} /></button>
            <p className="info-brand">Hjälpa.</p>
            <h2 id="footer-info-title">{footerInfoContent[footerInfo].title}</h2>
            <p className="info-intro" id="footer-info-description">{footerInfoContent[footerInfo].intro}</p>
            <div className="info-sections">
              {footerInfoContent[footerInfo].sections.map((section) => (
                <section key={section.heading}><h3>{section.heading}</h3><p>{section.text}</p></section>
              ))}
            </div>
          </div>
        ) : null}
      </dialog>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand-column">
            <a className="brand brand-wordmark" href="#top" aria-label="Hjälpa, till sidans början">Hjälpa.</a>
            <p>En extra kollega för serviceföretag. Hjälpa svarar på samtal, chattar med kunder och förbereder nästa steg.</p>
            <a className="footer-demo-link" href="#demo">Testa med ditt företag <ArrowUpRight size={17} weight="bold" /></a>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h2>Produkt</h2>
              <a href="#sa-fungerar-det">Så fungerar det</a>
              <a href="#pris">Pris</a>
              <a href="#demo">Röst- och chattest</a>
            </div>
            <div className="footer-column">
              <h2>Information</h2>
              <button type="button" onClick={() => openFooterInfo("privacy")}>Dataskydd i demon</button>
              <button type="button" onClick={() => openFooterInfo("payment")}>Provperiod och betalning</button>
              <button type="button" onClick={() => openFooterInfo("cookies")}>Cookie-information</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Hjälpa.</p>
          <p>För serviceföretag i Sverige.</p>
        </div>
      </footer>
    </div>
  );
}
