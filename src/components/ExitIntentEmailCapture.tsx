"use client";

import { useEffect, useMemo, useState } from "react";

import EmailCaptureModal from "@/components/EmailCaptureModal";
import { getCookie, setCookie } from "@/lib/cookies";

const SUBSCRIBED_COOKIE = "bh_email_subscribed";

function isSubscribed() {
  return getCookie(SUBSCRIBED_COOKIE) === "1";
}

export default function ExitIntentEmailCapture() {
  const [open, setOpen] = useState(false);

  const shouldDisable = useMemo(() => isSubscribed(), []);

  useEffect(() => {
    if (shouldDisable) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("bh_exit_popup_shown") === "1") return;

    const markShown = () => sessionStorage.setItem("bh_exit_popup_shown", "1");

    const onMouseOut = (e: MouseEvent) => {
      if (e.relatedTarget !== null) return;
      if (e.clientY > 10) return;
      markShown();
      setOpen(true);
    };

    const coarse =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(pointer: coarse)").matches
        : false;

    let popstateArmed = false;
    const onPopState = () => {
      if (popstateArmed) {
        markShown();
        setOpen(true);
        history.pushState({ bhExit: true }, "");
      }
    };

    const armPopState = () => {
      if (popstateArmed) return;
      popstateArmed = true;
      history.pushState({ bhExit: true }, "");
      window.addEventListener("popstate", onPopState);
    };

    if (coarse) {
      armPopState();
    } else {
      window.addEventListener("mouseout", onMouseOut);
    }

    return () => {
      window.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("popstate", onPopState);
    };
  }, [shouldDisable]);

  return (
    <EmailCaptureModal
      open={open}
      onClose={() => setOpen(false)}
      title="Wait! Don't leave empty handed 👀"
      description="Drop your email & be first to know about our next sale!"
      ctaLabel="Get Updates"
      source="exit"
      onSuccess={() => {
        setCookie(SUBSCRIBED_COOKIE, "1", 365);
        setOpen(false);
      }}
    />
  );
}

