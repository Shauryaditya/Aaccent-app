const { PrismaClient } = require("@prisma/client");

const database = new PrismaClient();

const categories = [
  "Computer Science",
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "English",
  "History",
  "Geography",
];

async function main() {
  try {
    for (const name of categories) {
      await database.category.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }

    console.log("Success");
  } catch (error) {
    console.log("Error seeding the database categories", error);
  } finally {
    await database.$disconnect();
  }
}

main();

