/** News & blog articles. Static for now: add an entry here and it appears on the home page, /news/ and the sitemap. */
export type Article = {
  slug: string;
  title: string;
  category: "News" | "Guide" | "Market" | "NRI";
  /** ISO date */
  date: string;
  read: string;
  excerpt: string;
  image: { id: string; alt: string };
  body: { h?: string; p: string[] }[];
};

export const ARTICLES: Article[] = [
  {
    slug: "buying-resale-flat-bengaluru-checklist",
    title: "Buying a resale flat in Bengaluru: the paperwork checklist",
    category: "Guide",
    date: "2026-10-08",
    read: "6 min read",
    excerpt: "Title, khata, approvals and encumbrance: the documents to see before you pay a token amount.",
    image: { id: "1486406146926-c627a92ad1ab", alt: "A residential tower seen from street level" },
    body: [
      { p: ["A resale home can be a smart buy, but only if the paperwork is clean. Ask for the documents below before you pay any token amount, and have a lawyer read them."] },
      { h: "Ownership and title", p: ["Ask for the sale deed and the chain of earlier deeds that led to it. The seller's name must match the owner on record. If the property was inherited, ask for the relevant legal heir documents."] },
      { h: "Khata and tax", p: ["Check whether the property has an A khata or a B khata, because this affects bank loans and future resale. Ask for the latest property tax receipt and an up-to-date khata extract."] },
      { h: "Encumbrance and approvals", p: ["An encumbrance certificate shows whether the property is mortgaged or under dispute. Also confirm the building plan approval, the occupancy certificate and, for apartments, the society's no-dues letter."] },
      { h: "Before you sign", p: ["Visit the property at different times of day, speak to neighbours, and agree the payment schedule in writing. An advisor can run these checks with you."] },
    ],
  },
  {
    slug: "how-to-choose-a-locality-in-bengaluru",
    title: "How to choose a locality in Bengaluru: commute first, price second",
    category: "Guide",
    date: "2026-09-29",
    read: "5 min read",
    excerpt: "Traffic, metro access and the school run decide daily life more than the price per square foot.",
    image: { id: "1582407947304-fd86f028f716", alt: "Glass office towers rising against a blue sky" },
    body: [
      { p: ["Bengaluru's neighbourhoods can sit only a few kilometres apart and still feel very different to live in. Start with how you will travel, then look at price."] },
      { h: "Test the commute", p: ["Drive or ride the route at the hours you will actually travel. A short distance on the map can be a long trip at peak time. Note where the nearest metro station is and how you would get to it."] },
      { h: "Look at daily needs", p: ["Schools, hospitals, groceries and green space within a short distance save more time than a slightly lower price. List what matters to your household and check each one on foot."] },
      { h: "Think about your horizon", p: ["If you plan to stay a decade, an established area may suit you. If you are buying to rent out, look at demand from nearby offices and colleges. Our locality guides set these trade-offs out area by area."] },
    ],
  },
  {
    slug: "nri-buying-property-in-india-first-steps",
    title: "NRIs buying property in India: first steps",
    category: "NRI",
    date: "2026-09-18",
    read: "5 min read",
    excerpt: "What you need to arrange from abroad: documents, power of attorney, banking and a trusted advisor.",
    image: { id: "1480714378408-67cf0d13bc1b", alt: "A city skyline at dusk" },
    body: [
      { p: ["Buying from abroad is routine today, and most steps can be done remotely. This is a general overview, not tax or legal advice; speak to a qualified professional for your situation."] },
      { h: "Documents and banking", p: ["Keep your passport, visa or OCI details and PAN ready. Funds normally move through an NRE or NRO account, and your bank can explain which applies to your purchase."] },
      { h: "Power of attorney", p: ["Many buyers appoint a trusted person in India to sign on their behalf. The document must be drawn up carefully and attested correctly, so use a lawyer."] },
      { h: "See it without flying in", p: ["A live video walkthrough, a verified document pack and a clear payment schedule let you decide with confidence. We offer all three to buyers abroad."] },
    ],
  },
  {
    slug: "home-loan-emi-what-to-check-before-you-borrow",
    title: "Home loan EMIs: what to check before you borrow",
    category: "Market",
    date: "2026-09-05",
    read: "4 min read",
    excerpt: "Rate type, tenure, processing fees and prepayment rules change what a loan really costs.",
    image: { id: "1494526585095-c41746248156", alt: "A modern house with a garden" },
    body: [
      { p: ["Two loans with the same headline rate can cost very different amounts. Compare the details, not just the number in the advert."] },
      { h: "Rate and tenure", p: ["Check whether the rate is floating and what it is linked to. A longer tenure lowers the monthly EMI but increases the total interest you pay."] },
      { h: "Fees and prepayment", p: ["Ask about processing fees, legal and valuation charges, and whether you can prepay without a penalty. Use our EMI calculator on a property page to see how the numbers move."] },
      { h: "Keep a buffer", p: ["Choose an EMI you can still pay comfortably if your expenses rise. Lenders will tell you what you can borrow; only you know what you can sustain."] },
    ],
  },
  {
    slug: "rent-or-buy-in-bengaluru",
    title: "Rent or buy in Bengaluru? How to decide",
    category: "Market",
    date: "2026-08-24",
    read: "5 min read",
    excerpt: "Compare the monthly cost, the deposit and how long you plan to stay before you commit either way.",
    image: { id: "1493809842364-78817add7ffb", alt: "Living room with a blue sofa and large windows" },
    body: [
      { p: ["Neither renting nor buying is right for everyone. The better choice depends on your plans, your savings and how settled your work is."] },
      { h: "Compare the monthly cost", p: ["Add up the EMI, maintenance, property tax and insurance on the buying side. On the renting side, count the rent and what you could earn by investing your down payment instead."] },
      { h: "Think about time", p: ["Buying costs money up front in registration and stamp duty, so it usually pays off over several years. If you may move cities soon, renting keeps you flexible."] },
      { h: "Check your buffer", p: ["Buying should not leave you without savings. Keep an emergency fund aside before you pay a down payment."] },
    ],
  },
  {
    slug: "under-construction-vs-ready-to-move",
    title: "Under construction or ready to move: which is right for you?",
    category: "Guide",
    date: "2026-07-30",
    read: "5 min read",
    excerpt: "Pre-launch prices, payment plans and delivery risk against the certainty of a home you can see.",
    image: { id: "1545324418-cc1a3fa10c00", alt: "Modern residential tower with dark balconies against a clear sky" },
    body: [
      { p: ["Each option trades certainty against price. Knowing what you give up helps you choose well."] },
      { h: "Under construction", p: ["Prices and payment plans can be easier at the start, and you may pick your floor and unit. The risk is delay, so check the builder's record and the RERA registration."] },
      { h: "Ready to move", p: ["You see exactly what you are buying and can move in soon. You usually pay more up front, but there is no waiting and no rent while you wait."] },
      { h: "Our advice", p: ["Whichever you pick, verify approvals and read the agreement with a lawyer. We can compare options with you by budget and timeline."] },
    ],
  },
  {
    slug: "rera-what-every-buyer-should-check",
    title: "RERA: what every buyer should check",
    category: "News",
    date: "2026-07-18",
    read: "4 min read",
    excerpt: "The registration number, the promised delivery date and the project's filings are all public. Look them up.",
    image: { id: "1460317442991-0ec209397118", alt: "Apartment building with rows of balconies and warm-toned facades" },
    body: [
      { p: ["RERA gives buyers of new projects a public record to check. It takes only a few minutes to use it, and it is worth doing before any payment."] },
      { h: "Find the registration", p: ["Every registered project has a RERA number. Look it up on the state authority's website and confirm the name of the project and the promoter match."] },
      { h: "Read the details", p: ["Check the promised possession date, the approved plan and any complaints or updates filed. If the details do not match what you were told, ask why."] },
      { h: "Keep records", p: ["Save the agreement, payment receipts and correspondence. They matter if something goes wrong later."] },
    ],
  },
  {
    slug: "investing-in-rental-property",
    title: "Buying to let: how to think about rental yield",
    category: "Market",
    date: "2026-07-02",
    read: "5 min read",
    excerpt: "Rent against price is only the start. Vacancy, upkeep and tax change what you actually take home.",
    image: { id: "1449157291145-7efd050a4d0e", alt: "Office towers photographed from below" },
    body: [
      { p: ["Rental yield compares a year's rent with the price you paid. It is a useful first filter, but it is not the whole picture."] },
      { h: "Count the costs", p: ["Subtract maintenance, property tax, repairs and the months a home may stand empty. Add the loan interest if you borrowed."] },
      { h: "Look at demand", p: ["Homes near offices, colleges and metro stations tend to find tenants faster. Our locality guides show yield and metro access area by area."] },
      { h: "Be realistic", p: ["Price growth is never guaranteed. Buy a home you would be comfortable holding even if rent rises slowly."] },
    ],
  },
  {
    slug: "moving-checklist-new-home",
    title: "Moving in: a first-week checklist for your new home",
    category: "Guide",
    date: "2026-06-20",
    read: "3 min read",
    excerpt: "Utilities, locks, society formalities and a walk-through: do these in the first seven days.",
    image: { id: "1497215728101-856f4ea42174", alt: "Office desk by a window with plants" },
    body: [
      { p: ["The first week sets the tone for your new home. A short list keeps the paperwork and practical jobs from piling up."] },
      { h: "Utilities and security", p: ["Transfer the electricity, water and internet connections into your name, and change the locks. Keep copies of every receipt."] },
      { h: "Society formalities", p: ["Register with the society office, collect the access cards and note the rules for deliveries, parking and move-in timings."] },
      { h: "Do a walk-through", p: ["Check every room against your sale agreement and photograph any issue so you can raise it with the builder or seller."] },
    ],
  },
  {
    slug: "green-and-quiet-living-bengaluru",
    title: "Green and quiet: finding calmer corners of Bengaluru",
    category: "Market",
    date: "2026-06-08",
    read: "4 min read",
    excerpt: "More space and open air usually mean a longer commute. Here is how to weigh that trade.",
    image: { id: "1470071459604-3b5ec3a7fe05", alt: "Mist rising over green, forested hills at dawn" },
    body: [
      { p: ["Many buyers want more space, trees and quiet. The edges of the city often offer that, but there is a price in travel time."] },
      { h: "Check the connection", p: ["Look at the roads, any planned metro line and the distance to schools and hospitals. A calm area is only convenient if you can reach what you need."] },
      { h: "Visit more than once", p: ["Go on a weekday morning and a weekend evening. Quiet streets can feel very different at other times."] },
      { h: "Plan for growth", p: ["Areas on the edge change fast. Ask what is planned nearby so there are no surprises in a few years."] },
    ],
  },
  {
    slug: "home-office-spaces-what-buyers-want",
    title: "Working from home: what to look for in a flat",
    category: "News",
    date: "2026-05-27",
    read: "3 min read",
    excerpt: "A spare corner, steady internet and a quiet room now rank high on many buyers' lists.",
    image: { id: "1497366216548-37526070297c", alt: "Open-plan office with plants and natural light" },
    body: [
      { p: ["More people now work from home at least some days, and they look at homes differently because of it."] },
      { h: "Space and quiet", p: ["A spare room is ideal, but a quiet corner with a door or partition can do. Check noise from the road and from neighbours."] },
      { h: "Connectivity", p: ["Ask which broadband providers serve the building and what speeds residents get. Check mobile signal inside the flat as well."] },
      { h: "Amenities nearby", p: ["Coworking spaces, cafes and a gym close by make remote work easier on days you want to step out."] },
    ],
  },
  {
    slug: "stamp-duty-and-registration-costs-explained",
    title: "Stamp duty and registration: the costs beyond the price",
    category: "News",
    date: "2026-05-14",
    read: "4 min read",
    excerpt: "Budget for stamp duty, registration, legal fees and moving costs on top of the sale price.",
    image: { id: "1487958449943-2429e8be8625", alt: "Abstract white architecture with repeating geometric forms" },
    body: [
      { p: ["The price in the advert is rarely the full cost of buying. Work out the extra costs early so they do not catch you out. Rates change, so confirm current figures with the registration office or your lawyer."] },
      { h: "Stamp duty and registration", p: ["These are paid to the government when the sale deed is registered, and the rate depends on the property and the state's rules."] },
      { h: "Other costs", p: ["Add legal fees, loan processing charges, society transfer fees, and interior or moving costs. Keep a margin for the unexpected."] },
      { h: "Ask for a full estimate", p: ["An advisor can list every cost for a specific property so you know your total before you commit."] },
    ],
  },
];

export const getArticle = (slug: string) => ARTICLES.find((a) => a.slug === slug);

export const articleDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
