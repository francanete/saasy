"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

const SYSTEM_PROMPT = `You are a helpful assistant for Pilotes, a SaaS application.

PRICING:
- Free plan: Up to 3 projects, basic analytics, community support
- Pro Monthly: $19/month - Unlimited projects, advanced analytics, priority support
- Pro Annual: $190/year (save 17%)

SUPPORT:
- Free users: Community support
- Pro users: Priority email support

Be helpful, concise, and friendly.`;

export default function ChatPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(
      { text: input },
      {
        body: { model: "flash", system: SYSTEM_PROMPT },
      }
    );
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <h1 className="mb-4 text-2xl font-bold">AI Assistant</h1>

      {/* Messages */}
      <div className="mb-4 flex-1 space-y-4 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-muted-foreground py-8 text-center">
            Ask me anything about Pilotes - pricing, features, or support!
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg p-3 ${
              m.role === "user"
                ? "bg-primary text-primary-foreground ml-auto max-w-[80%]"
                : "bg-muted max-w-[80%]"
            }`}
          >
            {m.parts.map((part, i) =>
              part.type === "text" ? <span key={i}>{part.text}</span> : null
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about pricing, features, or support..."
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
