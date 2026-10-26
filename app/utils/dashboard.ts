// Store dashboard: navigation and example figures until accounts and the API exist.
// The signed-in store is K9 Guardian Kennels for now.

export const dashboardNav = [
  {
    group: 'Manage',
    items: [
      { to: '/dashboard', label: 'Overview', icon: 'LayoutDashboard' },
      { to: '/dashboard/dogs', label: 'Dogs', icon: 'Dog' },
      { to: '/dashboard/enquiries', label: 'Enquiries', icon: 'MessageSquare', badge: 3 },
      { to: '/dashboard/bookings', label: 'Bookings', icon: 'CalendarDays' },
      { to: '/dashboard/care', label: 'Care team', icon: 'Stethoscope' },
    ],
  },
  {
    group: 'Store',
    items: [
      { to: '/dashboard/profile', label: 'Store profile', icon: 'Store' },
      { to: '/dashboard/payouts', label: 'Payouts', icon: 'Wallet' },
      { to: '/dashboard/team', label: 'Team', icon: 'Users' },
      { to: '/dashboard/settings', label: 'Settings', icon: 'Settings' },
    ],
  },
] as const

// What each section will hold, shown until it is built
export const dashboardSections: Record<string, { title: string, text: string, plan: string[] }> = {
  dogs: { title: 'Dogs', text: 'Every dog you list, from draft to sold.', plan: ['Add a dog with the full K9 file', 'Edit price, photos and videos', 'Mark reserved, sold or withdrawn'] },
  enquiries: { title: 'Enquiries', text: 'Messages from buyers about your dogs.', plan: ['Reply from one inbox', 'See which dog each enquiry is about', 'Turn an enquiry into a kennel visit'] },
  bookings: { title: 'Bookings', text: 'Kennel visits and handovers on your calendar.', plan: ['Set the days and times you take visits', 'Confirm, move or cancel visits', 'Schedule handover at the buyer\'s gate'] },
  care: { title: 'Care team', text: 'The vets, trainers and suppliers shown on your store page.', plan: ['Link providers you work with', 'Say what each one does for you', 'Invite a provider to join Dogeash'] },
  profile: { title: 'Store profile', text: 'Everything buyers see on your public store page.', plan: ['Upload your banner and logo', 'Edit about, history, services and hours', 'Owner profile and credentials'] },
  payouts: { title: 'Payouts', text: 'Deposits, sales and money paid to your bank.', plan: ['Bank account for payouts', 'Escrow deposits and releases', 'Statements and platform fees'] },
  team: { title: 'Team', text: 'People who help run your store.', plan: ['Invite staff by email or phone', 'Roles: owner, manager, handler', 'Remove access when someone leaves'] },
  settings: { title: 'Settings', text: 'Your account and store preferences.', plan: ['Sign-in and one-time code security', 'Notifications by SMS and email', 'Close or pause your store'] },
}

// Example figures for the design
export const dashboardStats = [
  { label: 'Store views', value: '1,284', change: '+12%', trend: [38, 42, 40, 51, 47, 58, 64] },
  { label: 'New enquiries', value: '18', change: '+5', trend: [2, 3, 1, 4, 2, 3, 3] },
  { label: 'Kennel visits booked', value: '5', change: '+2', trend: [0, 1, 1, 0, 1, 1, 1] },
  { label: 'Dogs for sale', value: '4', change: '1 reserved', trend: [5, 5, 5, 4, 4, 4, 4] },
]

export const dashboardAttention = [
  { icon: 'MessageSquare', title: '3 enquiries waiting for a reply', text: 'Oldest from Aisha B. about Sarge, 5 hours ago', action: 'Reply', to: '/dashboard/enquiries', tone: 'marigold' },
  { icon: 'Wallet', title: 'Deposit received for Kaia', text: '₦250,000 held in escrow until handover', action: 'Plan handover', to: '/dashboard/bookings', tone: 'night' },
  { icon: 'Syringe', title: 'Booster due for Onyx', text: 'Rabies booster due 14 November. Update the K9 file after.', action: 'Update file', to: '/dashboard/dogs', tone: 'ash' },
  { icon: 'ImagePlus', title: 'Add your store banner', text: 'Stores with a banner get more visits. Yours shows your initials for now.', action: 'Upload', to: '/dashboard/profile', tone: 'ash' },
] as const

export const dashboardUpcoming = [
  { day: 'Tue', date: '27', time: '10:30', title: 'Kennel visit', who: 'Tunde O. · interested in Mamba', where: 'At the kennel, Kuje' },
  { day: 'Thu', date: '29', time: '14:00', title: 'Handover: Kaia', who: 'Folake A. · Maitama', where: 'At the buyer\'s gate' },
  { day: 'Sat', date: '31', time: '09:00', title: 'Vet check-up', who: 'Dr. Halima Sani · 3 dogs', where: 'At the kennel, Kuje' },
]

// Views and enquiries per dog, last 30 days
export const dashboardDogStats: Record<string, { views: number, enquiries: number }> = {
  'KD-2026-003': { views: 412, enquiries: 6 },
  'KD-2026-014': { views: 388, enquiries: 7 },
  'KD-2026-036': { views: 201, enquiries: 3 },
}

export const profileChecklist = [
  { label: 'About and history', done: true },
  { label: 'Owner profile', done: true },
  { label: 'Care team', done: true },
  { label: 'Opening hours and delivery', done: true },
  { label: 'Store banner and logo', done: false },
]
