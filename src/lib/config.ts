export const appConfig = {
  name: "Saasy",
  email: {
    from: "noreply@simplesubscriber.com",
  },
  pricing: {
    mode: "subscription" as const, // "subscription" | "ltd"
  },
} as const;
