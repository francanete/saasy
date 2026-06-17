import { config } from "dotenv";
import { Polar } from "@polar-sh/sdk";

config({ path: ".env.local", quiet: true });

const polarServer = process.env.POLAR_SERVER;
const accessToken = process.env.POLAR_ACCESS_TOKEN;
const organizationId = process.env.POLAR_ORGANIZATION_ID;

if (polarServer !== "sandbox") {
  console.error(
    `Refusing to delete Polar customers because POLAR_SERVER is "${polarServer ?? "unset"}". Expected "sandbox".`
  );
  process.exit(1);
}

if (!accessToken) {
  console.error(
    "Refusing to delete Polar customers because POLAR_ACCESS_TOKEN is not set."
  );
  process.exit(1);
}

if (!organizationId) {
  console.error(
    "Refusing to delete Polar customers because POLAR_ORGANIZATION_ID is not set."
  );
  process.exit(1);
}

const polar = new Polar({
  accessToken,
  server: "sandbox",
});

const customers = [];
const pages = await polar.customers.list({
  organizationId,
  limit: 100,
});

for await (const page of pages) {
  customers.push(...page.result.items);
}

if (customers.length === 0) {
  console.log("No Polar sandbox customers found to delete.");
  process.exit(0);
}

console.log(`Deleting ${customers.length} Polar sandbox customer(s)...`);

let deleted = 0;
for (const customer of customers) {
  await polar.customers.delete({ id: customer.id });
  deleted += 1;
  console.log(`Deleted Polar sandbox customer ${customer.id}`);
}

console.log(`Deleted ${deleted} Polar sandbox customer(s).`);
