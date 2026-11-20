/** Shared public policy text. React and initial HTML render these same blocks. */
export type LegalPart =
  | { text: string; href?: string; break?: never }
  | { break: true; text?: never; href?: never };
export type LegalPage = {
  title: string;
  description: string;
  sections: { title: string; content: LegalPart[] }[];
};
export const legalPages: Record<string, LegalPage> = {
  "/terms": {
    title: "The terms, in plain sight.",
    description:
      "Effective 8 November 2026. These terms describe what a Qofeno advertising placement includes.",
    sections: [
      {
        title: "Who operates Qofeno",
        content: [
          {
            text: "Qofeno is operated by Mohd Zaheeruddin, an individual based in India, at loopproof.me. Contact ",
          },
          {
            text: "support@loopproof.me",
            href: "mailto:support@loopproof.me",
          },
          {
            text: ". When a purchase is processed through Dodo Payments, Dodo acts as merchant of record; the applicable checkout entity and payment terms are shown before payment.",
          },
        ],
      },
      {
        title: "What you are buying",
        content: [
          {
            text: "Each US$10 unit purchases advertising weight for a website placement for 30 days. You can buy 1–100 units in a purchase. An approved, active placement appears as a readable entry on the public paid board, with its submitted name, description, category, website link, active advertising amount, overall paid rank, scheduled expiry amounts, and recorded link-open count. Active placements also have a public detail page. Any applicable tax is shown at checkout. This is a one-time advertising purchase, with no subscription, renewal charge, cash balance, resale right, or ownership of the website.",
          },
        ],
      },
      {
        title: "How ranking and duration work",
        content: [
          {
            text: "The paid board ranks websites by current, paid, unrefunded advertising weight, highest first. Equal amounts are ordered by listing creation time, earliest first, then by internal listing ID if those timestamps also match. Category and display filters do not change the overall rank. Every approved active placement has a readable entry. Rank changes as purchases start, expire, or are refunded. No position, number of visitors, clicks, sales, or business result is guaranteed.",
          },
          {
            break: true,
          },
          {
            break: true,
          },
          {
            text: "A new placement’s 30 days start when it is approved after review. Additional purchases for an already approved placement begin their own 30-day periods when payment is confirmed. They do not extend the expiry of earlier purchases. As each period ends, that purchase’s weight is removed. A listing leaves the active paid board when it has no remaining active weight.",
          },
          {
            break: true,
          },
          {
            break: true,
          },
          {
            text: "Displayed prices to move up or take first place are estimates calculated from the current ranking and $10 purchase units. They reserve neither a price nor a position. Another purchase, an approval, a refund or an expiry may change the ranking before payment or review completes. No advertiser receives a cash prize, payout or resale right from ranking. Editorial discoveries are selected separately from paid placements; payment does not buy editorial selection.",
          },
        ],
      },
      {
        title: "Submission, review, and access",
        content: [
          {
            text: "You must be authorized to advertise the submitted website and have the rights to your submitted content. Your placement must comply with our ",
          },
          {
            text: "advertising policy",
            href: "/advertising-policy",
          },
          {
            text: ". Payment alone does not approve a new placement. We review new submissions before they appear publicly and may reject or suspend noncompliant content. Rejected paid placements receive a full refund of the affected purchase. Save the private recovery code shown before checkout; it restores access to your purchase status and placement. The code is not emailed. Contact support if you lose it, using your payment receipt ID rather than card details.",
          },
          { break: true },
          { break: true },
          {
            text: "Recovery access to an unpaid checkout expires after 24 hours, or earlier when its matching checkout is closed from this browser. Closing checkout does not cancel a payment already being processed or issue a refund. If a payment is confirmed later, the original saved recovery code works for that confirmed purchase. We keep the order record and code hash so delayed payments can be reconciled. Paid-purchase recovery does not expire under this unpaid-code rule.",
          },
        ],
      },
      {
        title: "Public metrics and third-party websites",
        content: [
          {
            text: "Link-open counts record requests to a placement’s outbound link, deduplicated by network address for each UTC day. They are not an audited count of people, customers, or conversions. Shared networks, automated requests, and technical limitations can affect them. Advertisers are responsible for their destination websites; a paid placement is not a Qofeno endorsement. Clearly labeled examples demonstrate ranking and do not represent paid customers or transactions. Editorial discoveries are separate from paid advertisements and do not imply a partnership with the featured website.",
          },
        ],
      },
      {
        title: "Problems and consumer rights",
        content: [
          {
            text: "Our ",
          },
          {
            text: "refund policy",
            href: "/refunds",
          },
          {
            text: " applies to purchases. If we cannot provide the described placement, contact support so we can correct the issue or arrange an appropriate refund. Nothing in these terms removes mandatory consumer rights. The terms displayed when you purchase govern that purchase; later changes apply to future purchases. A payment completing through an earlier checkout is reviewed under the earlier offer. If that offer can no longer be delivered, we will arrange a full refund through the payment provider rather than substitute different placement terms.",
          },
        ],
      },
    ],
  },
  "/privacy": {
    title: "Your information.",
    description:
      "Effective 12 November 2026. We use information to publish placements, verify payments, estimate website activity, prevent abuse, and provide support.",
    sections: [
      {
        title: "Who is responsible",
        content: [
          {
            text: "Mohd Zaheeruddin operates Qofeno from India. Privacy questions and requests can be sent to ",
          },
          {
            text: "support@loopproof.me",
            href: "mailto:support@loopproof.me",
          },
          {
            text: ".",
          },
        ],
      },
      {
        title: "Public placement information",
        content: [
          {
            text: "Approved, active listings publicly display the submitted name, description, website address, selected appearance, category, overall paid rank, active advertising amount, a schedule of active amounts ending at each expiry, and recorded link-open count. Submit only information you are authorized to make public. Payment card details, customer email addresses, recovery codes, and payment-provider identifiers are not part of the public listing.",
          },
        ],
      },
      {
        title: "Payments and purchase access",
        content: [
          {
            text: "Your checkout email is sent to Dodo Payments for payment processing and your receipt; Qofeno does not store it in its order database. Our database stores order and listing identifiers, quantities, product and payment-provider identifiers, payment and review status, and relevant timestamps. It stores a hash of the private recovery code, not the raw code. We do not receive or store your full card number. If you email support, we receive the information included in your message.",
          },
        ],
      },
      {
        title: "Essential cookies and technical information",
        content: [
          {
            text: "An essential HTTP-only cookie remembers your purchase access for up to one year. Unpaid access expires after 24 hours or when the matching checkout is closed; the cookie is cleared when that expiry is checked. A confirmed paid purchase remains recoverable with its saved code, including after a delayed payment. Clearing a cookie does not erase a copy of the code you saved yourself. We do not install advertising trackers or third-party analytics cookies on this site.",
          },
          {
            break: true,
          },
          {
            break: true,
          },
          {
            text: "Saved placements and editorial discoveries are stored as IDs in this browser’s local storage under “qofeno-saved-placements”. These bookmarks belong to this browser, not an account. They are not sent to our server, used for tracking, or shared between devices. If storage is unavailable, saves last only for the current tab.",
          },
          { break: true },
          { break: true },
          {
            text: "A temporary per-tab session-storage entry, “qofeno.checkout-return”, stores only a checkout reference, timestamp and handoff flag to recognize a return from payment. It never stores the recovery code or provider checkout URL. It is cleared after the return or cancellation flow and discarded when older than two days. The reference alone grants no purchase access. If browser storage is unavailable, return detection may be limited to the current page or the provider’s return URL.",
          },
          {
            break: true,
          },
          {
            break: true,
          },
          {
            text: "To count outbound link opens, we use a daily salted hash of the network IP address to deduplicate requests for each listing and UTC day. These deduplication records expire after 48 hours and are removed during subsequent outbound requests. Rate-limit records use hashed IP addresses in ten-minute windows, expire after ten minutes, and are removed during subsequent rate-limited requests. Hashing does not make these records equivalent to anonymous data. Hosting providers may also process IP addresses and request logs for service operation and security.",
          },
        ],
      },
      {
        title: "Public visitor estimates",
        content: [
          {
            text: "Our visitor panel publishes estimated activity on Qofeno: recent visible-page activity within two minutes, visitors today, and visitors this calendar month. Days and months use UTC. Collection begins on the date shown in the panel; we do not reconstruct earlier traffic. These estimates are not verified people, advertiser clicks, sales, or promised reach. Shared networks and browser types may be grouped; changes of network or browser may count separately. Known automated clients are excluded where detectable, but automated activity can still be counted.",
          },
          { break: true },
          { break: true },
          {
            text: "Visitor measurement does not set an analytics cookie or store a tracking identifier on your device. The server briefly processes the connecting network address and a broad browser/platform category to create secret-keyed pseudonymous identifiers, separated by purpose and UTC period. The visitor database stores those identifiers and expiry times, not the raw address, complete browser description, visited paths, referrers, location, or purchase details. It is separate from the payment database. Public responses contain totals and measurement dates only.",
          },
          { break: true },
          { break: true },
          {
            text: "Daily identifiers expire at the next UTC day and monthly identifiers at the next UTC month. Presence entries expire after two minutes. Expired entries are removed by bounded hourly cleanup, which can take additional runs if there is a backlog. Aggregate daily and monthly totals are retained for approximately 13 months. The pseudonymous identifiers are not equivalent to anonymous information while they are retained.",
          },
          { break: true },
          { break: true },
          {
            text: "We respect supported Do Not Track and Global Privacy Control signals for this measurement. You can also exclude future activity from this browser using the visitor panel’s counting preference; only that preference is saved locally. The panel remains readable when you opt out. Exclusion does not subtract activity already included in aggregate totals, and recent presence may remain visible until its two-minute window expires. Measurement pauses when a page is hidden or offline, and the owner and purchase-access pages do not send visitor heartbeats.",
          },
        ],
      },
      {
        title: "Providers and international processing",
        content: [
          {
            text: "Cloudflare hosts the website and order database. Dodo Payments processes checkout, receipts, tax, refunds, and payment risk under its own privacy terms. Our email providers process support correspondence. These providers may process information outside your country. We do not sell personal information or add buyers to a marketing list. Destination websites have their own privacy practices once you follow an advertised link.",
          },
        ],
      },
      {
        title: "Retention and requests",
        content: [
          {
            text: "We retain order and review records as needed to provide the service, resolve disputes, prevent abuse, and meet applicable legal and accounting obligations. Payment providers have their own retention requirements. You can request access, correction, or deletion by email. We may need to verify your purchase and retain records where legally required. Removing access records may prevent future purchase recovery; removing a live listing may affect its remaining display period.",
          },
        ],
      },
    ],
  },
  "/refunds": {
    title: "If something goes wrong.",
    description:
      "Effective 8 November 2026. This policy covers one-time Qofeno advertising purchases.",
    sections: [
      {
        title: "Contact the operator",
        content: [
          {
            text: "Email ",
          },
          {
            text: "support@loopproof.me",
            href: "mailto:support@loopproof.me",
          },
          {
            text: " with your payment receipt ID, placement name, and a description of the issue. Do not send full card numbers, passwords, or identity documents. We aim to reply within three business days.",
          },
        ],
      },
      {
        title: "Before a new placement starts",
        content: [
          {
            text: "If a paid submission is rejected before activation, the affected purchase is eligible for a full refund. You may also request cancellation and a refund before that purchase’s advertising period starts. A rejection notice is not confirmation that the payment provider has completed a refund; we process the refund separately and the provider supplies its confirmation.",
          },
        ],
      },
      {
        title: "After advertising begins",
        content: [
          {
            text: "Contact us promptly if the placement is missing during its active period, is materially different from the agreed description, or suffers a significant service failure. We will investigate and correct the issue or provide an appropriate refund where the purchased service cannot be delivered. Accidental duplicate purchases should be reported promptly for review. Mandatory consumer remedies remain available.",
          },
          {
            break: true,
          },
          {
            break: true,
          },
          {
            text: "Changes in ranking, other advertisers buying more advertising weight, low traffic, or a lack of clicks or sales are not service failures: those outcomes are not guaranteed. Change-of-mind refunds after the advertising period starts are not generally offered, except where applicable law requires otherwise.",
          },
        ],
      },
      {
        title: "How refunds affect the paid board",
        content: [
          {
            text: "Approved refunds are returned through the original payment provider to the original payment method, subject to its processing time and your bank. A full refund removes that purchase’s remaining advertising weight. A partial refund also suspends the affected purchase’s weight while support reviews the adjustment; it does not automatically leave a proportional amount of advertising active. Other valid purchases for the same listing retain their separate expiry dates. Payment disputes or policy violations can suspend display while the issue is reviewed. There is no subscription or automatic renewal to cancel.",
          },
        ],
      },
    ],
  },
  "/advertising-policy": {
    title: "A public page, with standards.",
    description:
      "Every new placement is reviewed before it appears. Buying space does not buy an exception to these rules.",
    sections: [
      {
        title: "Advertise a real, working destination",
        content: [
          {
            text: "Submit a functioning public website that accurately matches its name and description. You must be authorized to advertise it and hold the rights to your submitted material. Use a clear title and truthful description. Do not impersonate another business, imply a partnership with Qofeno, or suggest that placement is an endorsement.",
          },
        ],
      },
      {
        title: "Content we do not accept",
        content: [
          {
            text: "We do not accept fraud, phishing, malware, deceptive redirects, impersonation, illegal products or services, stolen content, harassment, hate or violent threats, explicit adult content, gambling or betting, get-rich-quick schemes, misleading financial promises, or attempts to evade the payment provider’s restrictions. We may decline other destinations that cannot be safely or lawfully advertised through this service.",
          },
        ],
      },
      {
        title: "Keep the destination consistent",
        content: [
          {
            text: "Do not change an approved destination into prohibited or materially different content during the paid period. We may recheck destinations and suspend a listing while investigating a report. Submitting repeated rejected listings or manipulating link-open counts can also result in refusal or suspension.",
          },
        ],
      },
      {
        title: "Review, rejection, and reports",
        content: [
          {
            text: "A new placement’s paid display period begins after approval, so review time does not consume that period. If a paid submission is rejected before activation, we arrange a full refund of the affected purchase. To report a problematic listing, email ",
          },
          {
            text: "support@loopproof.me",
            href: "mailto:support@loopproof.me",
          },
          {
            text: " with the listing name or link and the reason. We may request enough information to verify the issue. See our",
          },
          {
            text: " ",
          },
          {
            text: "refund policy",
            href: "/refunds",
          },
          {
            text: " for purchase problems.",
          },
        ],
      },
    ],
  },
  "/contact": {
    title: "Reach the person behind it.",
    description:
      "For purchase help, placement questions, privacy requests, or a listing that needs a closer look.",
    sections: [
      {
        title: "Email",
        content: [
          {
            text: "support@loopproof.me",
            href: "mailto:support@loopproof.me",
          },
          {
            break: true,
          },
          {
            text: "We aim to respond within three business days. For purchase support, include your receipt ID and listing name. For a content report, include the public listing link and explain the concern. Never send card details, passwords, or identity documents by email.",
          },
        ],
      },
      {
        title: "Operator",
        content: [
          {
            text: "Qofeno is operated by Mohd Zaheeruddin, an individual based in India, serving advertisers internationally. Website: loopproof.me. Qofeno is the customer-facing brand.",
          },
        ],
      },
      {
        title: "Useful details",
        content: [
          {
            text: "Terms of purchase",
            href: "/terms",
          },
          {
            text: " ·",
          },
          {
            text: " ",
          },
          {
            text: "Refund policy",
            href: "/refunds",
          },
          {
            text: " ·",
          },
          {
            text: " ",
          },
          {
            text: "Advertising standards",
            href: "/advertising-policy",
          },
          {
            text: " ·",
          },
          {
            text: " ",
          },
          {
            text: "Privacy policy",
            href: "/privacy",
          },
        ],
      },
    ],
  },
};
