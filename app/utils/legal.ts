// Terms of use and privacy policy, in plain words. DRAFTS: both must be reviewed by a Nigerian lawyer
// before launch (PLAN.md Phase 8). The pages say so at the top.

export interface LegalDoc {
  title: string
  outline: string
  intro: string
  sections: { id: string, heading: string, body: string[] }[]
}

export const legalDocs: Record<'terms' | 'privacy', LegalDoc> = {
  terms: {
    title: 'Terms of',
    outline: 'use',
    intro: 'The rules for using Dogeash as a buyer, a store or a care provider. Short version: be honest, keep dogs safe, and pay through Dogeash.',
    sections: [
      { id: 'who', heading: 'Who we are', body: ['Dogeash is a marketplace that connects buyers with independent kennels (stores) and care providers in Nigeria. Stores sell their own dogs; Dogeash inspects kennels and runs the marketplace, but is not the seller.'] },
      { id: 'accounts', heading: 'Your account', body: ['You must be 18 or older and give accurate details. Keep your password and one-time codes to yourself; you are responsible for what happens on your account.', 'One account can buy, run a store and book. Store and provider accounts must pass verification before anything they list goes public.'] },
      { id: 'buying', heading: 'Buying a dog', body: ['Listings describe each dog\'s protection level, health and training as confirmed at the last inspection. Visit the kennel before you buy.', 'A deposit reserves a dog for a set time while you visit. How long it holds, and when it is refunded, will be shown before you pay.'] },
      { id: 'stores', heading: 'Stores on Dogeash', body: ['Stores must describe dogs truthfully, keep health and training records up to date, and mark dogs reserved or sold promptly.', 'Level 4 and 5 dogs are sold only with handover training at the buyer\'s home.'] },
      { id: 'payments', heading: 'Payments and fees', body: ['Deposits and payments go through Dogeash\'s payment partner and are held until handover is confirmed. Fees for stores will be published before launch.'] },
      { id: 'safety', heading: 'Safety and responsibility', body: ['Guard dogs are powerful animals. Owners are responsible for how their dog is kept, trained and handled after handover, including keeping it secure and warning visitors.'] },
      { id: 'disputes', heading: 'Problems and disputes', body: ['If a dog is not as described, tell us before the deposit is released. We will look at the listing, the inspection record and both sides before deciding.'] },
      { id: 'changes', heading: 'Changes to these terms', body: ['We will tell you by email before any change that affects you takes effect.'] },
    ],
  },
  privacy: {
    title: 'Privacy',
    outline: 'policy',
    intro: 'What we collect, why, and what you can ask us to do with it, under the Nigeria Data Protection Act 2023.',
    sections: [
      { id: 'collect', heading: 'What we collect', body: ['Account details: name, email, phone number and password (stored scrambled, never readable).', 'What you do on Dogeash: dogs you save, compare and view, bookings, reservations and messages.', 'For stores and providers: ID, business registration and bank details for verification and payouts.'] },
      { id: 'why', heading: 'Why we use it', body: ['To run your account, match dogs to your home, arrange visits and handovers, pay stores, and keep the marketplace safe from fake listings.'] },
      { id: 'share', heading: 'Who we share it with', body: ['A store sees your name and contact details only when you book a visit, reserve a dog or message them. Our payment partner sees what it needs to take a payment. We never sell your data.'] },
      { id: 'device', heading: 'On your device', body: ['Before you sign in, your shortlist and recently viewed dogs are kept in your browser. We use one cookie to keep you signed in, and remember your Day or Night watch choice. No advertising cookies.'] },
      { id: 'keep', heading: 'How long we keep it', body: ['While your account is open, and for as long afterwards as the law requires for payment records.'] },
      { id: 'rights', heading: 'Your rights', body: ['You can ask for a copy of your data, ask us to correct it, or close your account and have it deleted. You can also complain to the Nigeria Data Protection Commission.'] },
      { id: 'contact', heading: 'Contact', body: ['Questions about your data go to our data protection officer. Contact details will be published here before launch.'] },
    ],
  },
}
