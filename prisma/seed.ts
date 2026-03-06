import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

async function main() {
  console.log("🌱 開始建立測試資料...\n");

  // ======================================
  // 1. 員工主檔
  // ======================================
  const staffData = [
    { name: "林小明", phone: "0912345001", skill: "FRONT" as const, perEventSalary: 2000, canDrive: true, hasOwnCar: true, notes: "資深外場領班，5年經驗" },
    { name: "陳美玲", phone: "0912345002", skill: "HOT" as const, perEventSalary: 2500, canDrive: false, hasOwnCar: false, notes: "主廚，擅長義法料理" },
    { name: "王大偉", phone: "0912345003", skill: "BOTH" as const, perEventSalary: 2200, canDrive: true, hasOwnCar: false, notes: "內外場皆可，可開大餐車" },
    { name: "張雅婷", phone: "0912345004", skill: "FRONT" as const, perEventSalary: 1800, canDrive: false, hasOwnCar: false, notes: "外場服務員，擅長擺盤" },
    { name: "李志成", phone: "0912345005", skill: "HOT" as const, perEventSalary: 2300, canDrive: true, hasOwnCar: true, notes: "熱台副主廚，可開小餐車" },
    { name: "黃淑芬", phone: "0912345006", skill: "FRONT" as const, perEventSalary: 1900, canDrive: false, hasOwnCar: false, notes: "外場，擅長酒水服務", status: "INACTIVE" as const },
    { name: "吳建宏", phone: "0912345007", skill: "HOT" as const, perEventSalary: 2100, canDrive: true, hasOwnCar: false, notes: "熱台助手，可支援前菜" },
    { name: "趙小燕", phone: "0912345008", skill: "FRONT" as const, perEventSalary: 1800, canDrive: false, hasOwnCar: false, notes: "新進外場人員" },
  ];

  const staffRecords = [];
  for (const s of staffData) {
    const staff = await prisma.staff.upsert({
      where: { phone: s.phone },
      update: {},
      create: {
        name: s.name,
        phone: s.phone,
        skill: s.skill,
        perEventSalary: s.perEventSalary,
        canDrive: s.canDrive,
        hasOwnCar: s.hasOwnCar,
        notes: s.notes,
        status: s.status || "ACTIVE",
      },
    });
    staffRecords.push(staff);
  }
  console.log(`✅ 員工主檔：${staffRecords.length} 筆`);

  // ======================================
  // 2. 場地主檔
  // ======================================
  const venueData = [
    { name: "山林小屋民宿", address: "南投縣魚池鄉日月潭路100號", contactName: "劉老闆", contactPhone: "049-2861234", equipment: "戶外花園、室內宴會廳（50人）、基本廚房設備", notes: "需提前一天到場佈置" },
    { name: "海景Villa", address: "屏東縣恆春鎮墾丁路200號", contactName: "蔡小姐", contactPhone: "08-8861234", equipment: "泳池畔露台、BBQ區、大型冰箱", notes: "夏季需準備防蚊設備" },
    { name: "城市花園會館", address: "台北市大安區信義路四段10號", contactName: "周經理", contactPhone: "02-27001234", equipment: "室內宴會廳（100人）、專業廚房、停車場", notes: "晚上10點前需結束" },
    { name: "田園莊園", address: "宜蘭縣員山鄉中山路300號", contactName: "陳園長", contactPhone: "03-9221234", equipment: "戶外草地（80人）、半開放式餐廳、冷藏室", notes: "雨天有備用室內空間" },
    { name: "溪畔別墅", address: "花蓮縣壽豐鄉溪畔路50號", contactName: "林先生", contactPhone: "03-8651234", equipment: "溪景平台、開放式廚房、大型烤爐", notes: "交通較不便，需自備食材運輸" },
  ];

  const venueRecords = [];
  for (const v of venueData) {
    const venue = await prisma.venue.create({ data: v });
    venueRecords.push(venue);
  }
  console.log(`✅ 場地主檔：${venueRecords.length} 筆`);

  // ======================================
  // 3. 供應商主檔
  // ======================================
  const supplierData = [
    { name: "好鮮食材行", category: "INGREDIENT" as const, contactPerson: "許老闆", phone: "02-25501234", taxId: "12345678", paymentTerms: "月結30天", supplierCode: "SUP-001" },
    { name: "大盤海鮮批發", category: "INGREDIENT" as const, contactPerson: "鄭先生", phone: "02-25801234", taxId: "23456789", paymentTerms: "貨到付款", supplierCode: "SUP-002" },
    { name: "優質肉品公司", category: "INGREDIENT" as const, contactPerson: "林小姐", phone: "04-23001234", taxId: "34567890", paymentTerms: "月結15天", supplierCode: "SUP-003" },
    { name: "廚藝設備租賃", category: "EQUIPMENT" as const, contactPerson: "陳經理", phone: "02-27501234", taxId: "45678901", paymentTerms: "預付", supplierCode: "SUP-004" },
    { name: "花藝工作室", category: "SERVICE" as const, contactPerson: "張設計師", phone: "0928123456", paymentTerms: "場次結束後7天", supplierCode: "SUP-005" },
  ];

  const supplierRecords = [];
  for (const s of supplierData) {
    const supplier = await prisma.supplier.create({ data: s });
    supplierRecords.push(supplier);
  }
  console.log(`✅ 供應商主檔：${supplierRecords.length} 筆`);

  // ======================================
  // 4. 銀行帳戶
  // ======================================
  const bankData = [
    { accountName: "玉山銀行營運帳戶", bankName: "玉山銀行", accountNumber: "808-1234567890", accountType: "CHECKING" as const, initialBalance: 500000, currentBalance: 500000 },
    { accountName: "零用金", bankName: "", accountNumber: "", accountType: "CASH" as const, initialBalance: 50000, currentBalance: 50000 },
    { accountName: "台新銀行備用帳戶", bankName: "台新銀行", accountNumber: "812-0987654321", accountType: "SAVINGS" as const, initialBalance: 200000, currentBalance: 200000 },
  ];

  const bankRecords = [];
  for (const b of bankData) {
    const bank = await prisma.bankAccount.create({ data: b });
    bankRecords.push(bank);
  }
  console.log(`✅ 銀行帳戶：${bankRecords.length} 筆`);

  // ======================================
  // 5. 薪資規則
  // ======================================
  const salaryRules = [
    { name: "週末加給", type: "FIXED", value: 300, condition: { dayOfWeek: [0, 6] }, priority: 1 },
    { name: "國定假日加給", type: "PERCENTAGE", value: 50, condition: { holiday: true }, priority: 2 },
    { name: "遲到扣款", type: "FIXED", value: -200, condition: { attendance: "LATE" }, priority: 3 },
  ];

  for (const r of salaryRules) {
    await prisma.salaryRule.create({ data: r });
  }
  console.log(`✅ 薪資規則：${salaryRules.length} 筆`);

  // ======================================
  // 6. 菜單品項
  // ======================================
  const menuItems = [
    { name: "松露野菇燉飯", category: "MAIN" as const, unit: "份", defaultQuantityPerPerson: 1, description: "使用新鮮黑松露與綜合菇類" },
    { name: "香煎鮭魚佐奶油醬", category: "MAIN" as const, unit: "份", defaultQuantityPerPerson: 1, description: "挪威鮭魚搭配自製奶油白醬" },
    { name: "凱薩沙拉", category: "SALAD" as const, unit: "份", defaultQuantityPerPerson: 1 },
    { name: "南瓜濃湯", category: "SOUP" as const, unit: "碗", defaultQuantityPerPerson: 1 },
    { name: "提拉米蘇", category: "DESSERT" as const, unit: "份", defaultQuantityPerPerson: 1 },
    { name: "烤牛小排", category: "MAIN" as const, unit: "份", defaultQuantityPerPerson: 1, description: "美國Prime牛小排低溫烹調" },
    { name: "焗烤龍蝦", category: "MAIN" as const, unit: "尾", defaultQuantityPerPerson: 0.5, description: "波士頓活龍蝦" },
    { name: "水果拼盤", category: "DESSERT" as const, unit: "盤", defaultQuantityPerPerson: 0.2 },
    { name: "紅酒燉牛肉", category: "MAIN" as const, unit: "份", defaultQuantityPerPerson: 1, description: "使用法國紅酒慢燉8小時" },
    { name: "煙燻鴨胸沙拉", category: "APPETIZER" as const, unit: "份", defaultQuantityPerPerson: 1 },
  ];

  const menuItemRecords = [];
  for (const m of menuItems) {
    const item = await prisma.menuItem.create({ data: m });
    menuItemRecords.push(item);
  }
  console.log(`✅ 菜單品項：${menuItemRecords.length} 筆`);

  // ======================================
  // 7. 菜單範本
  // ======================================
  const template1 = await prisma.menuTemplate.create({
    data: {
      name: "經典義法套餐 A",
      type: "ITALIAN_FRENCH",
      description: "適合婚宴及正式宴會的義法料理套餐",
      items: {
        create: [
          { menuItemId: menuItemRecords[9].id, quantity: 1, sortOrder: 1 },
          { menuItemId: menuItemRecords[3].id, quantity: 1, sortOrder: 2 },
          { menuItemId: menuItemRecords[0].id, quantity: 1, sortOrder: 3 },
          { menuItemId: menuItemRecords[1].id, quantity: 1, sortOrder: 4 },
          { menuItemId: menuItemRecords[4].id, quantity: 1, sortOrder: 5 },
        ],
      },
    },
  });

  const template2 = await prisma.menuTemplate.create({
    data: {
      name: "BBQ 燒烤套餐",
      type: "BBQ",
      description: "適合戶外派對及生日宴的燒烤套餐",
      items: {
        create: [
          { menuItemId: menuItemRecords[2].id, quantity: 1, sortOrder: 1 },
          { menuItemId: menuItemRecords[5].id, quantity: 1, sortOrder: 2 },
          { menuItemId: menuItemRecords[7].id, quantity: 0.2, sortOrder: 3 },
        ],
      },
    },
  });
  console.log(`✅ 菜單範本：2 筆`);

  // ======================================
  // 8. 活動場次（含各種狀態）
  // ======================================
  const today = new Date();
  const futureDate = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d;
  };
  const pastDate = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d;
  };

  const eventData = [
    // 已完成場次
    {
      name: "陳先生婚宴",
      date: pastDate(14),
      assemblyTime: "10:00",
      startTime: "12:00",
      mealTime: "12:30",
      venueId: venueRecords[2].id,
      location: venueRecords[2].name,
      address: "台北市大安區信義路四段10號",
      adultsCount: 80,
      childrenCount: 5,
      vegetarianCount: 8,
      contactName: "陳先生",
      contactPhone: "0933123456",
      eventType: "WEDDING" as const,
      totalAmount: 120000,
      depositAmount: 60000,
      depositMethod: "TRANSFER" as const,
      depositDate: pastDate(30),
      balanceAmount: 60000,
      balanceMethod: "TRANSFER" as const,
      balanceDate: pastDate(14),
      status: "COMPLETED" as const,
      requireBigTruck: true,
      requireSmallTruck: true,
      staffToken: generateToken(),
      menu: "煙燻鴨胸沙拉、南瓜濃湯、松露野菇燉飯、香煎鮭魚、提拉米蘇",
    },
    // 已確認未來場次
    {
      name: "王小姐生日宴",
      date: futureDate(7),
      assemblyTime: "15:00",
      startTime: "17:00",
      mealTime: "18:00",
      venueId: venueRecords[0].id,
      location: venueRecords[0].name,
      address: "南投縣魚池鄉日月潭路100號",
      adultsCount: 30,
      childrenCount: 8,
      vegetarianCount: 3,
      contactName: "王小姐",
      contactPhone: "0922456789",
      eventType: "BIRTHDAY" as const,
      totalAmount: 45000,
      depositAmount: 20000,
      depositMethod: "TRANSFER" as const,
      depositDate: pastDate(7),
      balanceAmount: 25000,
      status: "CONFIRMED" as const,
      requireBigTruck: true,
      staffToken: generateToken(),
    },
    // 待確認場次
    {
      name: "台積電尾牙",
      date: futureDate(21),
      assemblyTime: "14:00",
      startTime: "17:30",
      mealTime: "18:00",
      venueId: venueRecords[2].id,
      location: venueRecords[2].name,
      address: "台北市大安區信義路四段10號",
      adultsCount: 100,
      childrenCount: 0,
      vegetarianCount: 10,
      contactName: "張秘書",
      contactPhone: "0911222333",
      eventType: "YEAREND" as const,
      totalAmount: 200000,
      depositAmount: 100000,
      status: "PENDING" as const,
      requireBigTruck: true,
      requireSmallTruck: true,
      staffToken: generateToken(),
      notes: "需確認場地可容納人數，客戶要求有紅酒搭配",
    },
    // 已確認場次 - 本週
    {
      name: "李先生春酒",
      date: futureDate(3),
      assemblyTime: "16:00",
      startTime: "18:00",
      mealTime: "18:30",
      venueId: venueRecords[3].id,
      location: venueRecords[3].name,
      address: "宜蘭縣員山鄉中山路300號",
      adultsCount: 50,
      childrenCount: 3,
      vegetarianCount: 5,
      contactName: "李先生",
      contactPhone: "0955666777",
      eventType: "SPRING" as const,
      totalAmount: 75000,
      depositAmount: 35000,
      depositMethod: "CASH" as const,
      depositDate: pastDate(3),
      balanceAmount: 40000,
      status: "CONFIRMED" as const,
      requireBigTruck: true,
      staffToken: generateToken(),
      reminders: "客人有花生過敏，注意食材",
    },
    // 待確認場次 - 較遠
    {
      name: "許小姐企業活動",
      date: futureDate(35),
      startTime: "10:00",
      venueId: venueRecords[1].id,
      location: venueRecords[1].name,
      address: "屏東縣恆春鎮墾丁路200號",
      adultsCount: 60,
      childrenCount: 0,
      vegetarianCount: 6,
      contactName: "許小姐",
      contactPhone: "0966888999",
      eventType: "CORPORATE" as const,
      totalAmount: 90000,
      status: "PENDING" as const,
      staffToken: generateToken(),
      notes: "戶外場地，需準備遮陽帳篷",
    },
    // 已確認 - 明天
    {
      name: "林先生家族聚餐",
      date: futureDate(1),
      assemblyTime: "09:00",
      startTime: "11:30",
      mealTime: "12:00",
      venueId: venueRecords[4].id,
      location: venueRecords[4].name,
      address: "花蓮縣壽豐鄉溪畔路50號",
      adultsCount: 25,
      childrenCount: 6,
      vegetarianCount: 2,
      contactName: "林先生",
      contactPhone: "0977111222",
      eventType: "OTHER" as const,
      totalAmount: 38000,
      depositAmount: 19000,
      depositMethod: "TRANSFER" as const,
      depositDate: pastDate(5),
      balanceAmount: 19000,
      status: "CONFIRMED" as const,
      requireSmallTruck: true,
      staffToken: generateToken(),
      menu: "凱薩沙拉、南瓜濃湯、烤牛小排、紅酒燉牛肉、水果拼盤",
    },
    // 已取消
    {
      name: "劉小姐宴會（已取消）",
      date: futureDate(10),
      startTime: "17:00",
      location: "客戶自宅",
      adultsCount: 20,
      contactName: "劉小姐",
      contactPhone: "0988333444",
      eventType: "BANQUET" as const,
      totalAmount: 30000,
      depositAmount: 15000,
      depositMethod: "CASH" as const,
      depositDate: pastDate(10),
      status: "CANCELLED" as const,
      staffToken: generateToken(),
      notes: "客戶因故取消，訂金已退回",
    },
  ];

  const eventRecords = [];
  for (const e of eventData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event = await prisma.event.create({ data: e as any });
    eventRecords.push(event);
  }
  console.log(`✅ 活動場次：${eventRecords.length} 筆`);

  // ======================================
  // 9. 排班指派
  // ======================================
  const activeStaff = staffRecords.filter((s) => s.status === "ACTIVE");

  // 已完成場次 - 全員排班且已通知
  for (let i = 0; i < Math.min(5, activeStaff.length); i++) {
    await prisma.eventStaff.create({
      data: {
        eventId: eventRecords[0].id,
        staffId: activeStaff[i].id,
        role: i < 2 ? "HOT" : "FRONT",
        salary: activeStaff[i].perEventSalary,
        attendanceStatus: "COMPLETED",
        notified: true,
        notifiedAt: pastDate(20),
        confirmedAt: pastDate(18),
        vehicle: i === 0 ? "BIG_TRUCK" : i === 2 ? "SMALL_TRUCK" : null,
        isDriver: i === 0 || i === 2,
      },
    });
  }

  // 確認場次（明天）- 部分排班
  for (let i = 0; i < 4; i++) {
    await prisma.eventStaff.create({
      data: {
        eventId: eventRecords[5].id,
        staffId: activeStaff[i].id,
        role: i < 2 ? "HOT" : "FRONT",
        salary: activeStaff[i].perEventSalary,
        attendanceStatus: i < 2 ? "CONFIRMED" : "SCHEDULED",
        notified: i < 3,
        notifiedAt: i < 3 ? pastDate(2) : null,
        confirmedAt: i < 2 ? pastDate(1) : null,
        vehicle: i === 0 ? "SMALL_TRUCK" : null,
        isDriver: i === 0,
      },
    });
  }

  // 確認場次（本週）- 已排班已通知
  for (let i = 0; i < 6; i++) {
    await prisma.eventStaff.create({
      data: {
        eventId: eventRecords[3].id,
        staffId: activeStaff[i].id,
        role: i < 2 ? "HOT" : "FRONT",
        salary: activeStaff[i].perEventSalary,
        attendanceStatus: "SCHEDULED",
        notified: true,
        notifiedAt: pastDate(1),
        vehicle: i === 0 ? "BIG_TRUCK" : null,
        isDriver: i === 0,
      },
    });
  }

  // 確認場次（下週生日宴）- 已排班未通知
  for (let i = 0; i < 3; i++) {
    await prisma.eventStaff.create({
      data: {
        eventId: eventRecords[1].id,
        staffId: activeStaff[i].id,
        role: i === 0 ? "HOT" : "FRONT",
        salary: activeStaff[i].perEventSalary,
        attendanceStatus: "SCHEDULED",
        notified: false,
        vehicle: i === 0 ? "BIG_TRUCK" : null,
        isDriver: i === 0,
      },
    });
  }
  console.log(`✅ 排班指派：18 筆`);

  // ======================================
  // 10. 場次菜單
  // ======================================
  // 已完成場次 - 有鎖定菜單
  await prisma.eventMenu.create({
    data: {
      eventId: eventRecords[0].id,
      templateId: template1.id,
      templateName: "經典義法套餐 A",
      templateVersion: 1,
      lockedAt: pastDate(16),
      lockedBy: "系統管理員",
      items: {
        create: [
          { menuItemId: menuItemRecords[9].id, itemName: "煙燻鴨胸沙拉", itemCategory: "APPETIZER", itemUnit: "份", quantityPerPerson: 1, totalQuantity: 85, sortOrder: 1 },
          { menuItemId: menuItemRecords[3].id, itemName: "南瓜濃湯", itemCategory: "SOUP", itemUnit: "碗", quantityPerPerson: 1, totalQuantity: 85, sortOrder: 2 },
          { menuItemId: menuItemRecords[0].id, itemName: "松露野菇燉飯", itemCategory: "MAIN", itemUnit: "份", quantityPerPerson: 1, totalQuantity: 85, sortOrder: 3 },
          { menuItemId: menuItemRecords[1].id, itemName: "香煎鮭魚佐奶油醬", itemCategory: "MAIN", itemUnit: "份", quantityPerPerson: 1, totalQuantity: 85, sortOrder: 4 },
          { menuItemId: menuItemRecords[4].id, itemName: "提拉米蘇", itemCategory: "DESSERT", itemUnit: "份", quantityPerPerson: 1, totalQuantity: 85, sortOrder: 5 },
        ],
      },
    },
  });

  // 確認場次（本週）- 有菜單未鎖定
  await prisma.eventMenu.create({
    data: {
      eventId: eventRecords[3].id,
      templateId: template2.id,
      templateName: "BBQ 燒烤套餐",
      templateVersion: 1,
      items: {
        create: [
          { menuItemId: menuItemRecords[2].id, itemName: "凱薩沙拉", itemCategory: "SALAD", itemUnit: "份", quantityPerPerson: 1, totalQuantity: 53, sortOrder: 1 },
          { menuItemId: menuItemRecords[5].id, itemName: "烤牛小排", itemCategory: "MAIN", itemUnit: "份", quantityPerPerson: 1, totalQuantity: 53, sortOrder: 2 },
          { menuItemId: menuItemRecords[7].id, itemName: "水果拼盤", itemCategory: "DESSERT", itemUnit: "盤", quantityPerPerson: 0.2, totalQuantity: 11, sortOrder: 3 },
        ],
      },
    },
  });
  console.log(`✅ 場次菜單：2 筆`);

  // ======================================
  // 11. 收款記錄
  // ======================================
  const paymentInData = [
    { customerName: "陳先生", customerPhone: "0933123456", eventId: eventRecords[0].id, paymentDate: pastDate(30), amount: 60000, paymentMethod: "BANK_TRANSFER" as const, paymentCategory: "DEPOSIT" as const, bankAccountId: bankRecords[0].id, status: "CONFIRMED" as const, createdBy: "system", paymentNumber: "PI-20260201-001" },
    { customerName: "陳先生", customerPhone: "0933123456", eventId: eventRecords[0].id, paymentDate: pastDate(14), amount: 60000, paymentMethod: "BANK_TRANSFER" as const, paymentCategory: "FINAL_PAYMENT" as const, bankAccountId: bankRecords[0].id, status: "CONFIRMED" as const, createdBy: "system", paymentNumber: "PI-20260220-001" },
    { customerName: "王小姐", customerPhone: "0922456789", eventId: eventRecords[1].id, paymentDate: pastDate(7), amount: 20000, paymentMethod: "BANK_TRANSFER" as const, paymentCategory: "DEPOSIT" as const, bankAccountId: bankRecords[0].id, status: "CONFIRMED" as const, createdBy: "system", paymentNumber: "PI-20260227-001" },
    { customerName: "李先生", customerPhone: "0955666777", eventId: eventRecords[3].id, paymentDate: pastDate(3), amount: 35000, paymentMethod: "CASH" as const, paymentCategory: "DEPOSIT" as const, bankAccountId: bankRecords[1].id, status: "CONFIRMED" as const, createdBy: "system", paymentNumber: "PI-20260303-001" },
    { customerName: "林先生", customerPhone: "0977111222", eventId: eventRecords[5].id, paymentDate: pastDate(5), amount: 19000, paymentMethod: "BANK_TRANSFER" as const, paymentCategory: "DEPOSIT" as const, bankAccountId: bankRecords[0].id, status: "CONFIRMED" as const, createdBy: "system", paymentNumber: "PI-20260301-001" },
  ];

  for (const p of paymentInData) {
    await prisma.paymentIn.create({ data: p });
  }
  console.log(`✅ 收款記錄：${paymentInData.length} 筆`);

  // ======================================
  // 12. 付款記錄
  // ======================================
  const paymentOutData = [
    { paymentNumber: "PO-20260220-001", paymentDate: pastDate(14), amount: 10000, paymentMethod: "BANK_TRANSFER" as const, paymentCategory: "SALARY" as const, payeeType: "STAFF" as const, staffId: activeStaff[0].id, bankAccountId: bankRecords[0].id, status: "PAID" as const, createdBy: "system", approvedBy: "system", approvedAt: pastDate(14), notes: "陳先生婚宴薪資" },
    { paymentNumber: "PO-20260220-002", paymentDate: pastDate(14), amount: 12500, paymentMethod: "BANK_TRANSFER" as const, paymentCategory: "SALARY" as const, payeeType: "STAFF" as const, staffId: activeStaff[1].id, bankAccountId: bankRecords[0].id, status: "PAID" as const, createdBy: "system", approvedBy: "system", approvedAt: pastDate(14), notes: "陳先生婚宴薪資" },
    { paymentNumber: "PO-20260215-001", paymentDate: pastDate(19), amount: 35000, paymentMethod: "BANK_TRANSFER" as const, paymentCategory: "INGREDIENT" as const, payeeType: "SUPPLIER" as const, supplierId: supplierRecords[0].id, bankAccountId: bankRecords[0].id, status: "PAID" as const, createdBy: "system", invoiceNumber: "AB-12345678", notes: "陳先生婚宴食材" },
    { paymentNumber: "PO-20260215-002", paymentDate: pastDate(19), amount: 28000, paymentMethod: "BANK_TRANSFER" as const, paymentCategory: "INGREDIENT" as const, payeeType: "SUPPLIER" as const, supplierId: supplierRecords[1].id, bankAccountId: bankRecords[0].id, status: "PAID" as const, createdBy: "system", invoiceNumber: "CD-87654321", notes: "海鮮採購" },
    { paymentNumber: "PO-20260301-001", paymentDate: pastDate(5), amount: 18000, paymentMethod: "BANK_TRANSFER" as const, paymentCategory: "INGREDIENT" as const, payeeType: "SUPPLIER" as const, supplierId: supplierRecords[2].id, bankAccountId: bankRecords[0].id, status: "APPROVED" as const, createdBy: "system", approvedBy: "system", approvedAt: pastDate(4), notes: "李先生春酒肉品" },
    { paymentNumber: "PO-20260305-001", paymentDate: today, amount: 5000, paymentMethod: "CASH" as const, paymentCategory: "EQUIPMENT" as const, payeeType: "SUPPLIER" as const, supplierId: supplierRecords[3].id, bankAccountId: bankRecords[1].id, status: "PENDING" as const, createdBy: "system", notes: "租用戶外帳篷設備" },
  ];

  for (const p of paymentOutData) {
    await prisma.paymentOut.create({ data: p });
  }
  console.log(`✅ 付款記錄：${paymentOutData.length} 筆`);

  // ======================================
  // 13. 員工可用性 (本月)
  // ======================================
  let availCount = 0;
  for (const staff of activeStaff.slice(0, 5)) {
    for (let d = 1; d <= 28; d++) {
      const date = new Date(today.getFullYear(), today.getMonth(), d);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      // 80% available on weekdays, 90% on weekends
      const available = Math.random() < (isWeekend ? 0.9 : 0.8);
      await prisma.staffAvailability.create({
        data: {
          staffId: staff.id,
          date,
          available,
          reason: available ? null : "個人事由",
        },
      });
      availCount++;
    }
  }
  console.log(`✅ 員工可用性：${availCount} 筆`);

  console.log("\n🎉 測試資料建立完成！");
  console.log("========================================");
  console.log(`  員工：${staffRecords.length} 筆`);
  console.log(`  場地：${venueRecords.length} 筆`);
  console.log(`  供應商：${supplierRecords.length} 筆`);
  console.log(`  銀行帳戶：${bankRecords.length} 筆`);
  console.log(`  薪資規則：${salaryRules.length} 筆`);
  console.log(`  菜單品項：${menuItemRecords.length} 筆`);
  console.log(`  菜單範本：2 筆`);
  console.log(`  活動場次：${eventRecords.length} 筆`);
  console.log(`  排班指派：18 筆`);
  console.log(`  場次菜單：2 筆`);
  console.log(`  收款記錄：${paymentInData.length} 筆`);
  console.log(`  付款記錄：${paymentOutData.length} 筆`);
  console.log(`  員工可用性：${availCount} 筆`);
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error("❌ 建立測試資料失敗:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
