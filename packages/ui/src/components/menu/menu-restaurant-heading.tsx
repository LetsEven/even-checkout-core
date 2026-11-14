import type { ReactNode } from "react";

export type MenuRestaurantHeadingProps = {
  name: string;
  /** "Mesa 12", "Habitación 40"; se omite si no aplica (Pick & Go). */
  subtitle?: ReactNode;
  /** Chips de estatus/reordenar debajo del nombre. */
  actions?: ReactNode;
};

/** Nombre del restaurante con mesa/habitación, y acciones rápidas debajo. */
export function MenuRestaurantHeading({ name, subtitle, actions }: MenuRestaurantHeadingProps) {
  return (
    <>
      <div className="mt-3 mb-2 w-full px-2 md:mt-6 md:mb-4 md:px-4">
        <h2 className="line-clamp-2 text-balance text-center text-2xl font-semibold leading-tight tracking-tight text-black md:text-4xl">
          {name}
        </h2>
        {subtitle && <p className="mt-1 text-center text-base text-tone-600 md:text-xl">{subtitle}</p>}
      </div>
      {actions && <div className="mx-auto mb-2 flex w-fit gap-2 md:mb-4">{actions}</div>}
    </>
  );
}
