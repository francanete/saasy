import { OpenPanel } from "@openpanel/nextjs";

let opInstance: OpenPanel | null = null;

export function getOpenPanelClient(): OpenPanel {
  if (!opInstance) {
    if (typeof window !== "undefined") {
      throw new Error(
        "OpenPanel server client should only be used on the server side"
      );
    }

    opInstance = new OpenPanel({
      clientId: process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!,
      clientSecret: process.env.OPENPANEL_CLIENT_SECRET!,
    });
  }
  return opInstance;
}

export async function trackEvent(
  name: string,
  properties: Record<string, unknown> & { profileId?: string }
): Promise<void> {
  try {
    await getOpenPanelClient().track(name, properties);
  } catch (e) {
    console.error(`[analytics] ${name}:`, e);
  }
}

export async function trackRevenue(
  amount: number,
  properties: Record<string, unknown> & { profileId?: string }
): Promise<void> {
  try {
    await getOpenPanelClient().revenue(amount, properties);
  } catch (e) {
    console.error(`[analytics] revenue:`, e);
  }
}
