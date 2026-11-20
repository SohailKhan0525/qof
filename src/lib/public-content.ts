/** Public facts shared by the page and its initial HTML/search metadata. */
export const faqEntries = [
  [
    "What exactly does $10 buy?",
    "One $10 unit of advertising weight for 30 days. Your approved website gets a readable entry on the paid board, an outbound link and a public detail page. The first 30-day period starts when your paid listing is approved. This is a one-time purchase, with no automatic renewal.",
  ],
  [
    "How does the ranking work?",
    "More active paid spend means a higher position on the paid board. Equal amounts are ordered by when the listing was created, with the earlier listing first; an internal ID breaks an exact timestamp tie. Categories and filters help visitors browse, but the displayed rank is the overall paid rank. Every approved active website has a readable entry.",
  ],
  [
    "Does a displayed price reserve my rank?",
    "No. The price to move up is calculated from the current paid board in $10 units. Other purchases, approvals, refunds and expiries can change it before your placement goes live. You buy a 30-day advertising amount, not a guaranteed position, number of visits, clicks or sales.",
  ],
  [
    "What happens when I add more?",
    "Each additional purchase adds its own 30-day amount. It does not restart the clock on older purchases. For example, $10 on Monday and $20 on Friday overlap at $30 until Monday’s amount expires. Your rank can change as each amount expires.",
  ],
  [
    "Are the editorial discoveries paid placements?",
    "No. Editorial discoveries are selected separately to give visitors interesting websites to explore. They are labeled and kept outside the paid ranking. Buying a placement does not buy editorial selection or an endorsement.",
  ],
  [
    "Can I advertise anything?",
    "Every new listing is reviewed. We exclude illegal, deceptive, abusive, unsafe, and restricted content. You must be authorized to advertise the website. Rejected paid placements are eligible for a full refund; see the advertising and refund policies.",
  ],
  [
    "How are link opens counted?",
    "We record redirects from a live placement to its website, limiting repeat counts from the same hashed IP per listing per UTC day. Automated activity may still count; people sharing a network may be grouped. These are not guaranteed human visits or conversions.",
  ],
  [
    "How do I manage my spot?",
    "Save your private recovery code before checkout. Your purchase status, review result, active amount, and expiry details are available under My spot. Use the code to restore access on another device. The code is not emailed; your payment receipt is handled by the payment provider. Unpaid checkout access expires after 24 hours or when its matching checkout is closed; paid purchases remain recoverable.",
  ],
] as const;

export const publicRoutes = [
  "/",
  "/terms",
  "/privacy",
  "/refunds",
  "/contact",
  "/advertising-policy",
] as const;
export const pageMetadata: Record<
  string,
  { title: string; description: string }
> = {
  "/": {
    title: "Qofeno — 30-day website advertising from $10",
    description:
      "Discover independent websites through editorial picks and a readable paid ranking. One-time advertising starts at $10 for 30 days, reviewed before publication.",
  },
  "/terms": {
    title: "Terms of purchase — Qofeno",
    description:
      "Read how Qofeno’s one-time website advertising placements, active-spend ranking, 30-day periods, review process and purchase access work.",
  },
  "/privacy": {
    title: "Privacy policy — Qofeno",
    description:
      "How Qofeno handles public listings, purchase access, essential cookies, saved sites, visitor estimates, link-open counts and privacy requests.",
  },
  "/refunds": {
    title: "Refund policy — Qofeno",
    description:
      "Refunds for rejected or cancelled placements, advertising service problems and duplicate purchases. Contact support@loopproof.me with your receipt ID.",
  },
  "/contact": {
    title: "Contact Qofeno — Support and seller details",
    description:
      "Contact support@loopproof.me for placement questions, purchase help or privacy requests. Qofeno is operated by Mohd Zaheeruddin, an individual based in India.",
  },
  "/advertising-policy": {
    title: "Advertising standards — Qofeno",
    description:
      "Requirements for Qofeno advertising placements: working public websites, truthful descriptions, authorized submissions and a review before publication.",
  },
  "/my-spot": {
    title: "My spot — Qofeno",
    description:
      "Use your private recovery code to check your purchase status and manage your Qofeno placement.",
  },
  "/owner": {
    title: "Owner review — Qofeno",
    description: "The private Qofeno placement review desk.",
  },
};
export const missingPageMetadata = {
  title: "Page not found — Qofeno",
  description:
    "That page does not exist. Explore the Qofeno paid board and editorial discoveries or contact support@loopproof.me.",
};
