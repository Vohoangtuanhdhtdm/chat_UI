import { createFileRoute } from "@tanstack/react-router";

import { Chatbot } from "../components/module/chat/Chatbot";

export const Route = createFileRoute("/about")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      {/* <UserListWithInstance /> */}
      <Chatbot />
    </div>
  );
}
