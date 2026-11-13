"use client";

import { TermsUpdateToast as UiTermsUpdateToast } from "@even/ui";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

// El aviso vive en @even/ui; aquí solo se conecta con la sesión y los textos traducidos de la app.
export default function TermsUpdateToast() {
  const t = useTranslations("Terms");
  const { isAuthenticated, profile, acknowledgeTermsUpdate } = useAuth();

  return (
    <UiTermsUpdateToast
      needsAck={isAuthenticated && !!profile?.firstName && profile?.termsStatus === "needs_update_ack"}
      onAcknowledge={acknowledgeTermsUpdate}
      title={t("updateTitle")}
      body={t("updateBody")}
      errorText={t("errorSave")}
      ctaLabel={t("updateCta")}
    />
  );
}
