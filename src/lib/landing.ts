import type { QRConfig } from "./config";
import type { ContentFields, ContentType } from "./content";

export interface Faq {
  q: string;
  a: string;
}

/** Initial state for a generator page when the URL carries no parameters. */
export interface PageDefaults {
  contentType: ContentType;
  fields: Partial<ContentFields>;
  style: Partial<QRConfig>;
}

export interface LandingPage {
  slug: string;
  /** <title> (the site name is appended). */
  title: string;
  description: string;
  h1: string;
  intro: string;
  /** Short name for navigation / breadcrumbs. */
  nav: string;
  /** Heading of the how-to section. */
  howTo: string;
  keywords: string[];
  defaults: PageDefaults;
  steps: string[];
  faq: Faq[];
}

export const HOME_FAQ: Faq[] = [
  {
    q: "Is AnimQR really free?",
    a: "Yes. AnimQR is free and open source under the MIT licence. There is no sign-up, no watermark, no scan limit and no expiry — the codes you create are yours.",
  },
  {
    q: "Do animated QR codes still scan?",
    a: "Yes. The three corner eyes and the alignment patterns never move, and the scan-safe animations (pulse, wave, shimmer, rotate, colour cycle and scan line) keep every module visible on every frame. The built-in checker decodes several frames as you edit, but always test with a real phone before printing.",
  },
  {
    q: "Which formats can I download?",
    a: "PNG, JPEG and SVG for static codes; animated GIF, MP4 and WebM for animations. Video is recorded in your browser, so MP4 depends on browser support (WebM is used otherwise).",
  },
  {
    q: "Are my QR codes dynamic or do they expire?",
    a: "They are static QR codes: the content is stored in the code itself, so they work forever and don't depend on any server. To change the destination later, point the code at a link you control.",
  },
  {
    q: "Is my data uploaded anywhere?",
    a: "No. Everything — generation, styling, animation and export — happens locally in your browser. Nothing you type or upload leaves your device.",
  },
  {
    q: "Can I create a QR code from a link?",
    a: "Yes. Add ?data=… to the address (for example /?data=https%3A%2F%2Fexample.com&anim=pulse) and the code is generated instantly. Every style and animation option can be set in the URL — see the URL API page.",
  },
];

const HOW_TO_STYLE = [
  "Pick colours, a gradient, module shape and corner style — or start from a preset.",
  "Choose an animation and tune its duration and frame rate.",
  "Check the scannability badge, then download as GIF, MP4, PNG or SVG.",
];

export const LANDING_PAGES: LandingPage[] = [
  {
    slug: "animated-qr-code-generator",
    howTo: "How to make an animated QR code",
    nav: "Animated QR codes",
    title: "Animated QR Code Generator — Free GIF & MP4 QR Codes",
    description:
      "Make an animated QR code in seconds: pulse, wave, scan-line, colour-cycle and particle effects. Download as GIF, MP4 or WebM. Free, no sign-up, no watermark.",
    h1: "Animated QR code generator",
    intro:
      "Turn any link into an eye-catching animated QR code. Choose from eight motion presets that are designed to stay scannable, then export a looping GIF for email and web or an MP4/WebM video for social media and screens.",
    keywords: ["animated qr code", "animated qr code generator", "qr code animation", "moving qr code"],
    defaults: {
      contentType: "url",
      fields: {},
      style: {
        gradient: { type: "linear", angle: 45, stops: ["#6d28d9", "#db2777"] },
        module: "dots",
        eye: "rounded",
        anim: "pulse",
        format: "gif",
      },
    },
    steps: ["Enter the URL or text your code should open.", ...HOW_TO_STYLE],
    faq: [
      {
        q: "Where can I use an animated QR code?",
        a: "Websites, email signatures, presentations, digital signage, social posts and video. For print, download a PNG or SVG of the same design.",
      },
      {
        q: "Which animation is the most reliable?",
        a: "Pulse, wave, shimmer, rotate, colour cycle and scan line keep the full code visible on every frame. Reveal and particles assemble the code and are scannable during their hold phase.",
      },
    ],
  },
  {
    slug: "qr-code-gif-generator",
    howTo: "How to make a QR code GIF",
    nav: "QR code GIF",
    title: "QR Code GIF Generator — Create Looping Animated QR GIFs",
    description:
      "Create a QR code GIF online for free. Customise colours, dots and logos, pick an animation, set FPS and loop count, and download a high-quality animated GIF.",
    h1: "QR code GIF maker",
    intro:
      "Animated GIFs play everywhere — in emails, chats and web pages — without a video player. Design your code, pick an effect, and export a looping GIF with full control over size, frame rate and loop count.",
    keywords: ["qr code gif", "gif qr code generator", "animated gif qr code"],
    defaults: {
      contentType: "url",
      fields: {},
      style: { fg: "#0f172a", module: "rounded", eye: "circle", anim: "wave", fps: 20, format: "gif" },
    },
    steps: ["Enter the link or text to encode.", ...HOW_TO_STYLE],
    faq: [
      {
        q: "How big will my GIF be?",
        a: "It depends on size, duration and frame rate. 512px at 15 fps for 2 seconds is typically well under 1 MB. Lower the FPS or size for smaller files.",
      },
      {
        q: "Can the GIF have a transparent background?",
        a: "Yes — set the background to “None”. GIF transparency is one-bit, so edges are best on a matching background colour.",
      },
    ],
  },
  {
    slug: "qr-code-with-logo",
    howTo: "How to add a logo to a QR code",
    nav: "QR code with logo",
    title: "QR Code with Logo — Free Custom QR Code Generator",
    description:
      "Add your logo to a QR code for free. Upload an image, and AnimQR clears a safe area and picks the right error correction so the code still scans. Export PNG, SVG or GIF.",
    h1: "Create a QR code with your logo",
    intro:
      "Brand your QR codes with a logo in the centre. AnimQR clears the modules behind the logo, limits the logo size to what the error-correction level can recover, and checks that the result still decodes.",
    keywords: ["qr code with logo", "custom qr code with logo", "logo qr code generator"],
    defaults: {
      contentType: "url",
      fields: {},
      style: { ec: "H", module: "rounded", eye: "rounded", fg: "#1e3a8a", eyeColor: "#2563eb" },
    },
    steps: [
      "Enter your URL.",
      "Open the Style tab and upload your logo (or paste an image URL).",
      "Adjust the logo size — error correction H allows the largest logo.",
      "Download a PNG or SVG for print, or a GIF with an animation.",
    ],
    faq: [
      {
        q: "How large can the logo be?",
        a: "Up to 30% of the code width at error correction H, 24% at Q, 18% at M and 12% at L. AnimQR enforces these limits automatically.",
      },
      {
        q: "Which logo format works best?",
        a: "A square PNG or SVG with a transparent or solid background. Uploaded logos are downscaled and stay on your device.",
      },
    ],
  },
  {
    slug: "wifi-qr-code-generator",
    howTo: "How to make a Wi-Fi QR code",
    nav: "Wi-Fi QR code",
    title: "Wi-Fi QR Code Generator — Share Your Wi-Fi Password Free",
    description:
      "Create a Wi-Fi QR code so guests can join your network by scanning — no typing passwords. Supports WPA/WPA2/WPA3, WEP, open and hidden networks. Free and private.",
    h1: "Wi-Fi QR code generator",
    intro:
      "Let guests connect by pointing their camera at a code. Enter your network name and password, style the code to match your space, and print it or show it on a screen. Your password never leaves your browser.",
    keywords: ["wifi qr code", "wifi qr code generator", "qr code for wifi password", "share wifi qr"],
    defaults: {
      contentType: "wifi",
      fields: { wifi: { ssid: "Guest Wi-Fi", password: "welcome123", security: "WPA", hidden: false } },
      style: { frame: "label", frameText: "SCAN TO JOIN WI-FI", frameColor: "#0f766e", fg: "#134e4a", module: "rounded", eye: "rounded" },
    },
    steps: [
      "Enter your network name (SSID), security type and password.",
      "Style the code and add a “Scan to join” label.",
      "Download a PNG or SVG and print it, or display it on a screen.",
    ],
    faq: [
      {
        q: "Do Wi-Fi QR codes work on iPhone and Android?",
        a: "Yes. The built-in camera apps on iOS 11+ and Android 10+ recognise the standard WIFI: format and offer to join the network.",
      },
      {
        q: "Is it safe to put my password in a QR code?",
        a: "The code is generated locally and never uploaded. Anyone who can scan the printed code can read the password, so use a guest network for public places.",
      },
    ],
  },
  {
    slug: "vcard-qr-code-generator",
    howTo: "How to make a vCard QR code",
    nav: "vCard QR code",
    title: "vCard QR Code Generator — Digital Business Card QR Code",
    description:
      "Create a vCard QR code for your business card. People scan it to save your name, phone, email, company and website to their contacts. Free, private, no sign-up.",
    h1: "vCard QR code generator",
    intro:
      "Put your contact details on a QR code so people can save you to their phone in one tap. Great for business cards, name badges, email signatures and slides.",
    keywords: ["vcard qr code", "business card qr code", "contact qr code", "digital business card"],
    defaults: {
      contentType: "vcard",
      fields: {
        vcard: {
          firstName: "Ada",
          lastName: "Lovelace",
          org: "Analytical Engines Ltd",
          title: "Engineer",
          phone: "+44 20 7946 0000",
          email: "ada@example.com",
          url: "https://example.com",
          address: "",
        },
      },
      style: { ec: "M", fg: "#1f2937", module: "square", eye: "leaf", eyeColor: "#7c3aed" },
    },
    steps: [
      "Fill in your name, company, phone, email and website.",
      "Style the code to match your brand.",
      "Download an SVG for print or a PNG for digital use.",
    ],
    faq: [
      {
        q: "Why is my vCard QR code so dense?",
        a: "Every field adds data. Leave out fields you don't need, or use a lower error-correction level, for a simpler code that scans from further away.",
      },
    ],
  },
  {
    slug: "url-qr-code-generator",
    howTo: "How to turn a link into a QR code",
    nav: "URL QR code",
    title: "URL QR Code Generator — Turn Any Link into a QR Code",
    description:
      "Convert any website link into a custom QR code for free. Style it with colours, shapes and logos, add animation, and download PNG, SVG, GIF or MP4.",
    h1: "Turn a link into a QR code",
    intro:
      "Paste a URL and get a QR code instantly. Codes are static, so they never expire and work without any redirect service — and you can style and animate them however you like.",
    keywords: ["url qr code", "link to qr code", "website qr code", "qr code for url"],
    defaults: { contentType: "url", fields: {}, style: {} },
    steps: ["Paste your link.", ...HOW_TO_STYLE],
    faq: [
      {
        q: "Will my QR code stop working?",
        a: "No. The link is stored directly in the code, so it works as long as the website does. There is no tracking redirect in between.",
      },
    ],
  },
];

export function getLandingPage(slug: string) {
  return LANDING_PAGES.find((p) => p.slug === slug);
}
