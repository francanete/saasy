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
      clientId: process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID,
      clientSecret: process.env.OPENPANEL_CLIENT_SECRET,
    });
  }
  return opInstance;
}
