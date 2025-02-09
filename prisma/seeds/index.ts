import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "url";
// Seeds
// import { seedTokens } from "./01_tokens";  // Skip - handled by token service
import { seedUsers } from "./02_users";
import { seedContests } from "./03_contests";
import { seedPortfolios } from "./04_portfolios";
import { seedAchievements } from "./05_achievements";
import { seedUserLevels } from "./06_user_levels";
import { seedContestParticipants } from "./07_contest_participants";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Starting database seeding...");

    // Skip tokens - already handled by service
    // await seedTokens();
    // console.log("✓ Tokens seeded successfully");

    await seedAchievements();
    console.log("✓ Achievements seeded successfully");

    await seedUserLevels();
    console.log("✓ User levels seeded successfully");

    await seedUsers();
    console.log("✓ Users seeded successfully");

    await seedContests();
    console.log("✓ Contests seeded successfully");

    await seedContestParticipants();
    console.log("✓ Contest participants seeded successfully");

    await seedPortfolios();
    console.log("✓ Portfolios seeded successfully");

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Check if this module is being run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
