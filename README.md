# FNSQ Concept 1 — "Established"

**Premium Australian mortgage broker.** Editorial-classic, photography-led, calculator-supported.
Visual benchmark: Aussie / Mortgage Choice / Loan Market, taken upmarket.

## Run it

```bash
node serve.js
```

Then open **http://localhost:8811/**

No dependencies, no build step, no `npm install`. Node 14+ is enough.
Change the port with `node serve.js 9000` or `PORT=9000 node serve.js`.

Any other static server works too — e.g. `npx serve .` or `python -m http.server 8811`.

## Pages

| File | What it is |
|---|---|
| `index.html` | Homepage — full-bleed hero, floating borrowing estimator, six situation cards, why-a-broker split, lender panel, 3-tab calculator, 4-step process, broker profile, testimonial slider, FAQ, CTA band |
| `home-loans.html` | Six lending situations in depth (first home, refinance, investment, self-employed, construction, business & asset) with an anchor jump-nav |
| `calculators.html` | Four working calculators: repayments, borrowing power, Victorian stamp duty, extra repayments |
| `about.html` | Priya Dey profile, "four things you can hold us to", and an explicit "what we are not" section |
| `contact.html` | Booking form with real client-side validation, plus a no-credit-enquiry / no-cost / no-obligation reassurance row |

## Folder structure

```
fnsq-concept-1/
├── index.html
├── home-loans.html
├── calculators.html
├── about.html
├── contact.html
├── css/
│   └── styles.css        # one stylesheet, sectioned 01–20, tokens at the top
├── js/
│   └── site.js           # one script, 8 guarded modules
├── assets/
│   ├── brand/            # FNSQ logo (dark + white), MFAA and AFCA marks
│   ├── img/              # photography at 4K / 1600 / 800 (srcset)
│   └── lenders/          # 16 lender logos
├── serve.js              # zero-dependency static server, port 8811
└── README.md
```

## What is real

- **Calculators genuinely compute.** Repayments use the standard amortisation formula; extra repayments run a month-by-month amortisation loop; Victorian land transfer duty uses the SRO general/PPR/first-home rate structure.
- **Form validation is real** — required fields, email shape, and an Australian mobile pattern (`04xxxxxxxx`), with inline errors and focus management.
- **Testimonial slider** — autoplay, pause on hover/focus, dots, keyboard buttons, touch swipe, `prefers-reduced-motion` respected.
- **Responsive** at 375 / 768 / 1024 / 1440+, with a mobile drawer and a sticky call/book bar that hides while typing.
- **Accessibility** — skip link, focus-visible rings, `aria-expanded` / `aria-selected` / `role="tablist"` / `role="radiogroup"`, alt text, and reduced-motion handling.

## What is placeholder

- **Photography** is 4K stock standing in for a Melbourne shoot and a real portrait of Priya Dey.
- **Testimonials** are clearly labelled placeholders. Do not publish these — they must be genuine, consented reviews.
- **Phone / email** are the practice's known numbers, flagged `verify`.
- **Borrowing power assumptions** (assessment rate, buffer, household expense benchmark) are placeholders. The licensee must set and publish these before launch — see the note printed inside the calculator.
- **Forms transmit nothing.** Submitted values are logged to the browser console. Production would POST a JSON body to the GoHighLevel inbound webhook — never a query string.

## Compliance rules baked in

- No advertised interest rate anywhere; the user supplies the rate.
- No digits-plus-per-cent in copy.
- No "best", "experts", "specialists", superlatives or guarantees.
- Every "free" is followed within a line by *"our service to you is free, but other fees and lender charges may apply"*.
- Full credit representative statement in the hero, the broker section and the footer.
- Best interests duty phrased as *"we must by law put your interests first"*.
- General-information and not-credit-assistance disclaimers on every page.
- `verify` chips mark every fact that must be confirmed before launch.

## Editing it later

- **Re-skin:** change the tokens in `css/styles.css` section 01. Everything else derives from them.
- **New page:** copy `about.html`, swap the `<main>`, keep the header/footer blocks.
- **New calculator:** add a `<button class="calc-tab">` + `<div class="calc-panel">` pair and a compute function in the `calculators()` module in `js/site.js`. Every element lookup is guarded, so partial pages still run.
- The header and footer are duplicated per page by design — this is a static prototype. In WordPress they become the theme header/footer; in a static build, an include.
