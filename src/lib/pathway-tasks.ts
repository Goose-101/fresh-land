import {
  IdCard,
  Landmark,
  Stethoscope,
  FileText,
  Phone,
  GraduationCap,
  Home,
  Scale,
  BookOpen,
  Users,
  MapPin,
  CreditCard,
  HandCoins,
  BadgeCheck,
  Heart,
  Briefcase,
  ShieldCheck,
  Library,
  UtensilsCrossed,
  FileBadge,
  Siren,
  type LucideIcon,
} from "lucide-react";

export type TimeInUS = "lt1m" | "1to6m" | "6to12m" | "over1y";
export type ImmigrationStatus =
  | "work"
  | "student"
  | "refugee"
  | "greencard"
  | "undocumented"
  | "other";
export type Phase = 1 | 2 | 3;
export type TaskStatus = "not_started" | "in_progress" | "done" | "already";

export type PathwayTask = {
  id: string;
  phase: Phase;
  category: string;
  resourceCategory: string;
  Icon: LucideIcon;
  titleKey: string;
  fallbackTitle: string;
  descKey: string;
  fallbackDesc: string;
  tipKey: string;
  fallbackTip: string;
  showIf?: {
    hasChildren?: boolean;
    status?: ImmigrationStatus[];
  };
};

export type OnboardingState = {
  completedAt: string | null;
  timeInUS: TimeInUS | null;
  status: ImmigrationStatus | null;
  hasChildren: boolean | null;
};

export type TaskRecord = { status: TaskStatus; updatedAt: string };
export type TaskState = Record<string, TaskRecord>;

export type Reminder = {
  id: string;
  taskId: string;
  fireAt: string;
  note: string;
  fired: boolean;
  viewed?: boolean;
};

export const TASKS: PathwayTask[] = [
  {
    id: "state_id",
    phase: 1,
    category: "legal",
    resourceCategory: "legal",
    Icon: IdCard,
    titleKey: "pathway.task.state_id.title",
    fallbackTitle: "Get a State ID or Driver's License",
    descKey: "pathway.task.state_id.desc",
    fallbackDesc:
      "Visit the Georgia Department of Driver Services with your passport, visa, and proof of address.",
    tipKey: "pathway.task.state_id.tip",
    fallbackTip:
      "Make an appointment online to skip long waits. Bring two proofs of Georgia residency (lease, utility bill, bank letter).",
  },
  {
    id: "bank_account",
    phase: 1,
    category: "financial",
    resourceCategory: "financial",
    Icon: Landmark,
    titleKey: "pathway.task.bank_account.title",
    fallbackTitle: "Open a Bank Account",
    descKey: "pathway.task.bank_account.desc",
    fallbackDesc:
      "A bank account keeps your money safe and lets you receive paychecks. Many banks accept passport + ITIN.",
    tipKey: "pathway.task.bank_account.tip",
    fallbackTip:
      "Credit unions like Latino Community CU and Georgia United often welcome newcomers without an SSN.",
  },
  {
    id: "primary_doctor",
    phase: 1,
    category: "healthcare",
    resourceCategory: "healthcare",
    Icon: Stethoscope,
    titleKey: "pathway.task.primary_doctor.title",
    fallbackTitle: "Find a Primary Care Doctor",
    descKey: "pathway.task.primary_doctor.desc",
    fallbackDesc:
      "A primary doctor handles checkups, prescriptions, and refers you to specialists when needed.",
    tipKey: "pathway.task.primary_doctor.tip",
    fallbackTip:
      "Federally Qualified Health Centers (FQHCs) like Mercy Care serve everyone, regardless of status or insurance.",
  },
  {
    id: "ssn",
    phase: 1,
    category: "legal",
    resourceCategory: "legal",
    Icon: FileText,
    titleKey: "pathway.task.ssn.title",
    fallbackTitle: "Apply for a Social Security Number",
    descKey: "pathway.task.ssn.desc",
    fallbackDesc:
      "If you're work-authorized, apply for an SSN at your local Social Security office. It's required for most jobs.",
    tipKey: "pathway.task.ssn.tip",
    fallbackTip:
      "Wait at least 10 days after arriving in the US before applying. Bring your I-94, passport, and visa.",
    showIf: {
      status: ["work", "student", "refugee", "greencard", "other"],
    },
  },
  {
    id: "phone_plan",
    phase: 1,
    category: "community",
    resourceCategory: "community",
    Icon: Phone,
    titleKey: "pathway.task.phone_plan.title",
    fallbackTitle: "Set Up a Phone Plan",
    descKey: "pathway.task.phone_plan.desc",
    fallbackDesc:
      "Pick a US phone number so doctors, schools, and employers can reach you.",
    tipKey: "pathway.task.phone_plan.tip",
    fallbackTip:
      "Prepaid plans (Mint, Cricket, Visible) don't need a credit check. Many offer plans under $30/month.",
  },
  {
    id: "school_enroll",
    phase: 1,
    category: "education",
    resourceCategory: "education",
    Icon: GraduationCap,
    titleKey: "pathway.task.school_enroll.title",
    fallbackTitle: "Enroll Your Children in School",
    descKey: "pathway.task.school_enroll.desc",
    fallbackDesc:
      "Public schools in Georgia must enroll every child age 5–18, regardless of immigration status.",
    tipKey: "pathway.task.school_enroll.tip",
    fallbackTip:
      "Bring proof of address, your child's birth certificate, and immunization records. Translators are available — ask for one.",
    showIf: { hasChildren: true },
  },
  {
    id: "health_insurance",
    phase: 1,
    category: "healthcare",
    resourceCategory: "healthcare",
    Icon: ShieldCheck,
    titleKey: "pathway.task.health_insurance.title",
    fallbackTitle: "Get Health Insurance",
    descKey: "pathway.task.health_insurance.desc",
    fallbackDesc:
      "Find coverage that fits your situation: employer plan, healthcare.gov Marketplace, Medicaid, or PeachCare for Kids.",
    tipKey: "pathway.task.health_insurance.tip",
    fallbackTip:
      "PeachCare for Kids covers children in low-income families regardless of immigration status. Special enrollment opens after big life changes (move, new job, baby).",
  },
  {
    id: "library_card",
    phase: 1,
    category: "libraries",
    resourceCategory: "libraries",
    Icon: Library,
    titleKey: "pathway.task.library_card.title",
    fallbackTitle: "Get a Library Card",
    descKey: "pathway.task.library_card.desc",
    fallbackDesc:
      "Free books in your language, free WiFi, free printing, free ESL classes, and free programs for kids.",
    tipKey: "pathway.task.library_card.tip",
    fallbackTip:
      "Most Atlanta-area libraries only need proof of address. Bring a utility bill or lease to your nearest branch.",
  },
  {
    id: "food_assistance",
    phase: 1,
    category: "food",
    resourceCategory: "food",
    Icon: UtensilsCrossed,
    titleKey: "pathway.task.food_assistance.title",
    fallbackTitle: "Find Food Assistance If You Need It",
    descKey: "pathway.task.food_assistance.desc",
    fallbackDesc:
      "Food banks, WIC for moms and young children, and SNAP can help while you get on your feet.",
    tipKey: "pathway.task.food_assistance.tip",
    fallbackTip:
      "Atlanta Community Food Bank has a 24/7 helpline. WIC is not considered 'public charge' for kids and pregnant moms.",
  },
  {
    id: "itin",
    phase: 1,
    category: "legal",
    resourceCategory: "legal",
    Icon: FileBadge,
    titleKey: "pathway.task.itin.title",
    fallbackTitle: "Apply for an ITIN (if you can't get an SSN)",
    descKey: "pathway.task.itin.desc",
    fallbackDesc:
      "An ITIN lets you file taxes, open bank accounts, and start a financial history without a Social Security Number.",
    tipKey: "pathway.task.itin.tip",
    fallbackTip:
      "Apply by mail with IRS Form W-7 + your tax return, or in person at an IRS Taxpayer Assistance Center. Catholic Charities and Inspiritus help for free.",
    showIf: { status: ["undocumented", "other", "student"] },
  },
  {
    id: "emergency_contacts",
    phase: 1,
    category: "emergency",
    resourceCategory: "emergency",
    Icon: Siren,
    titleKey: "pathway.task.emergency_contacts.title",
    fallbackTitle: "Save Emergency Numbers in Your Phone",
    descKey: "pathway.task.emergency_contacts.desc",
    fallbackDesc:
      "Save 911 (police, fire, ambulance), 211 (free help line in your language), and 988 (mental health crisis) so you can find them fast.",
    tipKey: "pathway.task.emergency_contacts.tip",
    fallbackTip:
      "Add your nearest hospital and one trusted neighbor too. 911 is free and operators will not ask about immigration status.",
  },

  {
    id: "stable_housing",
    phase: 2,
    category: "housing",
    resourceCategory: "housing",
    Icon: Home,
    titleKey: "pathway.task.stable_housing.title",
    fallbackTitle: "Find Stable Long-Term Housing",
    descKey: "pathway.task.stable_housing.desc",
    fallbackDesc:
      "Look for an apartment, room, or shared housing that fits your budget and is near transit, work, or school.",
    tipKey: "pathway.task.stable_housing.tip",
    fallbackTip:
      "Rent should be under 1/3 of your monthly income. Always read the lease before signing — ask for a translation if needed.",
  },
  {
    id: "immigration_lawyer",
    phase: 2,
    category: "legal",
    resourceCategory: "legal",
    Icon: Scale,
    titleKey: "pathway.task.immigration_lawyer.title",
    fallbackTitle: "Connect with an Immigration Lawyer",
    descKey: "pathway.task.immigration_lawyer.desc",
    fallbackDesc:
      "Even if your status is stable, talking to a lawyer once a year helps you plan ahead and avoid surprises.",
    tipKey: "pathway.task.immigration_lawyer.tip",
    fallbackTip:
      "Free or low-cost help: Catholic Charities, Georgia Legal Services, and Inspiritus all do immigration cases.",
  },
  {
    id: "esl_training",
    phase: 2,
    category: "education",
    resourceCategory: "education",
    Icon: BookOpen,
    titleKey: "pathway.task.esl_training.title",
    fallbackTitle: "Explore ESL or Job Training",
    descKey: "pathway.task.esl_training.desc",
    fallbackDesc:
      "Free English classes and skills training are available across Atlanta — many evening and weekend options.",
    tipKey: "pathway.task.esl_training.tip",
    fallbackTip:
      "Public libraries and technical colleges (Atlanta Tech, Gwinnett Tech) offer ESL classes at no cost.",
  },
  {
    id: "community_centers",
    phase: 2,
    category: "community",
    resourceCategory: "community",
    Icon: Users,
    titleKey: "pathway.task.community_centers.title",
    fallbackTitle: "Register with Community Centers",
    descKey: "pathway.task.community_centers.desc",
    fallbackDesc:
      "Connect with people who speak your language and have walked this path before.",
    tipKey: "pathway.task.community_centers.tip",
    fallbackTip:
      "CPACS, Latin American Association, and Inspiritus offer case management, classes, and friendship.",
  },
  {
    id: "neighborhood",
    phase: 2,
    category: "parks",
    resourceCategory: "parks",
    Icon: MapPin,
    titleKey: "pathway.task.neighborhood.title",
    fallbackTitle: "Learn Your Neighborhood",
    descKey: "pathway.task.neighborhood.desc",
    fallbackDesc:
      "Find your closest park, library, grocery store, transit stop, and pharmacy. It makes daily life easier.",
    tipKey: "pathway.task.neighborhood.tip",
    fallbackTip:
      "Take a Saturday walk with a printed map. Note one thing per category so you always know where to go.",
  },

  {
    id: "build_credit",
    phase: 3,
    category: "financial",
    resourceCategory: "financial",
    Icon: CreditCard,
    titleKey: "pathway.task.build_credit.title",
    fallbackTitle: "Build a Credit History",
    descKey: "pathway.task.build_credit.desc",
    fallbackDesc:
      "Strong credit helps you rent apartments, buy a car, or get a small business loan later.",
    tipKey: "pathway.task.build_credit.tip",
    fallbackTip:
      "Start with a secured credit card. Pay the full balance every month — never carry debt to 'build credit.'",
  },
  {
    id: "apply_benefits",
    phase: 3,
    category: "financial",
    resourceCategory: "financial",
    Icon: HandCoins,
    titleKey: "pathway.task.apply_benefits.title",
    fallbackTitle: "Apply for Benefits You Qualify For",
    descKey: "pathway.task.apply_benefits.desc",
    fallbackDesc:
      "Children of any status often qualify for WIC, free school meals, and Medicaid. Don't leave help on the table.",
    tipKey: "pathway.task.apply_benefits.tip",
    fallbackTip:
      "Most benefits are not 'public charge' for kids and pregnant moms. Ask Catholic Charities or Inspiritus to help apply.",
  },
  {
    id: "citizenship",
    phase: 3,
    category: "legal",
    resourceCategory: "legal",
    Icon: BadgeCheck,
    titleKey: "pathway.task.citizenship.title",
    fallbackTitle: "Prepare for the Citizenship Exam",
    descKey: "pathway.task.citizenship.desc",
    fallbackDesc:
      "Most green card holders can apply after 5 years (3 if married to a US citizen).",
    tipKey: "pathway.task.citizenship.tip",
    fallbackTip:
      "Free study materials at uscis.gov/citizenship. Many libraries and CPACS run free citizenship classes.",
    showIf: { status: ["greencard"] },
  },
  {
    id: "cultural_org",
    phase: 3,
    category: "faith",
    resourceCategory: "faith",
    Icon: Heart,
    titleKey: "pathway.task.cultural_org.title",
    fallbackTitle: "Join a Cultural or Faith Community",
    descKey: "pathway.task.cultural_org.desc",
    fallbackDesc:
      "A community that shares your language, faith, or culture is one of the strongest forms of support.",
    tipKey: "pathway.task.cultural_org.tip",
    fallbackTip:
      "Many communities run weekend gatherings, holiday celebrations, and youth programs that help you feel at home.",
  },
  {
    id: "career",
    phase: 3,
    category: "employment",
    resourceCategory: "employment",
    Icon: Briefcase,
    titleKey: "pathway.task.career.title",
    fallbackTitle: "Grow Your Career",
    descKey: "pathway.task.career.desc",
    fallbackDesc:
      "Move beyond a starter job into a career. Get certifications, validate foreign degrees, or start a business.",
    tipKey: "pathway.task.career.tip",
    fallbackTip:
      "WES (wes.org) evaluates foreign degrees for US employers. JFCS and Atlanta CareerRise help with career planning.",
  },
];

export function isTaskVisible(task: PathwayTask, ob: OnboardingState): boolean {
  if (task.showIf?.hasChildren && !ob.hasChildren) return false;
  if (task.showIf?.status && ob.status && !task.showIf.status.includes(ob.status))
    return false;
  return true;
}

export function visiblePhases(timeInUS: TimeInUS | null): Phase[] {
  if (timeInUS === "lt1m") return [1];
  if (timeInUS === "1to6m") return [1, 2];
  return [1, 2, 3];
}

export function phaseTitle(phase: Phase): string {
  return phase === 1
    ? "First Steps"
    : phase === 2
    ? "Settling In"
    : "Building Roots";
}

export function phaseSubtitle(phase: Phase): string {
  return phase === 1
    ? "0–30 days"
    : phase === 2
    ? "1–6 months"
    : "6+ months";
}