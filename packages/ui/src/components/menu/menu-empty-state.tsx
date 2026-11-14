import type { ReactNode } from "react";

export type MenuEmptyStateProps = { message: ReactNode };

/** Sin resultados o sin platillos disponibles. */
export function MenuEmptyState({ message }: MenuEmptyStateProps) {
  return (
    <div role="status" className="py-10 text-center md:py-16">
      <p className="text-base text-text-subtle md:text-lg lg:text-xl">{message}</p>
    </div>
  );
}
