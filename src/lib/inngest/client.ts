import { Inngest, EventSchemas } from "inngest";

export const inngest = new Inngest({
  id: "saasy",
  schemas: new EventSchemas().fromRecord<{
    "user/created": { data: { userId: string; email: string } };
    "email/welcome": { data: { userId: string; email: string; name: string } };
    "subscription/changed": { data: { userId: string; plan: string } };
  }>(),
});
