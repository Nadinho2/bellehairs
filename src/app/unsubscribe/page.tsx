import { Suspense } from "react";

import UnsubscribeClient from "@/app/unsubscribe/unsubscribe-client";

export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <UnsubscribeClient />
    </Suspense>
  );
}

