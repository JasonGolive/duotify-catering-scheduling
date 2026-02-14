import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Seed staff members
  const staffData = [
    {
      name: "Alice Johnson",
      phone: "5551234567",
      perEventSalary: 150.0,
      status: "ACTIVE",
      notes: "Experienced server with 5+ years in catering",
    },
    {
      name: "Bob Wilson",
      phone: "5559876543",
      perEventSalary: 200.0,
      status: "ACTIVE",
      notes: "Head chef specializing in Asian cuisine",
    },
    {
      name: "Carol Davis",
      phone: "5555555555",
      perEventSalary: 175.0,
      status: "INACTIVE",
      notes: "On leave until further notice",
    },
    {
      name: "David Martinez",
      phone: "5551112222",
      perEventSalary: 160.0,
      status: "ACTIVE",
      notes: "Bartender and mixologist",
    },
    {
      name: "Emma Thompson",
      phone: "5553334444",
      perEventSalary: 140.0,
      status: "ACTIVE",
      notes: "Event coordinator and setup specialist",
    },
    {
      name: "Frank Chen",
      phone: "5556667777",
      perEventSalary: 180.0,
      status: "ACTIVE",
      notes: "Sous chef with pastry experience",
    },
    {
      name: "Grace Kim",
      phone: "5558889999",
      perEventSalary: 145.0,
      status: "ACTIVE",
      notes: "Server and hostess",
    },
    {
      name: "Henry Brown",
      phone: "5552223333",
      perEventSalary: 190.0,
      status: "INACTIVE",
      notes: "Retired, available for special occasions",
    },
  ];

  for (const staff of staffData) {
    await prisma.staff.create({
      data: staff,
    });
  }

  console.log("✅ Seeded 8 staff members");
  console.log("🎉 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
