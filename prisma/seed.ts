import {
  PrismaClient,
  ProjectStatus,
  StageStatus,
  ProjectMemberRole,
  QuestionStatus,
  Role,
  ProjectType,
  ProjectScale,
  FundingSource,
  ProjectVisibility,
} from "@/app/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const D = (s: string) => new Date(s);

// ---------------------------------------------------------------------------
// Reference data: ministries, locations, users
// ---------------------------------------------------------------------------

const MINISTRIES = [
  "Министерство здравоохранения Республики Казахстан",
  "Министерство образования и науки Республики Казахстан",
  "Министерство цифрового развития, инноваций и аэрокосмической промышленности Республики Казахстан",
  "Министерство индустрии и инфраструктурного развития Республики Казахстан",
  "Министерство энергетики Республики Казахстан",
  "Министерство сельского хозяйства Республики Казахстан",
  "Министерство транспорта Республики Казахстан",
  "Министерство туризма и спорта Республики Казахстан",
  "Министерство водных ресурсов и ирригации Республики Казахстан",
  "Министерство труда и социальной защиты населения Республики Казахстан",
] as const;

const LOCATIONS: Record<string, { city: string; region: string | null; latitude: number; longitude: number }> = {
  ASTANA: { city: "Астана", region: null, latitude: 51.1694, longitude: 71.4491 },
  ALMATY: { city: "Алматы", region: null, latitude: 43.2389, longitude: 76.8897 },
  SHYMKENT: { city: "Шымкент", region: null, latitude: 42.3417, longitude: 69.5903 },
  KARAGANDA: { city: "Караганда", region: "Карагандинская область", latitude: 49.8028, longitude: 73.0885 },
  AKTOBE: { city: "Актобе", region: "Актюбинская область", latitude: 50.2839, longitude: 57.167 },
  TARAZ: { city: "Тараз", region: "Жамбылская область", latitude: 42.9, longitude: 71.3667 },
  PAVLODAR: { city: "Павлодар", region: "Павлодарская область", latitude: 52.2873, longitude: 76.9674 },
  UST_KAMENOGORSK: { city: "Усть-Каменогорск", region: "Восточно-Казахстанская область", latitude: 49.9714, longitude: 82.6053 },
  SEMEY: { city: "Семей", region: "Восточно-Казахстанская область", latitude: 50.4111, longitude: 80.2275 },
  ATYRAU: { city: "Атырау", region: "Атырауская область", latitude: 47.1164, longitude: 51.883 },
  KOSTANAY: { city: "Костанай", region: "Костанайская область", latitude: 53.2144, longitude: 63.6246 },
  KYZYLORDA: { city: "Кызылорда", region: "Кызылординская область", latitude: 44.8479, longitude: 65.4823 },
  URALSK: { city: "Уральск", region: "Западно-Казахстанская область", latitude: 51.2333, longitude: 51.3667 },
  AKTAU: { city: "Актау", region: "Мангистауская область", latitude: 43.651, longitude: 51.1979 },
  TURKESTAN: { city: "Туркестан", region: "Туркестанская область", latitude: 43.2975, longitude: 68.2517 },
  PETROPAVLOVSK: { city: "Петропавловск", region: "Северо-Казахстанская область", latitude: 54.8667, longitude: 69.15 },
  KOKSHETAU: { city: "Кокшетау", region: "Акмолинская область", latitude: 53.2833, longitude: 69.3833 },
  TALDYKORGAN: { city: "Талдыкорган", region: "Жетысуская область", latitude: 45.0167, longitude: 78.3667 },
};

type UserSeed = {
  key: string;
  firstName: string;
  lastName: string;
  name: string;
  title: string | null;
  email: string;
  role: Role;
};

const USERS: UserSeed[] = [
  { key: "ADMIN", firstName: "Данияр", lastName: "Абдрахманов", name: "Данияр Ерланович Абдрахманов", title: "Системный администратор портала", email: "admin@demo.kz", role: "ADMIN" },
  { key: "DEPUTY", firstName: "Айгуль", lastName: "Садуакасова", name: "Айгуль Нурлановна Садуакасова", title: "Директор департамента цифровизации", email: "a.saduakasova@gov.kz", role: "ADMIN" },
  { key: "SERIKOV", firstName: "Ержан", lastName: "Сериков", name: "Ержан Болатович Сериков", title: "Руководитель управления капитального строительства", email: "e.serikov@gov.kz", role: "USER" },
  { key: "KASYMOVA", firstName: "Гульнара", lastName: "Касымова", name: "Гульнара Ануарбековна Касымова", title: "Заместитель руководителя отдела образования", email: "g.kasymova@gov.kz", role: "USER" },
  { key: "SATYBALDIYEV", firstName: "Нурлан", lastName: "Сатыбалдиев", name: "Нурлан Муратович Сатыбалдиев", title: "Главный специалист департамента водного хозяйства", email: "n.satybaldiyev@gov.kz", role: "USER" },
  { key: "AKHMETOVA", firstName: "Динара", lastName: "Ахметова", name: "Динара Сериковна Ахметова", title: "Начальник отдела сельского хозяйства", email: "d.akhmetova@gov.kz", role: "USER" },
  { key: "ZHUMABEKOV", firstName: "Тимур", lastName: "Жумабеков", name: "Тимур Асхатович Жумабеков", title: "Директор департамента энергетики", email: "t.zhumabekov@gov.kz", role: "USER" },
  { key: "IBRAYEVA", firstName: "Салтанат", lastName: "Ибраева", name: "Салтанат Ержановна Ибраева", title: "Заместитель директора департамента здравоохранения", email: "s.ibrayeva@gov.kz", role: "USER" },
  { key: "MURATOV", firstName: "Асхат", lastName: "Муратов", name: "Асхат Даниярович Муратов", title: "Руководитель проектного офиса", email: "a.muratov@gov.kz", role: "USER" },
  { key: "KENZHEBAYEVA", firstName: "Жанна", lastName: "Кенжебаева", name: "Жанна Болатовна Кенжебаева", title: "Главный эксперт департамента транспорта", email: "zh.kenzhebayeva@gov.kz", role: "USER" },
  { key: "OSPANOV", firstName: "Бауыржан", lastName: "Оспанов", name: "Бауыржан Нурланович Оспанов", title: "Директор департамента индустрии", email: "b.ospanov@gov.kz", role: "USER" },
  { key: "ABENOVA", firstName: "Мадина", lastName: "Абенова", name: "Мадина Тимуровна Абенова", title: "Руководитель управления цифровизации", email: "m.abenova@gov.kz", role: "USER" },
  { key: "TASTANBEKOV", firstName: "Руслан", lastName: "Тастанбеков", name: "Руслан Ерболатович Тастанбеков", title: "Заместитель акима области", email: "r.tastanbekov@gov.kz", role: "USER" },
  { key: "DOSZHANOVA", firstName: "Айнур", lastName: "Досжанова", name: "Айнур Асхатовна Досжанова", title: "Директор департамента туризма", email: "a.doszhanova@gov.kz", role: "USER" },
  { key: "UTEGENOV", firstName: "Марат", lastName: "Утегенов", name: "Марат Жумабекович Утегенов", title: "Начальник управления промышленности", email: "m.utegenov@gov.kz", role: "USER" },
  { key: "NURPEISOVA", firstName: "Алия", lastName: "Нурпеисова", name: "Алия Нурлановна Нурпеисова", title: "Главный специалист департамента сельского хозяйства", email: "a.nurpeisova@gov.kz", role: "USER" },
  { key: "CITIZEN1", firstName: "Азамат", lastName: "Куанышев", name: "Азамат Ерланович Куанышев", title: null, email: "a.kuanyshev@mail.ru", role: "USER" },
  { key: "CITIZEN2", firstName: "Айым", lastName: "Бекова", name: "Айым Болатовна Бекова", title: null, email: "a.bekova@mail.ru", role: "USER" },
];

const DEMO_PASSWORD = "Qwerty123!";

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

type StageSeed = { label: string; start: Date; end: Date; status: StageStatus; budget: number };
type QuestionSeed = {
  text: string;
  answer: string | null;
  status: QuestionStatus;
  authorKey: string | null;
  approvedByKey: string | null;
};
type MemberSeed = { userKey: string; role: ProjectMemberRole };
type KpiSeed = { name: string; baselineValue: string; targetValue: string; unit: string | null };

type ProjectSeed = {
  name: string;
  shortName: string;
  description: string;
  category: string;
  projectType: ProjectType;
  ministry: (typeof MINISTRIES)[number];
  responsibleOrganization: string;
  contactSlug: string;
  goal: string;
  kpis: KpiSeed[];
  scale: ProjectScale;
  location: keyof typeof LOCATIONS;
  fundingSources: FundingSource[];
  totalBudget: number;
  spentAmount: number;
  status: ProjectStatus;
  visibility?: ProjectVisibility;
  ownerKey: string;
  members: MemberSeed[];
  stages: StageSeed[];
  questions: QuestionSeed[];
};

/** Even-ish split of a project's total/spent budget across its stage date range. */
function buildYearlyBudgets(total: number, spent: number, stages: StageSeed[]) {
  const starts = stages.map((s) => s.start.getTime());
  const ends = stages.map((s) => s.end.getTime());
  const startYear = new Date(Math.min(...starts)).getFullYear();
  const endYear = new Date(Math.max(...ends)).getFullYear();
  const years: number[] = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);

  const base = Math.floor(total / years.length);
  const remainder = total - base * years.length;
  let remainingSpent = spent;

  return years.map((year, idx) => {
    const plannedAmount = base + (idx === years.length - 1 ? remainder : 0);
    const actualAmount = Math.max(0, Math.min(plannedAmount, remainingSpent));
    remainingSpent -= actualAmount;
    return { year, plannedAmount, actualAmount };
  });
}

function projectDateRange(stages: StageSeed[]) {
  const starts = stages.map((s) => s.start.getTime());
  const ends = stages.map((s) => s.end.getTime());
  return { start: new Date(Math.min(...starts)), end: new Date(Math.max(...ends)) };
}

const INFO_AS_OF_DATE = D("2026-08-15");
const NEXT_UPDATE_DATE = D("2027-08-15");

const PROJECTS: ProjectSeed[] = [
  {
    name: "Строительство многопрофильной больницы на 500 коек в г. Туркестан",
    shortName: "Больница-500 Туркестан",
    description:
      "Строительство современного многопрофильного медицинского центра на 500 коек с отделениями кардиологии, онкологии и реанимации. Проект направлен на снижение нагрузки на существующие медучреждения Туркестанской области и повышение доступности высокотехнологичной медицинской помощи для населения региона.",
    category: "Здравоохранение",
    projectType: "INFRASTRUCTURE",
    ministry: MINISTRIES[0],
    responsibleOrganization: "КГП «Туркестанская областная многопрофильная больница»",
    contactSlug: "hospital-turkestan",
    goal: "Повысить доступность специализированной медицинской помощи в Туркестанской области, сократив среднее время ожидания плановой госпитализации.",
    kpis: [
      { name: "Коечный фонд", baselineValue: "0", targetValue: "500", unit: "коек" },
      { name: "Время ожидания плановой госпитализации", baselineValue: "21", targetValue: "5", unit: "дней" },
    ],
    scale: "SINGLE_LOCALITY",
    location: "TURKESTAN",
    fundingSources: ["REPUBLICAN_BUDGET"],
    totalBudget: 45_000_000_000,
    spentAmount: 18_500_000_000,
    status: "IN_PROGRESS",
    ownerKey: "SERIKOV",
    members: [
      { userKey: "KASYMOVA", role: "PROJECT_ADMINISTRATOR" },
      { userKey: "SATYBALDIYEV", role: "PROJECT_MEMBER" },
    ],
    stages: [
      { label: "Разработка проектно-сметной документации", start: D("2024-03-01"), end: D("2024-09-30"), status: "COMPLETED", budget: 2_000_000_000 },
      { label: "Закупка строительных материалов и оборудования", start: D("2024-10-01"), end: D("2025-03-31"), status: "COMPLETED", budget: 8_000_000_000 },
      { label: "Строительно-монтажные работы", start: D("2025-04-01"), end: D("2026-12-31"), status: "IN_PROGRESS", budget: 30_000_000_000 },
      { label: "Ввод в эксплуатацию и оснащение", start: D("2027-01-01"), end: D("2027-06-30"), status: "PLANNED", budget: 5_000_000_000 },
    ],
    questions: [
      { text: "Когда планируется завершение строительства больницы?", answer: "Ввод объекта в эксплуатацию запланирован на первое полугодие 2027 года.", status: "APPROVED", authorKey: "CITIZEN1", approvedByKey: "SERIKOV" },
      { text: "Будут ли в больнице отделения детской онкологии?", answer: "Да, проектом предусмотрено отдельное детское онкологическое отделение на 40 коек.", status: "APPROVED", authorKey: "CITIZEN2", approvedByKey: "KASYMOVA" },
      { text: "Сколько рабочих мест создаст новая больница после открытия?", answer: null, status: "PENDING", authorKey: "CITIZEN1", approvedByKey: null },
    ],
  },
  {
    name: "Модернизация систем водоснабжения и водоотведения в Кызылординской области",
    shortName: "Водоснабжение КЗО",
    description:
      "Комплексная реконструкция изношенных сетей водоснабжения и строительство новых очистных сооружений в населённых пунктах Кызылординской области. Проект обеспечит бесперебойный доступ к качественной питьевой воде для более 180 тысяч жителей и снизит потери воды в сетях с 38% до 12%.",
    category: "ЖКХ и водоснабжение",
    projectType: "INFRASTRUCTURE",
    ministry: MINISTRIES[8],
    responsibleOrganization: "КГП «Кызылординский водоканал»",
    contactSlug: "water-kyzylorda",
    goal: "Обеспечить бесперебойный доступ к качественной питьевой воде для населения Кызылординской области.",
    kpis: [
      { name: "Охват качественным водоснабжением", baselineValue: "62", targetValue: "100", unit: "%" },
      { name: "Потери воды в сетях", baselineValue: "38", targetValue: "12", unit: "%" },
    ],
    scale: "SINGLE_REGION",
    location: "KYZYLORDA",
    fundingSources: ["REPUBLICAN_BUDGET", "LOCAL_BUDGET"],
    totalBudget: 22_300_000_000,
    spentAmount: 22_300_000_000,
    status: "FINISHED",
    ownerKey: "SATYBALDIYEV",
    members: [
      { userKey: "ZHUMABEKOV", role: "PROJECT_ADMINISTRATOR" },
      { userKey: "IBRAYEVA", role: "PROJECT_MEMBER" },
    ],
    stages: [
      { label: "Проектирование и инженерные изыскания", start: D("2023-02-01"), end: D("2023-07-31"), status: "COMPLETED", budget: 3_000_000_000 },
      { label: "Строительство очистных сооружений", start: D("2023-08-01"), end: D("2024-08-31"), status: "COMPLETED", budget: 9_000_000_000 },
      { label: "Замена магистральных водопроводных сетей", start: D("2024-09-01"), end: D("2025-06-30"), status: "COMPLETED", budget: 8_300_000_000 },
      { label: "Пусконаладочные работы и сдача объекта", start: D("2025-07-01"), end: D("2025-12-15"), status: "COMPLETED", budget: 2_000_000_000 },
    ],
    questions: [
      { text: "Улучшилось ли качество питьевой воды после завершения проекта?", answer: "Да, по результатам лабораторных испытаний качество воды полностью соответствует санитарным нормам РК.", status: "APPROVED", authorKey: "CITIZEN2", approvedByKey: "SATYBALDIYEV" },
      { text: "Какие населённые пункты были охвачены проектом?", answer: "Проектом охвачены 24 населённых пункта Кызылординской области, включая г. Кызылорда и прилегающие районы.", status: "APPROVED", authorKey: null, approvedByKey: "ZHUMABEKOV" },
    ],
  },
  {
    name: "«Digital Almaty»: цифровизация государственных услуг в г. Алматы",
    shortName: "Digital Almaty",
    description:
      "Перевод более 200 государственных услуг города Алматы в электронный формат на единой цифровой платформе. Проект включает создание мобильного приложения для жителей, интеграцию с eGov.kz и внедрение системы электронной очереди в ЦОНах города.",
    category: "Электронное правительство",
    projectType: "SERVICE_DIGITALIZATION",
    ministry: MINISTRIES[2],
    responsibleOrganization: "ГКП на ПХВ «Центр цифровизации города Алматы»",
    contactSlug: "digital-almaty",
    goal: "Перевести государственные услуги города Алматы в электронный формат и повысить их доступность для жителей.",
    kpis: [
      { name: "Доля услуг в электронном формате", baselineValue: "45", targetValue: "95", unit: "%" },
      { name: "Услуги на единой платформе", baselineValue: "0", targetValue: "200", unit: "услуг" },
    ],
    scale: "SINGLE_LOCALITY",
    location: "ALMATY",
    fundingSources: ["LOCAL_BUDGET", "REPUBLICAN_BUDGET"],
    totalBudget: 8_700_000_000,
    spentAmount: 5_200_000_000,
    status: "IN_PROGRESS",
    ownerKey: "ABENOVA",
    members: [
      { userKey: "TASTANBEKOV", role: "PROJECT_ADMINISTRATOR" },
      { userKey: "DOSZHANOVA", role: "PROJECT_MEMBER" },
    ],
    stages: [
      { label: "Анализ и проектирование архитектуры платформы", start: D("2025-01-15"), end: D("2025-04-30"), status: "COMPLETED", budget: 800_000_000 },
      { label: "Разработка единой цифровой платформы", start: D("2025-05-01"), end: D("2025-10-31"), status: "COMPLETED", budget: 2_200_000_000 },
      { label: "Интеграция услуг и разработка мобильного приложения", start: D("2025-11-01"), end: D("2026-12-31"), status: "IN_PROGRESS", budget: 4_200_000_000 },
      { label: "Обучение сотрудников ЦОН и запуск в эксплуатацию", start: D("2027-01-01"), end: D("2027-03-31"), status: "PLANNED", budget: 1_500_000_000 },
    ],
    questions: [
      { text: "Когда появится мобильное приложение для жителей?", answer: "Бета-версия мобильного приложения запланирована к запуску в четвёртом квартале 2026 года.", status: "APPROVED", authorKey: "CITIZEN1", approvedByKey: "ABENOVA" },
      { text: "Будет ли платформа доступна для людей старшего возраста без цифровых навыков?", answer: "Да, в ЦОНах сохранятся консультанты для помощи в использовании цифровых сервисов.", status: "APPROVED", authorKey: "CITIZEN2", approvedByKey: "TASTANBEKOV" },
      { text: "Планируется ли поддержка казахского языка в мобильном приложении?", answer: null, status: "PENDING", authorKey: "CITIZEN1", approvedByKey: null },
    ],
  },
  {
    name: "Строительство второй линии Алматинского метрополитена",
    shortName: "Метро Алматы-2",
    description:
      "Строительство второй линии метрополитена протяжённостью 12,3 км с 9 станциями, соединяющей западные и восточные районы города Алматы. Проект призван снизить транспортную нагрузку на автомобильные дороги города и сократить время в пути для более 300 тысяч пассажиров ежедневно.",
    category: "Транспорт и инфраструктура",
    projectType: "INFRASTRUCTURE",
    ministry: MINISTRIES[3],
    responsibleOrganization: "КГП «Алматыметрокурылыс»",
    contactSlug: "metro-almaty",
    goal: "Снизить транспортную нагрузку на автомобильные дороги города Алматы и сократить время в пути пассажиров.",
    kpis: [
      { name: "Протяжённость линии", baselineValue: "0", targetValue: "12.3", unit: "км" },
      { name: "Пассажиропоток", baselineValue: "0", targetValue: "300000", unit: "пассажиров/сутки" },
    ],
    scale: "SINGLE_LOCALITY",
    location: "ALMATY",
    fundingSources: ["REPUBLICAN_BUDGET", "LOCAL_BUDGET"],
    totalBudget: 210_000_000_000,
    spentAmount: 62_000_000_000,
    status: "IN_PROGRESS",
    ownerKey: "UTEGENOV",
    members: [
      { userKey: "KENZHEBAYEVA", role: "PROJECT_ADMINISTRATOR" },
      { userKey: "OSPANOV", role: "PROJECT_MEMBER" },
    ],
    stages: [
      { label: "Проектирование и геологические изыскания", start: D("2023-06-01"), end: D("2024-05-31"), status: "COMPLETED", budget: 15_000_000_000 },
      { label: "Строительство тоннелей (участок 1)", start: D("2024-06-01"), end: D("2025-12-31"), status: "COMPLETED", budget: 25_000_000_000 },
      { label: "Строительство станций и тоннелей (участок 2)", start: D("2026-01-01"), end: D("2027-12-31"), status: "IN_PROGRESS", budget: 90_000_000_000 },
      { label: "Монтаж инженерных систем и путевого хозяйства", start: D("2028-01-01"), end: D("2028-10-31"), status: "PLANNED", budget: 60_000_000_000 },
      { label: "Пусконаладочные работы и ввод в эксплуатацию", start: D("2028-11-01"), end: D("2029-03-31"), status: "PLANNED", budget: 20_000_000_000 },
    ],
    questions: [
      { text: "Сколько станций будет открыто на второй линии?", answer: "Вторая линия будет включать 9 станций от района Калкаман до Алатау.", status: "APPROVED", authorKey: "CITIZEN2", approvedByKey: "UTEGENOV" },
      { text: "Когда ожидается открытие движения по новой линии?", answer: "Запуск пассажирского движения запланирован на второй квартал 2029 года.", status: "APPROVED", authorKey: "CITIZEN1", approvedByKey: "KENZHEBAYEVA" },
      { text: "Как строительство повлияет на дорожное движение в центре города?", answer: null, status: "PENDING", authorKey: "CITIZEN2", approvedByKey: null },
    ],
  },
  {
    name: "Реконструкция автомобильной дороги «Астана – Петропавловск»",
    shortName: "Дорога Астана–Петропавловск",
    description:
      "Реконструкция республиканской автомобильной дороги протяжённостью 286 км с расширением до 4 полос движения, устройством освещения и модернизацией мостовых переходов. Проект повысит безопасность дорожного движения и сократит время в пути между Астаной и Петропавловском на 40 минут.",
    category: "Транспорт и инфраструктура",
    projectType: "INFRASTRUCTURE",
    ministry: MINISTRIES[6],
    responsibleOrganization: "РГП «Казахавтодор»",
    contactSlug: "road-astana-petropavlovsk",
    goal: "Повысить безопасность дорожного движения и сократить время в пути между Астаной и Петропавловском.",
    kpis: [
      { name: "Полосы движения", baselineValue: "2", targetValue: "4", unit: "полосы" },
      { name: "Время в пути", baselineValue: "240", targetValue: "200", unit: "минут" },
    ],
    scale: "MULTIPLE_REGIONS",
    location: "PETROPAVLOVSK",
    fundingSources: ["REPUBLICAN_BUDGET"],
    totalBudget: 95_000_000_000,
    spentAmount: 40_000_000_000,
    status: "DELAYED",
    ownerKey: "OSPANOV",
    members: [
      { userKey: "SERIKOV", role: "PROJECT_ADMINISTRATOR" },
      { userKey: "AKHMETOVA", role: "PROJECT_MEMBER" },
    ],
    stages: [
      { label: "Проектно-изыскательские работы", start: D("2024-02-01"), end: D("2024-07-31"), status: "COMPLETED", budget: 5_000_000_000 },
      { label: "Реконструкция участка км 0–120", start: D("2024-08-01"), end: D("2025-10-31"), status: "COMPLETED", budget: 20_000_000_000 },
      { label: "Реконструкция участка км 120–286", start: D("2025-11-01"), end: D("2026-11-30"), status: "IN_PROGRESS", budget: 50_000_000_000 },
      { label: "Устройство освещения и дорожной разметки", start: D("2026-12-01"), end: D("2027-05-31"), status: "PLANNED", budget: 20_000_000_000 },
    ],
    questions: [
      { text: "Будут ли построены дополнительные развязки на пересечении с районными дорогами?", answer: "Да, проектом предусмотрено строительство пяти транспортных развязок.", status: "APPROVED", authorKey: "CITIZEN1", approvedByKey: "OSPANOV" },
      { text: "Когда завершится реконструкция всей трассы?", answer: "Полное завершение работ, включая освещение, запланировано на май 2027 года.", status: "APPROVED", authorKey: "CITIZEN2", approvedByKey: "SERIKOV" },
    ],
  },
  {
    name: "Строительство общеобразовательной школы на 1200 мест в г. Шымкент",
    shortName: "Школа-1200 Шымкент",
    description:
      "Строительство новой типовой школы на 1200 ученических мест в микрорайоне «Нурсат» г. Шымкент для снижения дефицита ученических мест и ликвидации трёхсменного обучения в районе. Школа будет оснащена современными кабинетами естественных наук, спортивным залом и бассейном.",
    category: "Образование",
    projectType: "INFRASTRUCTURE",
    ministry: MINISTRIES[1],
    responsibleOrganization: "Отдел образования акимата г. Шымкент",
    contactSlug: "school-shymkent",
    goal: "Ликвидировать дефицит ученических мест и трёхсменное обучение в микрорайоне «Нурсат».",
    kpis: [
      { name: "Ученические места", baselineValue: "0", targetValue: "1200", unit: "мест" },
      { name: "Смены обучения", baselineValue: "3", targetValue: "2", unit: "смены" },
    ],
    scale: "SINGLE_LOCALITY",
    location: "SHYMKENT",
    fundingSources: ["LOCAL_BUDGET"],
    totalBudget: 6_500_000_000,
    spentAmount: 6_500_000_000,
    status: "FINISHED",
    ownerKey: "KASYMOVA",
    members: [{ userKey: "IBRAYEVA", role: "PROJECT_ADMINISTRATOR" }],
    stages: [
      { label: "Проектирование", start: D("2024-01-10"), end: D("2024-04-30"), status: "COMPLETED", budget: 500_000_000 },
      { label: "Строительно-монтажные работы", start: D("2024-05-01"), end: D("2025-06-30"), status: "COMPLETED", budget: 4_500_000_000 },
      { label: "Оснащение и благоустройство территории", start: D("2025-07-01"), end: D("2025-08-20"), status: "COMPLETED", budget: 1_500_000_000 },
    ],
    questions: [
      { text: "Ликвидировано ли трёхсменное обучение в микрорайоне после открытия школы?", answer: "Да, с открытием новой школы трёхсменное обучение в микрорайоне «Нурсат» полностью ликвидировано.", status: "APPROVED", authorKey: "CITIZEN2", approvedByKey: "KASYMOVA" },
      { text: "Есть ли в школе условия для детей с ограниченными возможностями?", answer: "Здание полностью адаптировано: пандусы, лифты и специализированные кабинеты для инклюзивного обучения.", status: "APPROVED", authorKey: "CITIZEN1", approvedByKey: "IBRAYEVA" },
    ],
  },
  {
    name: "Модернизация энергоблоков Экибастузской ГРЭС-2",
    shortName: "ГРЭС-2 Модернизация",
    description:
      "Модернизация двух энергоблоков Экибастузской ГРЭС-2 с установкой нового энергоэффективного оборудования и систем очистки дымовых газов. Проект повысит установленную мощность станции и снизит выбросы загрязняющих веществ в атмосферу в соответствии с экологическими стандартами.",
    category: "Энергетика",
    projectType: "MODERNIZATION",
    ministry: MINISTRIES[4],
    responsibleOrganization: "АО «Станция Экибастузская ГРЭС-2»",
    contactSlug: "gres-ekibastuz",
    goal: "Повысить энергоэффективность и снизить выбросы загрязняющих веществ Экибастузской ГРЭС-2.",
    kpis: [
      { name: "Снижение выбросов", baselineValue: "0", targetValue: "45", unit: "%" },
      { name: "Модернизированные энергоблоки", baselineValue: "0", targetValue: "2", unit: "блока" },
    ],
    scale: "SINGLE_LOCALITY",
    location: "PAVLODAR",
    fundingSources: ["ORGANIZATION_FUNDS"],
    totalBudget: 185_000_000_000,
    spentAmount: 30_000_000_000,
    status: "IN_PROGRESS",
    ownerKey: "MURATOV",
    members: [
      { userKey: "ZHUMABEKOV", role: "PROJECT_ADMINISTRATOR" },
      { userKey: "NURPEISOVA", role: "PROJECT_MEMBER" },
    ],
    stages: [
      { label: "Проектирование модернизации энергоблоков", start: D("2025-01-01"), end: D("2025-08-31"), status: "COMPLETED", budget: 10_000_000_000 },
      { label: "Закупка основного энергетического оборудования", start: D("2025-09-01"), end: D("2026-06-30"), status: "COMPLETED", budget: 20_000_000_000 },
      { label: "Монтаж оборудования и систем очистки", start: D("2026-07-01"), end: D("2028-03-31"), status: "IN_PROGRESS", budget: 100_000_000_000 },
      { label: "Пусконаладочные работы и ввод в эксплуатацию", start: D("2028-04-01"), end: D("2028-09-30"), status: "PLANNED", budget: 55_000_000_000 },
    ],
    questions: [
      { text: "Насколько снизятся выбросы после модернизации станции?", answer: "По расчётам проекта, выбросы загрязняющих веществ снизятся на 45% по сравнению с текущим уровнем.", status: "APPROVED", authorKey: "CITIZEN1", approvedByKey: "MURATOV" },
      { text: "Повлияет ли модернизация на тарифы на электроэнергию для населения?", answer: null, status: "PENDING", authorKey: "CITIZEN2", approvedByKey: null },
    ],
  },
  {
    name: "Программа развития сельскохозяйственной инфраструктуры Костанайской области",
    shortName: "Агроинфраструктура КЗО",
    description:
      "Строительство и модернизация элеваторов, овощехранилищ и мелиоративных систем в Костанайской области для повышения урожайности и снижения потерь сельскохозяйственной продукции. Программа охватывает 12 сельских округов и поддержит более 400 фермерских хозяйств.",
    category: "Сельское хозяйство",
    projectType: "INFRASTRUCTURE",
    ministry: MINISTRIES[5],
    responsibleOrganization: "Управление сельского хозяйства акимата Костанайской области",
    contactSlug: "agri-kostanay",
    goal: "Повысить урожайность и снизить потери сельскохозяйственной продукции в Костанайской области.",
    kpis: [
      { name: "Охваченные сельские округа", baselineValue: "0", targetValue: "12", unit: "округов" },
      { name: "Поддержанные фермерские хозяйства", baselineValue: "0", targetValue: "400", unit: "хозяйств" },
    ],
    scale: "SINGLE_REGION",
    location: "KOSTANAY",
    fundingSources: ["REPUBLICAN_BUDGET", "LOCAL_BUDGET"],
    totalBudget: 14_200_000_000,
    spentAmount: 9_000_000_000,
    status: "IN_PROGRESS",
    ownerKey: "NURPEISOVA",
    members: [
      { userKey: "UTEGENOV", role: "PROJECT_ADMINISTRATOR" },
      { userKey: "SATYBALDIYEV", role: "PROJECT_MEMBER" },
    ],
    stages: [
      { label: "Проектирование объектов инфраструктуры", start: D("2024-11-01"), end: D("2025-03-31"), status: "COMPLETED", budget: 2_000_000_000 },
      { label: "Строительство овощехранилищ", start: D("2025-04-01"), end: D("2025-12-31"), status: "COMPLETED", budget: 5_000_000_000 },
      { label: "Модернизация мелиоративных систем", start: D("2026-01-01"), end: D("2026-11-30"), status: "IN_PROGRESS", budget: 5_200_000_000 },
      { label: "Ввод объектов в эксплуатацию", start: D("2026-12-01"), end: D("2027-02-28"), status: "PLANNED", budget: 2_000_000_000 },
    ],
    questions: [
      { text: "Какие сельские округа охвачены программой?", answer: "Программа охватывает 12 сельских округов, включая Тарановский и Костанайский районы.", status: "APPROVED", authorKey: "CITIZEN1", approvedByKey: "NURPEISOVA" },
      { text: "Смогут ли фермеры арендовать новые овощехранилища?", answer: "Да, овощехранилища будут переданы в аренду фермерским хозяйствам на льготных условиях.", status: "APPROVED", authorKey: "CITIZEN2", approvedByKey: "UTEGENOV" },
      { text: "Планируется ли расширение программы на соседние области?", answer: null, status: "PENDING", authorKey: null, approvedByKey: null },
    ],
  },
  {
    name: "Строительство арендного социального жилья в г. Актобе",
    shortName: "Жилье-Актобе",
    description:
      "Строительство пяти многоквартирных домов арендного социального жилья на 480 квартир для очередников и социально уязвимых категорий населения города Актобе. Проект реализуется в рамках государственной программы жилищного строительства.",
    category: "Жилищное строительство",
    projectType: "INFRASTRUCTURE",
    ministry: MINISTRIES[3],
    responsibleOrganization: "КГП «Актобе-Жилстройсервис»",
    contactSlug: "housing-aktobe",
    goal: "Обеспечить арендным социальным жильём очередников и социально уязвимые категории населения города Актобе.",
    kpis: [
      { name: "Построено квартир", baselineValue: "0", targetValue: "480", unit: "квартир" },
      { name: "Многоквартирные дома", baselineValue: "0", targetValue: "5", unit: "домов" },
    ],
    scale: "SINGLE_LOCALITY",
    location: "AKTOBE",
    fundingSources: ["REPUBLICAN_BUDGET", "LOCAL_BUDGET"],
    totalBudget: 11_300_000_000,
    spentAmount: 4_000_000_000,
    status: "IN_PROGRESS",
    ownerKey: "KENZHEBAYEVA",
    members: [
      { userKey: "ABENOVA", role: "PROJECT_ADMINISTRATOR" },
      { userKey: "TASTANBEKOV", role: "PROJECT_MEMBER" },
    ],
    stages: [
      { label: "Проектно-сметная документация", start: D("2025-02-01"), end: D("2025-05-31"), status: "COMPLETED", budget: 1_000_000_000 },
      { label: "Строительство домов №1–2", start: D("2025-06-01"), end: D("2026-02-28"), status: "COMPLETED", budget: 3_000_000_000 },
      { label: "Строительство домов №3–5", start: D("2026-03-01"), end: D("2027-04-30"), status: "IN_PROGRESS", budget: 5_300_000_000 },
      { label: "Благоустройство территории и сдача в эксплуатацию", start: D("2027-05-01"), end: D("2027-07-31"), status: "PLANNED", budget: 2_000_000_000 },
    ],
    questions: [
      { text: "Как встать в очередь на получение арендного жилья?", answer: "Заявки принимаются через портал eGov.kz или в местном отделе жилищной инспекции.", status: "APPROVED", authorKey: "CITIZEN2", approvedByKey: "KENZHEBAYEVA" },
      { text: "Сколько квартир будет сдано в первую очередь?", answer: "В рамках домов №1–2 будет сдано 192 квартиры.", status: "APPROVED", authorKey: "CITIZEN1", approvedByKey: "ABENOVA" },
    ],
  },
  {
    name: "Создание индустриального парка «Karaganda Industrial Park»",
    shortName: "Karaganda Industrial Park",
    description:
      "Создание индустриального парка с готовой инженерной инфраструктурой на территории 150 га для размещения предприятий металлообработки и машиностроения. Проект предусматривает создание более 3000 новых рабочих мест и привлечение отечественных и иностранных инвесторов.",
    category: "Промышленность",
    projectType: "INFRASTRUCTURE",
    ministry: MINISTRIES[3],
    responsibleOrganization: "СЭЗ «Karaganda Industrial Park»",
    contactSlug: "park-karaganda",
    goal: "Создать индустриальный парк для развития металлообработки и машиностроения и привлечения инвесторов.",
    kpis: [
      { name: "Новые рабочие места", baselineValue: "0", targetValue: "3000", unit: "мест" },
      { name: "Площадь парка", baselineValue: "0", targetValue: "150", unit: "га" },
    ],
    scale: "SINGLE_LOCALITY",
    location: "KARAGANDA",
    fundingSources: ["LOCAL_BUDGET", "ORGANIZATION_FUNDS"],
    totalBudget: 27_800_000_000,
    spentAmount: 3_500_000_000,
    status: "SUSPENDED",
    ownerKey: "TASTANBEKOV",
    members: [
      { userKey: "KENZHEBAYEVA", role: "PROJECT_ADMINISTRATOR" },
      { userKey: "AKHMETOVA", role: "PROJECT_MEMBER" },
    ],
    stages: [
      { label: "Технико-экономическое обоснование", start: D("2025-09-01"), end: D("2026-03-31"), status: "COMPLETED", budget: 3_500_000_000 },
      { label: "Строительство инженерной инфраструктуры", start: D("2026-10-01"), end: D("2027-12-31"), status: "PLANNED", budget: 15_000_000_000 },
      { label: "Привлечение якорных резидентов и запуск парка", start: D("2028-01-01"), end: D("2028-08-31"), status: "PLANNED", budget: 9_300_000_000 },
    ],
    questions: [
      { text: "Какие льготы предусмотрены для резидентов парка?", answer: "Резидентам предоставляются налоговые льготы и упрощённый порядок подключения к инженерным сетям.", status: "APPROVED", authorKey: "CITIZEN1", approvedByKey: "TASTANBEKOV" },
      { text: "Когда планируется начало строительства инфраструктуры?", answer: null, status: "PENDING", authorKey: "CITIZEN2", approvedByKey: null },
    ],
  },
  {
    name: "Программа развития сельских территорий «Ауыл – Ел бесігі» в Атырауской области",
    shortName: "Ауыл – Ел бесігі",
    description:
      "Комплексное благоустройство и развитие инфраструктуры 18 сёл Атырауской области: строительство дорог, водопроводов, объектов здравоохранения и образования в рамках государственной программы развития сельских территорий.",
    category: "Сельское хозяйство",
    projectType: "INFRASTRUCTURE",
    ministry: MINISTRIES[5],
    responsibleOrganization: "Управление строительства акимата Атырауской области",
    contactSlug: "rural-atyrau",
    goal: "Улучшить инфраструктуру сельских территорий Атырауской области.",
    kpis: [
      { name: "Охваченные сёла", baselineValue: "0", targetValue: "18", unit: "сёл" },
      { name: "Новые фельдшерско-акушерские пункты", baselineValue: "0", targetValue: "6", unit: "пунктов" },
    ],
    scale: "SINGLE_REGION",
    location: "ATYRAU",
    fundingSources: ["REPUBLICAN_BUDGET", "LOCAL_BUDGET"],
    totalBudget: 9_600_000_000,
    spentAmount: 9_600_000_000,
    status: "FINISHED",
    ownerKey: "AKHMETOVA",
    members: [{ userKey: "MURATOV", role: "PROJECT_ADMINISTRATOR" }],
    stages: [
      { label: "Строительство внутрипоселковых дорог", start: D("2024-04-01"), end: D("2025-01-31"), status: "COMPLETED", budget: 2_600_000_000 },
      { label: "Строительство водопроводных сетей", start: D("2025-02-01"), end: D("2025-09-30"), status: "COMPLETED", budget: 4_000_000_000 },
      { label: "Строительство объектов здравоохранения и образования", start: D("2025-10-01"), end: D("2026-03-31"), status: "COMPLETED", budget: 3_000_000_000 },
    ],
    questions: [
      { text: "Сколько сёл получили новые фельдшерско-акушерские пункты?", answer: "В рамках программы построено 6 новых фельдшерско-акушерских пунктов.", status: "APPROVED", authorKey: "CITIZEN2", approvedByKey: "AKHMETOVA" },
    ],
  },
  {
    name: "Реконструкция и расширение аэропорта г. Уральск",
    shortName: "Аэропорт Уральск",
    description:
      "Реконструкция взлётно-посадочной полосы и строительство нового пассажирского терминала аэропорта г. Уральск пропускной способностью 400 пассажиров в час. Проект повысит транспортную доступность Западно-Казахстанской области и позволит принимать среднемагистральные воздушные суда.",
    category: "Транспорт и инфраструктура",
    projectType: "MODERNIZATION",
    ministry: MINISTRIES[6],
    responsibleOrganization: "АО «Аэропорт Уральск»",
    contactSlug: "airport-uralsk",
    goal: "Повысить транспортную доступность Западно-Казахстанской области.",
    kpis: [
      { name: "Пропускная способность терминала", baselineValue: "150", targetValue: "400", unit: "пасс./час" },
    ],
    scale: "SINGLE_LOCALITY",
    location: "URALSK",
    fundingSources: ["ORGANIZATION_FUNDS"],
    totalBudget: 18_900_000_000,
    spentAmount: 2_000_000_000,
    status: "PLANNED",
    ownerKey: "ZHUMABEKOV",
    members: [
      { userKey: "OSPANOV", role: "PROJECT_ADMINISTRATOR" },
      { userKey: "KASYMOVA", role: "PROJECT_MEMBER" },
    ],
    stages: [
      { label: "Технико-экономическое обоснование и проектирование", start: D("2025-11-01"), end: D("2026-06-30"), status: "COMPLETED", budget: 2_000_000_000 },
      { label: "Реконструкция взлётно-посадочной полосы", start: D("2026-11-01"), end: D("2027-10-31"), status: "PLANNED", budget: 10_900_000_000 },
      { label: "Строительство нового пассажирского терминала", start: D("2027-11-01"), end: D("2028-09-30"), status: "PLANNED", budget: 6_000_000_000 },
    ],
    questions: [
      { text: "Какие авиакомпании планируют выполнять рейсы после реконструкции?", answer: "Переговоры ведутся с тремя отечественными авиакомпаниями о запуске новых рейсов после ввода терминала.", status: "APPROVED", authorKey: "CITIZEN1", approvedByKey: "ZHUMABEKOV" },
      { text: "Продолжит ли аэропорт работу во время реконструкции?", answer: null, status: "PENDING", authorKey: "CITIZEN2", approvedByKey: null },
    ],
  },
  {
    name: "Строительство центра ядерной медицины в г. Семей",
    shortName: "Ядерная медицина Семей",
    description:
      "Строительство центра ядерной медицины и лучевой терапии на базе Государственного медицинского университета г. Семей для ранней диагностики и лечения онкологических заболеваний. Центр будет оснащён ПЭТ-КТ сканером и линейными ускорителями последнего поколения.",
    category: "Здравоохранение",
    projectType: "INFRASTRUCTURE",
    ministry: MINISTRIES[0],
    responsibleOrganization: "НАО «Государственный медицинский университет г. Семей»",
    contactSlug: "medcenter-semey",
    goal: "Обеспечить раннюю диагностику и лечение онкологических заболеваний в Восточно-Казахстанской области.",
    kpis: [
      { name: "Пропускная способность центра", baselineValue: "0", targetValue: "12000", unit: "пациентов/год" },
    ],
    scale: "SINGLE_LOCALITY",
    location: "SEMEY",
    fundingSources: ["REPUBLICAN_BUDGET"],
    totalBudget: 32_400_000_000,
    spentAmount: 11_000_000_000,
    status: "IN_PROGRESS",
    ownerKey: "IBRAYEVA",
    members: [
      { userKey: "SERIKOV", role: "PROJECT_ADMINISTRATOR" },
      { userKey: "ABENOVA", role: "PROJECT_MEMBER" },
    ],
    stages: [
      { label: "Проектирование и экспертиза", start: D("2024-09-01"), end: D("2025-02-28"), status: "COMPLETED", budget: 3_000_000_000 },
      { label: "Закупка медицинского оборудования", start: D("2025-03-01"), end: D("2025-11-30"), status: "COMPLETED", budget: 7_000_000_000 },
      { label: "Строительно-монтажные работы", start: D("2025-12-01"), end: D("2026-12-31"), status: "IN_PROGRESS", budget: 15_400_000_000 },
      { label: "Монтаж оборудования и пусконаладка", start: D("2027-01-01"), end: D("2027-06-30"), status: "PLANNED", budget: 7_000_000_000 },
    ],
    questions: [
      { text: "Сколько пациентов сможет принимать центр ежегодно?", answer: "Расчётная мощность центра — до 12 000 пациентов в год.", status: "APPROVED", authorKey: "CITIZEN1", approvedByKey: "IBRAYEVA" },
      { text: "Будет ли лечение в центре бесплатным по ОСМС?", answer: "Да, услуги центра будут доступны в рамках гарантированного объёма бесплатной медицинской помощи и ОСМС.", status: "APPROVED", authorKey: "CITIZEN2", approvedByKey: "SERIKOV" },
      { text: "Когда центр примет первых пациентов?", answer: null, status: "PENDING", authorKey: "CITIZEN1", approvedByKey: null },
    ],
  },
  {
    name: "Реновация исторического центра г. Туркестан к юбилейным мероприятиям",
    shortName: "Туркестан-Реновация",
    description:
      "Реставрация памятников архитектуры и благоустройство исторического центра г. Туркестан вокруг мавзолея Ходжи Ахмеда Ясави, включая реконструкцию пешеходных зон, освещения и туристической инфраструктуры к юбилейным торжествам.",
    category: "Культура и туризм",
    projectType: "INFRASTRUCTURE",
    ministry: MINISTRIES[7],
    responsibleOrganization: "ГУ «Дирекция по восстановлению историко-культурных объектов г. Туркестан»",
    contactSlug: "renovation-turkestan",
    goal: "Развить туристическую привлекательность исторического центра г. Туркестан.",
    kpis: [
      { name: "Рост туристического потока", baselineValue: "100", targetValue: "165", unit: "% к базовому" },
    ],
    scale: "SINGLE_LOCALITY",
    location: "TURKESTAN",
    fundingSources: ["REPUBLICAN_BUDGET", "LOCAL_BUDGET"],
    totalBudget: 16_700_000_000,
    spentAmount: 16_700_000_000,
    status: "FINISHED",
    ownerKey: "DOSZHANOVA",
    members: [{ userKey: "SATYBALDIYEV", role: "PROJECT_ADMINISTRATOR" }],
    stages: [
      { label: "Реставрация памятников архитектуры", start: D("2023-05-01"), end: D("2024-06-30"), status: "COMPLETED", budget: 4_000_000_000 },
      { label: "Благоустройство пешеходных зон и освещения", start: D("2024-07-01"), end: D("2025-04-30"), status: "COMPLETED", budget: 9_700_000_000 },
      { label: "Развитие туристической инфраструктуры", start: D("2025-05-01"), end: D("2025-09-30"), status: "COMPLETED", budget: 3_000_000_000 },
    ],
    questions: [
      { text: "Как реновация повлияла на туристический поток в город?", answer: "По итогам первого сезона после завершения работ турпоток в Туркестан вырос на 65%.", status: "APPROVED", authorKey: "CITIZEN2", approvedByKey: "DOSZHANOVA" },
    ],
  },
  {
    name: "Развитие туристической инфраструктуры Каспийского побережья в Мангистауской области",
    shortName: "Каспий Тур",
    description:
      "Создание туристической инфраструктуры на побережье Каспийского моря в Мангистауской области: строительство набережной, пляжных зон, гостиничных комплексов и подъездных дорог к природным достопримечательностям региона.",
    category: "Туризм",
    projectType: "INFRASTRUCTURE",
    ministry: MINISTRIES[7],
    responsibleOrganization: "Управление туризма акимата Мангистауской области",
    contactSlug: "tourism-aktau",
    goal: "Создать туристическую инфраструктуру на побережье Каспийского моря в Мангистауской области.",
    kpis: [
      { name: "Протяжённость набережной", baselineValue: "0", targetValue: "5", unit: "км" },
    ],
    scale: "SINGLE_REGION",
    location: "AKTAU",
    fundingSources: ["PPP", "LOCAL_BUDGET"],
    totalBudget: 21_000_000_000,
    spentAmount: 1_200_000_000,
    status: "INITIATED",
    visibility: "DRAFT",
    ownerKey: "UTEGENOV",
    members: [
      { userKey: "NURPEISOVA", role: "PROJECT_ADMINISTRATOR" },
      { userKey: "AKHMETOVA", role: "PROJECT_MEMBER" },
    ],
    stages: [
      { label: "Мастер-планирование и технико-экономическое обоснование", start: D("2025-10-01"), end: D("2026-05-31"), status: "COMPLETED", budget: 1_200_000_000 },
      { label: "Строительство набережной и инженерной инфраструктуры", start: D("2026-11-01"), end: D("2028-02-28"), status: "PLANNED", budget: 11_800_000_000 },
      { label: "Строительство гостиничных комплексов", start: D("2028-03-01"), end: D("2029-05-31"), status: "PLANNED", budget: 8_000_000_000 },
    ],
    questions: [
      { text: "Планируется ли привлечение частных инвесторов для строительства отелей?", answer: "Да, проект предусматривает государственно-частное партнёрство для строительства гостиничных комплексов.", status: "APPROVED", authorKey: "CITIZEN1", approvedByKey: "UTEGENOV" },
      { text: "Как проект повлияет на экологию побережья?", answer: null, status: "PENDING", authorKey: "CITIZEN2", approvedByKey: null },
    ],
  },
  {
    name: "Строительство физкультурно-оздоровительного комплекса в г. Кокшетау",
    shortName: "ФОК Кокшетау",
    description:
      "Строительство физкультурно-оздоровительного комплекса с универсальным игровым залом, бассейном и залом единоборств в г. Кокшетау для развития массового спорта среди детей и молодёжи Акмолинской области.",
    category: "Спорт",
    projectType: "INFRASTRUCTURE",
    ministry: MINISTRIES[7],
    responsibleOrganization: "КГУ «Спортивная школа г. Кокшетау»",
    contactSlug: "sports-kokshetau",
    goal: "Развить массовый спорт среди детей и молодёжи Акмолинской области.",
    kpis: [
      { name: "Пропускная способность комплекса", baselineValue: "0", targetValue: "500", unit: "посетителей/день" },
    ],
    scale: "SINGLE_LOCALITY",
    location: "KOKSHETAU",
    fundingSources: ["LOCAL_BUDGET"],
    totalBudget: 4_800_000_000,
    spentAmount: 4_100_000_000,
    status: "IN_PROGRESS",
    ownerKey: "OSPANOV",
    members: [{ userKey: "IBRAYEVA", role: "PROJECT_ADMINISTRATOR" }],
    stages: [
      { label: "Проектирование", start: D("2025-03-01"), end: D("2025-06-30"), status: "COMPLETED", budget: 800_000_000 },
      { label: "Строительно-монтажные работы", start: D("2025-07-01"), end: D("2026-05-31"), status: "COMPLETED", budget: 3_200_000_000 },
      { label: "Внутренняя отделка и оснащение", start: D("2026-06-01"), end: D("2026-10-31"), status: "IN_PROGRESS", budget: 800_000_000 },
    ],
    questions: [
      { text: "Когда комплекс откроется для посетителей?", answer: "Открытие комплекса для посетителей запланировано на ноябрь 2026 года.", status: "APPROVED", authorKey: "CITIZEN1", approvedByKey: "OSPANOV" },
      { text: "Будут ли бесплатные секции для детей из малообеспеченных семей?", answer: "Да, для детей из социально уязвимых семей предусмотрены бесплатные абонементы.", status: "APPROVED", authorKey: "CITIZEN2", approvedByKey: "IBRAYEVA" },
    ],
  },
  {
    name: "Модернизация системы теплоснабжения г. Талдыкорган",
    shortName: "Теплосети Талдыкорган",
    description:
      "Замена изношенных тепловых сетей и модернизация центральной котельной г. Талдыкорган для повышения надёжности теплоснабжения и снижения потерь тепловой энергии в осенне-зимний период.",
    category: "Энергетика",
    projectType: "MODERNIZATION",
    ministry: MINISTRIES[4],
    responsibleOrganization: "КГП «Талдыкорганская теплоэнергетическая компания»",
    contactSlug: "heating-taldykorgan",
    goal: "Повысить надёжность теплоснабжения и снизить потери тепловой энергии в г. Талдыкорган.",
    kpis: [
      { name: "Аварийные отключения за сезон", baselineValue: "30", targetValue: "10", unit: "случаев" },
    ],
    scale: "SINGLE_LOCALITY",
    location: "TALDYKORGAN",
    fundingSources: ["LOCAL_BUDGET", "ORGANIZATION_FUNDS"],
    totalBudget: 7_200_000_000,
    spentAmount: 7_200_000_000,
    status: "FINISHED",
    ownerKey: "MURATOV",
    members: [{ userKey: "DOSZHANOVA", role: "PROJECT_ADMINISTRATOR" }],
    stages: [
      { label: "Проектирование модернизации котельной", start: D("2024-06-01"), end: D("2024-09-30"), status: "COMPLETED", budget: 1_200_000_000 },
      { label: "Модернизация центральной котельной", start: D("2024-10-01"), end: D("2025-06-30"), status: "COMPLETED", budget: 4_000_000_000 },
      { label: "Замена тепловых сетей", start: D("2025-07-01"), end: D("2025-11-30"), status: "COMPLETED", budget: 2_000_000_000 },
    ],
    questions: [
      { text: "Снизились ли аварийные отключения после модернизации?", answer: "Да, количество аварийных отключений в отопительный сезон снизилось более чем в три раза.", status: "APPROVED", authorKey: "CITIZEN2", approvedByKey: "MURATOV" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

async function resetData() {
  await prisma.notification.deleteMany();
  await prisma.auditLogEntry.deleteMany();
  await prisma.question.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.projectDocument.deleteMany();
  await prisma.projectStage.deleteMany();
  await prisma.project.deleteMany();
  await prisma.location.deleteMany();
  await prisma.ministry.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log("🧹 Clearing existing data...");
  await resetData();

  console.log("👤 Creating users...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const userIdByKey = new Map<string, string>();
  for (const u of USERS) {
    const created = await prisma.user.create({
      data: {
        firstName: u.firstName,
        lastName: u.lastName,
        name: u.name,
        title: u.title,
        email: u.email,
        password: passwordHash,
        role: u.role,
        emailVerified: new Date(),
      },
    });
    userIdByKey.set(u.key, created.id);
  }

  console.log("🏛️  Creating ministries...");
  const ministryIdByName = new Map<string, string>();
  for (const name of MINISTRIES) {
    const created = await prisma.ministry.create({ data: { name } });
    ministryIdByName.set(name, created.id);
  }

  console.log("📍 Creating locations...");
  const locationIdByKey = new Map<string, string>();
  for (const [key, loc] of Object.entries(LOCATIONS)) {
    const created = await prisma.location.create({ data: loc });
    locationIdByKey.set(key, created.id);
  }

  console.log("📁 Creating projects...");
  for (const p of PROJECTS) {
    const { start: startDate, end: plannedEndDate } = projectDateRange(p.stages);
    const yearlyBudgets = buildYearlyBudgets(p.totalBudget, p.spentAmount, p.stages);
    const owner = USERS.find((u) => u.key === p.ownerKey)!;

    const project = await prisma.project.create({
      data: {
        name: p.name,
        shortName: p.shortName,
        description: p.description,
        category: p.category,
        projectType: p.projectType,
        totalBudget: p.totalBudget,
        spentAmount: p.spentAmount,
        status: p.status,
        ownerId: userIdByKey.get(p.ownerKey)!,
        ministryId: ministryIdByName.get(p.ministry)!,
        responsibleOrganization: p.responsibleOrganization,
        projectManagerName: owner.name,
        officialContactEmail: `${p.contactSlug}@gov.kz`,
        goal: p.goal,
        scale: p.scale,
        locationId: locationIdByKey.get(p.location)!,
        startDate,
        plannedEndDate,
        actualEndDate: p.status === "FINISHED" ? plannedEndDate : null,
        fundingSources: p.fundingSources,
        infoAsOfDate: INFO_AS_OF_DATE,
        nextUpdateDate: NEXT_UPDATE_DATE,
        visibility: p.visibility ?? "PUBLISHED",
        stages: {
          create: p.stages.map((s, sortOrder) => ({
            label: s.label,
            startDate: s.start,
            endDate: s.end,
            status: s.status,
            plannedBudget: s.budget,
            sortOrder,
          })),
        },
        members: {
          create: p.members.map((m) => ({
            userId: userIdByKey.get(m.userKey)!,
            role: m.role,
          })),
        },
        kpis: {
          create: p.kpis.map((k, sortOrder) => ({
            name: k.name,
            baselineValue: k.baselineValue,
            targetValue: k.targetValue,
            unit: k.unit,
            sortOrder,
          })),
        },
        yearlyBudgets: {
          create: yearlyBudgets.map((y) => ({
            year: y.year,
            plannedAmount: y.plannedAmount,
            actualAmount: y.actualAmount,
          })),
        },
      },
    });

    for (const q of p.questions) {
      await prisma.question.create({
        data: {
          projectId: project.id,
          authorId: q.authorKey ? userIdByKey.get(q.authorKey)! : null,
          text: q.text,
          answer: q.answer,
          status: q.status,
          approvedAt: q.status === "APPROVED" ? new Date() : null,
          approvedById: q.approvedByKey ? userIdByKey.get(q.approvedByKey)! : null,
        },
      });
    }
  }

  console.log(`✅ Seeded ${USERS.length} users, ${MINISTRIES.length} ministries, ${Object.keys(LOCATIONS).length} locations, ${PROJECTS.length} projects.`);
}

main()
  .then(() => {
    console.log("🌱 Seed completed");
  })
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
