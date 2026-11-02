import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  Camera,
  ChatCircle,
  Check,
  CheckCircle,
  Drop,
  FileText,
  HouseLine,
  Lightning,
  PaintBrush,
  Plus,
  ShieldCheck,
  Tree,
  WhatsappLogo,
  Wrench,
  X,
} from "@phosphor-icons/react";
import "../private.css";

const defaultMessage = "Hej Hjälpa! Jag behöver hjälp med något hemma. ";
const configuredWhatsAppUrl = import.meta.env.VITE_WHATSAPP_URL?.trim() ?? "";

function getWhatsAppUrl(message: string) {
  if (!configuredWhatsAppUrl) return "";

  try {
    const url = new URL(configuredWhatsAppUrl);
    const isWhatsAppHost = url.hostname === "wa.me" || url.hostname === "api.whatsapp.com";
    if (url.protocol !== "https:" || !isWhatsAppHost) return "";
    url.searchParams.set("text", message);
    return url.toString();
  } catch {
    return "";
  }
}

const hasWhatsAppDestination = Boolean(getWhatsAppUrl(defaultMessage));

const useCases = [
  {
    title: "Rör och vatten",
    description: "Droppande kran, stopp i avloppet eller en ny diskbänk.",
    icon: Drop,
    message: "Hej Hjälpa! Jag behöver hjälp med rör och vatten. Det gäller: ",
  },
  {
    title: "El",
    description: "Belysning, uttag eller annat som behöver en elektriker.",
    icon: Lightning,
    message: "Hej Hjälpa! Jag behöver hjälp med el. Det gäller: ",
  },
  {
    title: "Måleri och renovering",
    description: "Ett rum som behöver målas eller ett större projekt hemma.",
    icon: PaintBrush,
    message: "Hej Hjälpa! Jag behöver hjälp med måleri eller renovering. Det gäller: ",
  },
  {
    title: "Trädgård och utemiljö",
    description: "Gräsklippning, häckar eller annat som behöver göras utomhus.",
    icon: Tree,
    message: "Hej Hjälpa! Jag behöver hjälp med trädgård eller utemiljö. Det gäller: ",
  },
  {
    title: "Något annat hemma",
    description: "Beskriv vad du behöver hjälp med så börjar vi där.",
    icon: HouseLine,
    message: defaultMessage,
  },
];

const faqItems = [
  {
    question: "Vad kan jag skicka till Hjälpa?",
    answer: "Beskriv vad som behöver göras i ett vanligt meddelande. En bild kan hjälpa till att visa arbetet. Dela bara uppgifter som behövs för förfrågan och undvik känsliga personuppgifter.",
  },
  {
    question: "Kostar det något att börja?",
    answer: "Det är gratis att börja på WhatsApp. Eventuella avgifter för vidare användning ska presenteras tydligt innan du godkänner ett betalt steg.",
  },
  {
    question: "Hur snabbt får jag offerter?",
    answer: "Det beror på vilket arbete du behöver hjälp med och när företagen svarar. Hjälpa kan underlätta kontakten och sammanställningen, men kan inte lova att ett företag svarar inom en viss tid.",
  },
  {
    question: "Väljer Hjälpa företag åt mig?",
    answer: "Nej. Du får underlag för att jämföra och väljer själv om du vill gå vidare. Hjälpa bokar inget utan ditt godkännande.",
  },
  {
    question: "Måste jag boka efter en förfrågan?",
    answer: "Nej. En förfrågan är inte en bokning. Du bestämmer om och när du vill gå vidare med något av företagen.",
  },
];

const privateFooterInfo = {
  privacy: {
    title: "Dataskydd och WhatsApp",
    intro: "Information om vad som händer när du använder privatpersonssidan och väljer att öppna WhatsApp.",
    sections: [
      { heading: "Meddelanden och bilder", text: "Det du väljer att skicka används för att förstå din förfrågan och hjälpa dig med nästa steg. Dela inte känsliga personuppgifter eller annan information som inte behövs." },
      { heading: "WhatsApp", text: "När du öppnar WhatsApp lämnar du Hjälpas webbplats. WhatsApps egna villkor och integritetsinformation gäller i den externa tjänsten." },
      { heading: "Exempel på sidan", text: "Konversationer, företag, priser och tider som är märkta som exempel visar bara hur en sammanställning kan se ut. De är inte riktiga kundärenden eller offerter." },
    ],
  },
  payment: {
    title: "Kostnad och betalning",
    intro: "Så beskrivs kostnaden på privatpersonssidan.",
    sections: [
      { heading: "Gratis att börja", text: "Det är gratis att börja på WhatsApp. Eventuella avgifter för vidare användning ska presenteras innan du godkänner ett betalt steg." },
      { heading: "Ingen betalning på sidan", text: "Hjälpas privatpersonssida tar inte emot kortuppgifter och ingen betalning startas när du öppnar WhatsApp." },
      { heading: "Ditt godkännande", text: "En förfrågan är inte en bokning. Du väljer själv om du vill gå vidare efter att du har fått underlaget." },
    ],
  },
  cookies: {
    title: "Cookie-information",
    intro: "Information om cookies och externa tjänster på privatpersonssidan.",
    sections: [
      { heading: "Egna funktioner", text: "Sidan använder inga egna analys- eller marknadsföringskakor. Målgruppsvalet hålls i sidans minne medan du använder den." },
      { heading: "WhatsApp", text: "WhatsApp öppnas först när du väljer en WhatsApp-länk. Där gäller den externa tjänstens egen information om cookies och dataskydd." },
    ],
  },
};

type PrivateFooterTopic = keyof typeof privateFooterInfo;

type WhatsAppActionProps = {
  message?: string;
  className?: string;
  children: ReactNode;
  onUnavailable: () => void;
  ariaLabel?: string;
};

function WhatsAppAction({ message = defaultMessage, className = "", children, onUnavailable, ariaLabel }: WhatsAppActionProps) {
  const href = getWhatsAppUrl(message);

  if (!href) {
    return <button className={className} type="button" onClick={onUnavailable} aria-label={ariaLabel}>{children}</button>;
  }

  return <a className={className} href={href} target="_blank" rel="noreferrer" aria-label={ariaLabel}>{children}</a>;
}

export default function PrivateHome({ onSelectCompany }: { onSelectCompany: () => void }) {
  const reduceMotion = useReducedMotion();
  const [footerInfo, setFooterInfo] = useState<PrivateFooterTopic | null>(null);
  const footerDialogRef = useRef<HTMLDialogElement>(null);
  const unavailableDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  function openFooterInfo(topic: PrivateFooterTopic) {
    setFooterInfo(topic);
    footerDialogRef.current?.showModal();
  }

  function showWhatsAppUnavailable() {
    unavailableDialogRef.current?.showModal();
  }

  const whatsAppActionProps = { onUnavailable: showWhatsAppUnavailable };

  return (
    <div className="site-shell private-site" id="private-top">
      <header className="site-header">
        <a className="brand brand-wordmark" href="#private-top" aria-label="Hjälpa, till sidans början">Hjälpa.</a>
        <div className="header-actions">
          <nav className="main-nav" aria-label="Huvudmeny">
            <a href="#sa-fungerar-det-privat">Så fungerar det</a>
            <a href="#vanliga-fragor-privat">Vanliga frågor</a>
          </nav>
          <div className="audience-toggle" role="group" aria-label="Välj målgrupp">
            <button type="button" aria-pressed="false" onClick={onSelectCompany}>Företag</button>
            <button type="button" aria-pressed="true">Privatperson</button>
          </div>
        </div>
      </header>

      <main>
        <section className="private-hero" aria-labelledby="private-hero-title">
          <motion.div
            className="private-hero-copy"
            initial={reduceMotion ? false : { y: 18 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="private-hero-kicker">DIN PERSONLIGA HJÄLPREDA</p>
            <h1 id="private-hero-title">Slipp ringa runt.<br />Hjälpa gör det åt dig.</h1>
            <p className="private-hero-intro">Skicka ett meddelande eller en bild på WhatsApp. Hjälpa kontaktar företag, tar in offerter och hjälper dig att boka.</p>
            <div className="private-hero-actions">
              <WhatsAppAction {...whatsAppActionProps} className="button button-primary private-whatsapp-button">
                <WhatsappLogo size={21} weight="fill" />Börja gratis på WhatsApp<ArrowUpRight size={18} weight="bold" />
              </WhatsAppAction>
              <a className="private-text-link" href="#sa-fungerar-det-privat">Se hur det fungerar <ArrowRight size={16} /></a>
            </div>
            <p className="private-hero-note"><Check size={15} weight="bold" />Gratis att börja<span aria-hidden="true">·</span>Ingen bokning utan ditt godkännande</p>
            {!hasWhatsAppDestination ? <p className="private-configuration-note">WhatsApp-mottagaren kopplas in i den här förhandsversionen.</p> : null}
          </motion.div>

          <div className="private-hero-artifacts" aria-label="Exempel på hjälp och kontroll">
            <motion.article
              className="private-artifact private-artifact-request"
              initial={reduceMotion ? false : { x: -16, y: 10 }}
              animate={{ x: 0, y: 0 }}
              transition={{ duration: 0.65, delay: reduceMotion ? 0 : 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="private-artifact-heading"><span>Exempel på meddelande</span><ChatCircle size={18} /></div>
              <p className="private-request-copy">Hej! Min vattenkran droppar. Kan ni hjälpa mig?</p>
              <span className="private-photo-chip"><Camera size={15} />Bild bifogad</span>
            </motion.article>

            <motion.article
              className="private-artifact private-artifact-quotes"
              initial={reduceMotion ? false : { x: 16, y: -8 }}
              animate={{ x: 0, y: 0 }}
              transition={{ duration: 0.65, delay: reduceMotion ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="private-artifact-heading"><span>Exempel på översikt</span><FileText size={18} /></div>
              <strong>Offerter i samma vy</strong>
              <ul>
                <li><Check size={14} weight="bold" />Pris</li>
                <li><Check size={14} weight="bold" />Tid</li>
                <li><Check size={14} weight="bold" />Vad som ingår</li>
              </ul>
            </motion.article>

            <article className="private-artifact private-artifact-control">
              <div className="private-artifact-heading"><span>Du har kontrollen</span><ShieldCheck size={18} /></div>
              <strong>Du bestämmer nästa steg</strong>
              <p>Hjälpa bokar inget utan att du först har sagt ja.</p>
            </article>

            <article className="private-artifact private-artifact-start">
              <div className="private-artifact-heading"><span>Enklast möjliga start</span><WhatsappLogo size={18} /></div>
              <strong>Ett meddelande räcker</strong>
              <p>Beskriv vad som behöver göras. Hjälpa frågar om något saknas.</p>
            </article>
          </div>
        </section>

        <section className="private-value-line" aria-label="Hjälpas arbetssätt">
          <div><ChatCircle size={22} weight="light" /><span>Ett meddelande eller en bild</span></div>
          <div><FileText size={22} weight="light" /><span>Offerter samlade på ett ställe</span></div>
          <div><CheckCircle size={22} weight="light" /><span>Du väljer om du vill boka</span></div>
        </section>

        <section className="private-how" id="sa-fungerar-det-privat" aria-labelledby="private-how-title">
          <div className="private-section-heading">
            <h2 id="private-how-title">Från bild till bokning.<br />Utan ringandet.</h2>
            <p>Du beskriver vad du behöver hjälp med. Hjälpa sköter kontakten med företagen och samlar det du behöver för att välja.</p>
          </div>
          <div className="private-how-layout">
            <article className="private-chat-example" aria-label="Exempel på en WhatsApp-konversation">
              <div className="private-chat-topbar">
                <span className="private-chat-avatar">H.</span>
                <div><strong>Hjälpa</strong><span>Exempel på konversation</span></div>
                <WhatsappLogo size={23} />
              </div>
              <div className="private-chat-body">
                <p className="private-example-flag">EXEMPEL, INTE ETT RIKTIGT KUNDÄRENDE</p>
                <div className="private-message private-message-user">Hej! Min vattenkran i köket droppar. Jag kan vara hemma efter 16.</div>
                <div className="private-message-photo"><Camera size={19} /><span>Bild på vattenkranen</span></div>
                <div className="private-message private-message-assistant">Tack. Jag hjälper dig att kontakta rörmokare i ditt område. Vilken kommun bor du i?</div>
                <div className="private-message private-message-user private-message-short">Helsingborg.</div>
              </div>
              <div className="private-chat-next"><ArrowRight size={17} /><span>Nästa steg i exemplet: hämta offerter</span></div>
            </article>

            <ol className="private-steps">
              <li>
                <span className="private-step-number">01</span>
                <div><h3>Berätta vad som behöver göras</h3><p>Skriv i WhatsApp och lägg till en bild om det underlättar. Du behöver inte formulera en perfekt förfrågan.</p></div>
              </li>
              <li>
                <span className="private-step-number">02</span>
                <div><h3>Låt Hjälpa höra med företag</h3><p>Hjälpa kontaktar relevanta företag, följer upp svaren och samlar priser, tider och villkor.</p></div>
              </li>
              <li>
                <span className="private-step-number">03</span>
                <div><h3>Jämför och bestäm själv</h3><p>Se vad som ingår och välj om du vill gå vidare. Först efter ditt godkännande hjälper Hjälpa till med bokningen.</p></div>
              </li>
            </ol>
          </div>
        </section>

        <section className="private-use-cases" aria-labelledby="private-use-cases-title">
          <div className="private-use-cases-heading">
            <h2 id="private-use-cases-title">Vad behöver du få gjort?</h2>
            <p>Välj ett område så får du ett färdigt första meddelande i WhatsApp. Du kan ändra det innan du skickar.</p>
          </div>
          <div className="private-use-case-list">
            {useCases.map(({ icon: Icon, title, description, message }) => (
              <WhatsAppAction key={title} {...whatsAppActionProps} message={message} className="private-use-case" ariaLabel={`Be om hjälp med ${title.toLowerCase()} på WhatsApp`}>
                <span className="private-use-case-icon"><Icon size={26} weight="light" /></span>
                <span className="private-use-case-copy"><strong>{title}</strong><span>{description}</span></span>
                <ArrowUpRight className="private-use-case-arrow" size={21} />
              </WhatsAppAction>
            ))}
          </div>
        </section>

        <section className="private-quote-section" aria-labelledby="private-quote-title">
          <div className="private-quote-heading">
            <div>
              <p className="private-section-label">EXEMPEL PÅ OFFERTÖVERSIKT</p>
              <h2 id="private-quote-title">Allt som behövs<br />för att kunna välja.</h2>
            </div>
            <p>Slipp leta i mejl och anteckningar. Hjälpa ställer svaren bredvid varandra så att du kan jämföra mer än bara priset.</p>
          </div>
          <div className="private-quote-example">
            <div className="private-quote-meta"><span>Byte av vattenkran i köket</span><span>Exempel, inte riktiga offerter</span></div>
            <table>
              <caption className="private-visually-hidden">Exempel på tre påhittade offerter för byte av vattenkran</caption>
              <thead><tr><th scope="col">Företag</th><th scope="col">Pris</th><th scope="col">Tidigaste tid</th><th scope="col">Ingår</th></tr></thead>
              <tbody>
                <tr><td data-label="Företag"><strong>Företag A</strong></td><td data-label="Pris">4 800 kr</td><td data-label="Tidigaste tid">Tisdag 08:00</td><td data-label="Ingår">Material och arbete</td></tr>
                <tr><td data-label="Företag"><strong>Företag B</strong></td><td data-label="Pris">5 100 kr</td><td data-label="Tidigaste tid">Onsdag 12:00</td><td data-label="Ingår">Arbete, material tillkommer</td></tr>
                <tr><td data-label="Företag"><strong>Företag C</strong></td><td data-label="Pris">4 600 kr</td><td data-label="Tidigaste tid">Nästa fredag</td><td data-label="Ingår">Material och arbete</td></tr>
              </tbody>
            </table>
            <p className="private-example-disclaimer">Företag, priser och tider är påhittade för att visa formatet.</p>
          </div>
          <div className="private-quote-action">
            <p><ShieldCheck size={20} />Du väljer själv om och vem du vill gå vidare med.</p>
            <WhatsAppAction {...whatsAppActionProps} className="button button-primary private-whatsapp-button"><WhatsappLogo size={20} weight="fill" />Börja gratis på WhatsApp<ArrowUpRight size={18} /></WhatsAppAction>
          </div>
        </section>

        <section className="private-control-section" aria-labelledby="private-control-title">
          <div className="private-control-heading">
            <p className="private-section-label">DIN FÖRFRÅGAN. DITT BESLUT.</p>
            <h2 id="private-control-title">Hjälp med springet.<br />Kontroll kvar hos dig.</h2>
            <p>Hjälpa tar hand om det praktiska arbetet runt din förfrågan. Du bestämmer vad som händer vid varje viktigt steg.</p>
          </div>
          <div className="private-control-details">
            <div><CheckCircle size={25} weight="light" /><span><strong>Godkänn innan bokning</strong><p>Ingen tid bokas utan att du har valt att gå vidare.</p></span></div>
            <div><FileText size={25} weight="light" /><span><strong>Se vad som ingår</strong><p>Jämför pris, tid och villkor innan du bestämmer dig.</p></span></div>
            <div><CalendarCheck size={25} weight="light" /><span><strong>Börja utan kostnad</strong><p>Det är gratis att öppna konversationen. Ingen betalning startas på sidan.</p></span></div>
            <WhatsAppAction {...whatsAppActionProps} className="button button-primary private-whatsapp-button"><WhatsappLogo size={20} weight="fill" />Börja gratis på WhatsApp<ArrowUpRight size={18} /></WhatsAppAction>
          </div>
        </section>

        <section className="private-faq" id="vanliga-fragor-privat" aria-labelledby="private-faq-title">
          <div className="private-faq-heading"><h2 id="private-faq-title">Bra att veta.</h2><p>Det viktigaste innan du skickar din första förfrågan.</p></div>
          <div className="private-faq-list">
            {faqItems.map((item) => (
              <details key={item.question}>
                <summary><span>{item.question}</span><Plus className="private-faq-icon" size={20} /></summary>
                <div className="private-faq-answer"><p>{item.answer}</p></div>
              </details>
            ))}
          </div>
        </section>

        <section className="private-final-cta" aria-labelledby="private-final-title">
          <div className="private-final-icon" aria-hidden="true"><Wrench size={34} weight="light" /></div>
          <h2 id="private-final-title">Vad kan Hjälpa<br />fixa åt dig?</h2>
          <p>Skicka ett meddelande eller en bild. Det räcker för att komma igång.</p>
          <WhatsAppAction {...whatsAppActionProps} className="button button-primary private-whatsapp-button"><WhatsappLogo size={21} weight="fill" />Börja gratis på WhatsApp<ArrowUpRight size={18} /></WhatsAppAction>
          <span>Gratis att börja. Du godkänner innan något bokas.</span>
        </section>
      </main>

      <dialog className="info-dialog" ref={unavailableDialogRef} aria-labelledby="private-whatsapp-unavailable-title" onClick={(event) => { if (event.target === event.currentTarget) unavailableDialogRef.current?.close(); }}>
        <div className="info-shell private-unavailable-shell">
          <button className="info-close" type="button" onClick={() => unavailableDialogRef.current?.close()}>Stäng <X size={18} /></button>
          <p className="info-brand">Hjälpa.</p>
          <WhatsappLogo className="private-unavailable-icon" size={32} />
          <h2 id="private-whatsapp-unavailable-title">WhatsApp är inte kopplat ännu.</h2>
          <p className="info-intro">Mottagaren för Hjälpas WhatsApp saknas i den här förhandsversionen. Inget meddelande har skickats.</p>
          <button className="button button-primary" type="button" onClick={() => unavailableDialogRef.current?.close()}>Tillbaka till sidan</button>
        </div>
      </dialog>

      <dialog className="info-dialog" ref={footerDialogRef} aria-labelledby="private-info-title" aria-describedby="private-info-description" onClose={() => setFooterInfo(null)} onClick={(event) => { if (event.target === event.currentTarget) footerDialogRef.current?.close(); }}>
        {footerInfo ? (
          <div className="info-shell">
            <button className="info-close" type="button" onClick={() => footerDialogRef.current?.close()}>Stäng <X size={18} /></button>
            <p className="info-brand">Hjälpa.</p>
            <h2 id="private-info-title">{privateFooterInfo[footerInfo].title}</h2>
            <p className="info-intro" id="private-info-description">{privateFooterInfo[footerInfo].intro}</p>
            <div className="info-sections">
              {privateFooterInfo[footerInfo].sections.map((section) => <section key={section.heading}><h3>{section.heading}</h3><p>{section.text}</p></section>)}
            </div>
          </div>
        ) : null}
      </dialog>

      <footer className="site-footer private-footer">
        <div className="footer-main">
          <div className="footer-brand-column">
            <a className="brand brand-wordmark" href="#private-top" aria-label="Hjälpa, till sidans början">Hjälpa.</a>
            <p>Din personliga hjälpreda. Skicka vad du behöver få gjort så hjälper Hjälpa till med kontakten, offerterna och nästa steg.</p>
            <WhatsAppAction {...whatsAppActionProps} className="footer-demo-link">Börja på WhatsApp <ArrowUpRight size={17} weight="bold" /></WhatsAppAction>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h2>Produkt</h2>
              <a href="#sa-fungerar-det-privat">Så fungerar det</a>
              <a href="#vanliga-fragor-privat">Vanliga frågor</a>
              <button type="button" onClick={onSelectCompany}>Hjälpa för företag</button>
            </div>
            <div className="footer-column">
              <h2>Information</h2>
              <button type="button" onClick={() => openFooterInfo("privacy")}>Dataskydd och WhatsApp</button>
              <button type="button" onClick={() => openFooterInfo("payment")}>Kostnad och betalning</button>
              <button type="button" onClick={() => openFooterInfo("cookies")}>Cookie-information</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom"><p>© 2026 Hjälpa.</p><p>För privatpersoner i Sverige.</p></div>
      </footer>

      <div className="private-mobile-cta">
        <WhatsAppAction {...whatsAppActionProps} className="button button-primary"><WhatsappLogo size={20} weight="fill" />Börja gratis på WhatsApp<ArrowUpRight size={18} /></WhatsAppAction>
      </div>
    </div>
  );
}
