import { pgTable, text, timestamp, boolean, serial, integer, doublePrecision, jsonb } from "drizzle-orm/pg-core"

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  // App-specific fields managed via Better Auth additionalFields
  role: text("role").notNull().default("user"), // "admin" | "user"
  phone: text("phone"),
  username: text("username").unique(),
  displayUsername: text("displayUsername"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// --- Fuel domain -----------------------------------------------------------

// أنواع الوقود
export const fuelTypes = pgTable("fuel_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // سولار / بنزين 80 / بنزين 92
  tonToLiter: doublePrecision("ton_to_liter").notNull().default(1200), // معامل التحويل
  minAlertLevel: doublePrecision("min_alert_level").default(0), // حد التنبيه الأدنى
  criticalAlertPercent: doublePrecision("critical_alert_percent").default(10),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// المحطات
export const stations = pgTable("stations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// الخزانات
export const tanks = pgTable("tanks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  stationId: integer("station_id").notNull(),
  fuelTypeId: integer("fuel_type_id").notNull(),
  capacityTon: doublePrecision("capacity_ton").notNull().default(0),
  capacityLiter: doublePrecision("capacity_liter").notNull().default(0),
  currentBalance: doublePrecision("current_balance").notNull().default(0), // باللتر
  minAlertLevel: doublePrecision("min_alert_level").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// وارد الوقود
export const fuelSupplies = pgTable("fuel_supplies", {
  id: serial("id").primaryKey(),
  documentNumber: integer("document_number"), // رقم المستند (سنوي)
  invoiceNumber: text("invoice_number"),
  supplierCompany: text("supplier_company"),
  fuelTypeId: integer("fuel_type_id").notNull(),
  totalQuantity: doublePrecision("total_quantity").notNull(), // إجمالي الكمية الواردة باللتر
  unitPrice: doublePrecision("unit_price").notNull().default(0),
  totalPrice: doublePrecision("total_price").notNull().default(0), // مجموع (الكمية × السعر) لجميع المحطات
  date: timestamp("date").notNull().defaultNow(),
  userId: text("userId").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// توزيع وارد الوقود على المحطات
export const fuelSupplyDistributions = pgTable("fuel_supply_distributions", {
  id: serial("id").primaryKey(),
  supplyId: integer("supply_id").notNull().references(() => fuelSupplies.id, { onDelete: "cascade" }),
  stationId: integer("station_id").notNull().references(() => stations.id),
  tankId: integer("tank_id").notNull().references(() => tanks.id),
  quantity: doublePrecision("quantity").notNull(), // الكمية الموزعة لهذه المحطة باللتر
  importNumber: integer("import_number").notNull(), // رقم التوريدة (متسلسل لكل محطة)
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// استهلاك الوقود
export const fuelConsumption = pgTable("fuel_consumption", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  stationId: integer("station_id").notNull(),
  tankId: integer("tank_id").notNull(),
  fuelTypeId: integer("fuel_type_id").notNull(),
  quantity: doublePrecision("quantity").notNull(), // باللتر
  notes: text("notes"),
  userId: text("userId").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// قياسات الخزانات الفعلية
export const tankMeasurements = pgTable("tank_measurements", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  stationId: integer("station_id").notNull(),
  tankId: integer("tank_id").notNull(),
  actualQuantity: doublePrecision("actual_quantity").notNull(),
  theoreticalQuantity: doublePrecision("theoretical_quantity").notNull().default(0),
  difference: doublePrecision("difference").notNull().default(0),
  status: text("status").default("matched"), // matched | acceptable | review
  notes: text("notes"),
  userId: text("userId").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// العهدة اليومية
export const dailyBalances = pgTable("daily_balances", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  stationId: integer("station_id").notNull(),
  fuelTypeId: integer("fuel_type_id").notNull(),
  openingBalance: doublePrecision("opening_balance").notNull().default(0),
  totalSupply: doublePrecision("total_supply").notNull().default(0),
  totalConsumption: doublePrecision("total_consumption").notNull().default(0),
  theoreticalClosing: doublePrecision("theoretical_closing").notNull().default(0),
  actualClosing: doublePrecision("actual_closing").notNull().default(0),
  difference: doublePrecision("difference").notNull().default(0),
  notes: text("notes"),
  userId: text("userId").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// --- Oil domain ------------------------------------------------------------

// أصناف الزيوت
export const oils = pgTable("oils", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull().default("عبوة"), // عبوة / لتر / كيلو / كرتونة / برميل
  packsPerCarton: integer("packs_per_carton").default(0),
  barrelQuantity: doublePrecision("barrel_quantity").default(0),
  currentBalance: doublePrecision("current_balance").notNull().default(0),
  minAlertLevel: doublePrecision("min_alert_level").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// توريدات الزيوت
export const oilSupplies = pgTable("oil_supplies", {
  id: serial("id").primaryKey(),
  oilId: integer("oil_id").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  price: doublePrecision("price").notNull().default(0),
  supplier: text("supplier"),
  invoiceNumber: text("invoice_number"),
  date: timestamp("date").notNull().defaultNow(),
  notes: text("notes"),
  userId: text("userId"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// الجهات المستهلكة
export const consumers = pgTable("consumers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type"), // ورشة صيانة / مركز خدمة / وحدة فنية
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// معدلات استهلاك الزيوت
export const oilConsumptionRates = pgTable("oil_consumption_rates", {
  id: serial("id").primaryKey(),
  consumerId: integer("consumer_id").notNull(),
  oilId: integer("oil_id").notNull(),
  rate: doublePrecision("rate").notNull().default(0),
  unit: text("unit").notNull().default("عبوة"),
  period: text("period").notNull().default("monthly"), // weekly | monthly
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// صرف الزيوت
export const oilTransactions = pgTable("oil_transactions", {
  id: serial("id").primaryKey(),
  serialNumber: integer("serial_number"),
  date: timestamp("date").notNull().defaultNow(),
  oilId: integer("oil_id").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  consumerId: integer("consumer_id").notNull(),
  dispenserName: text("dispenser_name"),
  receiverName: text("receiver_name"),
  receiverRank: text("receiver_rank"),
  notes: text("notes"),
  userId: text("userId").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// --- System ----------------------------------------------------------------

// التنبيهات
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message"),
  level: text("level").notNull().default("low"), // low | medium | high | critical
  category: text("category"), // fuel | oil | measurement | consumption
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// الإعدادات العامة (Key-Value)
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: text("updated_by"),
})

// سجل العمليات
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: text("userId"),
  userName: text("user_name"),
  action: text("action").notNull(), // create | update | delete | login | logout
  tableName: text("table_name"),
  recordId: text("record_id"),
  beforeData: jsonb("before_data"),
  afterData: jsonb("after_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// المرفقات
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  storedFileName: text("stored_file_name").notNull(),
  fileExtension: text("file_extension"),
  fileSize: integer("file_size"),
  filePath: text("file_path"),
  relatedTable: text("related_table"),
  relatedRecordId: text("related_record_id"),
  uploadedBy: text("uploaded_by"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
})
