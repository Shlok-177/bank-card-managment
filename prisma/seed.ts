import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@12345", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@bankpayout.local" },
    update: {},
    create: {
      email: "admin@bankpayout.local",
      name: "System Administrator",
      passwordHash,
      role: UserRole.SUPER_ADMIN
    }
  });

  const mappings = [
    { internalField: "month", aliases: ["Month"], required: true },
    { internalField: "dsa", aliases: ["DSA"], required: false },
    { internalField: "applicationNo", aliases: ["Appl Ref No", "Application NO", "Ref No", "Application No"], required: true },
    { internalField: "customerName", aliases: ["Cust Name", "Customer Name"], required: true },
    { internalField: "cardType", aliases: ["Card Type"], required: false },
    { internalField: "bank", aliases: ["Bank"], required: true },
    { internalField: "userName", aliases: ["USER NAME", "User Name"], required: false },
    { internalField: "dseName", aliases: ["DSE Name", "DSE"], required: false },
    { internalField: "payout96", aliases: ["96%", "96"], required: true },
    { internalField: "given", aliases: ["GIVEN", "Given"], required: true }
  ];

  for (const mapping of mappings) {
    await prisma.columnMapping.upsert({
      where: { tenantId_internalField: { tenantId: "default", internalField: mapping.internalField } },
      update: mapping,
      create: { tenantId: "default", ...mapping }
    });
  }

  for (const rule of [
    { bank: "HDFC Bank", formula: { type: "difference", expression: "payout96 - given" } },
    { bank: "ICICI Bank", formula: { type: "difference", expression: "payout96 - given" } },
    { bank: "Axis Bank", formula: { type: "difference", expression: "payout96 - given" } }
  ]) {
    await prisma.bankRule.upsert({
      where: { id: `${rule.bank.toLowerCase().replace(/\s+/g, "-")}-default-rule` },
      update: {},
      create: {
        id: `${rule.bank.toLowerCase().replace(/\s+/g, "-")}-default-rule`,
        bank: rule.bank,
        formula: rule.formula
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "seed.completed",
      entity: "system",
      metadata: { defaultLogin: "admin@bankpayout.local" }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
