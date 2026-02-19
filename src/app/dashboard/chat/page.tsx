import { PaidAccessGate } from "@/components/paid-access-gate";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { History } from "lucide-react";
import { ChatInterface } from "./chat-interface";

export default function ChatPage() {
  return (
    <PaidAccessGate>
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <DashboardPageHeader
          title="AI Chat"
          subtitle="Chat with your AI assistant."
          action={{
            label: "Chat History",
            href: "/dashboard/chat",
            icon: <History className="size-4" />,
          }}
        />
        <ChatInterface />
      </div>
    </PaidAccessGate>
  );
}
