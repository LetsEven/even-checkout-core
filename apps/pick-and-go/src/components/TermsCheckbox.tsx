"use client";

import { TermsCheckbox as UiTermsCheckbox, termsLinks } from "@even/ui";
import { useTranslations } from "next-intl";

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  variant?: "dark" | "light";
}

// El componente visual vive en @even/ui; aquí solo se le pone el texto traducido de la app.
export default function TermsCheckbox(props: TermsCheckboxProps) {
  const t = useTranslations("Terms");
  return <UiTermsCheckbox {...props} label={(linkClass) => t.rich("checkbox", termsLinks(linkClass))} />;
}
