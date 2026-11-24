"use client";

import {
  ClerkLoaded,
  ClerkLoading,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

/**
 * Header auth controls. A client component so it follows Clerk's live session:
 * signing in, signing up, or signing out in the modal updates it with no refresh.
 */
export function HeaderAuth() {
  return (
    <div className="ml-auto flex items-center gap-3 sm:gap-5">
      <ClerkLoading>
        <div aria-hidden="true" className="h-10 sm:h-13" />
      </ClerkLoading>
      <ClerkLoaded>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button
              type="button"
              className={buttonClasses({ variant: "text", className: "text-body-lg" })}
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button type="button" className={buttonClasses({ size: "md", className: "text-body-lg" })}>
              Sign up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          {/* Presentational only (AGENTS.md §7). */}
          <button
            type="button"
            aria-label="Notifications"
            className="flex size-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-primary-400"
          >
            <Bell className="size-6" strokeWidth={1.5} aria-hidden="true" />
          </button>
          <UserButton
            appearance={{
              elements: { avatarBox: "size-10 sm:size-13" },
            }}
          />
        </Show>
      </ClerkLoaded>
    </div>
  );
}
