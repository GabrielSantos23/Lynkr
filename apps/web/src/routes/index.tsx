import { createFileRoute, Link } from "@tanstack/react-router";
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="min-h-screen bg-[#161616] text-muted-foreground flex flex-col">
      {/* Header */}
      <div className="flex justify-end items-center p-3 sm:p-5">
        <Link
          to="/login"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Login
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="flex items-center justify-start w-full max-w-xs sm:max-w-lg">
          <img
            src="/logo.png"
            alt="logo"
            className="w-8 sm:w-10 opacity-50 hover:opacity-100 transition-opacity duration-300 h-8 sm:h-10 mb-6 sm:mb-10"
          />
        </div>

        {/* Title */}
        <h1 className="text-foreground w-full text-md font-normal mb-2 sm:mb-3 max-w-xs sm:max-w-lg">
          (Basic) Bookmarks
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-sm mb-6 sm:mb-10 max-w-xs sm:max-w-lg leading-relaxed">
          A home for collecting and retrieving the most precious hyperlinks. All
          links are encrypted and stored in a secure database.
        </p>

        {/* About Section */}
        <div className="max-w-xs sm:max-w-lg text-left mb-6 sm:mb-8">
          <h3 className="text-foreground text-sm font-normal mb-2 sm:mb-3">
            About
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            Built for personal usage, designed with personal preferences.
            Bare-featured, minimal, boring interface. Auto-detect input content
            type. Render links with page metadata. Keyboard-first design.
            Animated appropriately. Loads fast. No onboarding. No tracking. No
            ads, ever.
          </p>
        </div>

        {/* Credits Section */}
        <div className="max-w-xs sm:max-w-lg text-left mb-6 sm:mb-8 w-full">
          <h3 className="text-foreground text-sm font-normal mb-2 sm:mb-3">
            Credits
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            Inspired by{" "}
            <a
              href="https://bmrks.com/"
              target="_blank"
              className="text-muted-foreground underline hover:text-foreground"
            >
              Bmrks
            </a>{" "}
            for the design and idea.
          </p>
        </div>
      </div>

      {/* Version */}
      <div className="absolute bottom-10 sm:bottom-20 left-1/2 transform -translate-x-1/2">
        <span className="text-muted-foreground text-xs">v0.0.1</span>
      </div>
    </div>
  );
}
