import { createFileRoute } from "@tanstack/react-router";

import { Chatbot } from "../components/module/chat/Chatbot";

export const Route = createFileRoute("/about")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <div className="min-h-screen w-full relative">
        {/* Radial Gradient Background from Bottom */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(125% 125% at 50% 90%, #fff 40%, #6366f1 100%)",
          }}
        />
        <div className="absolute z-10 inset-0 m-10">
          <Chatbot />
        </div>
      </div>
    </div>
  );
}
