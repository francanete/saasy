export interface TourStep {
  id: string;
  title: string;
  content: string;
  selector: string;
  position: "top" | "bottom" | "left" | "right";
}

export const tourSteps: TourStep[] = [
  {
    id: "chat",
    title: "AI Chat",
    content: "Chat with AI to get help with your projects and tasks.",
    selector: "#tour-nav-chat",
    position: "right",
  },
  {
    id: "projects",
    title: "Your Projects",
    content:
      "Track all your active projects here. This is your command center.",
    selector: "#tour-stat-projects",
    position: "bottom",
  },
  {
    id: "plan",
    title: "Your Plan",
    content: "View your current subscription plan and usage limits.",
    selector: "#tour-stat-plan",
    position: "bottom",
  },
  {
    id: "quick-actions",
    title: "Quick Actions",
    content:
      "Jump into common tasks right from your dashboard. You're all set!",
    selector: "#tour-quick-actions",
    position: "top",
  },
];
