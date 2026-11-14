// Primitivas de UI compartidas por las apps de Even. El tema de Tailwind vive en "@even/ui/theme.css".
export const PACKAGE_NAME = "@even/ui";

export { brandColors } from "./lib/colors";
export { cn } from "./lib/cn";
export { lockScroll, unlockScroll } from "./lib/scroll-lock";
export { useScrollLock } from "./lib/use-scroll-lock";
export { useModalBackClose } from "./lib/use-modal-back-close";
export { rememberMenuPosition, setMenuCategory, takeMenuPosition, type MenuPosition } from "./lib/menu-scroll-memory";

export { Badge, type BadgeProps } from "./components/badge";
export { Button, buttonClasses, type ButtonProps, type ButtonSize, type ButtonVariant } from "./components/button";
export { Card, type CardProps } from "./components/card";
export { Checkbox, Radio, type CheckboxProps, type RadioProps } from "./components/choice";
export { EvenAsterisk, type EvenAsteriskProps } from "./components/even-asterisk";
export { Input, Textarea, type InputProps, type TextareaProps } from "./components/field";
export { IconButton, type IconButtonProps } from "./components/icon-button";
export {
  Container,
  Screen,
  Stack,
  type ContainerProps,
  type ScreenProps,
  type StackProps,
} from "./components/layout";
export { FullScreenLoader, type FullScreenLoaderProps } from "./components/loader";
export { Modal, type ModalProps } from "./components/modal";
export {
  PRIVACY_URL,
  TERMS_URL,
  TermsCheckbox,
  termsLinks,
  type TermsCheckboxProps,
} from "./components/terms-checkbox";
export { TermsUpdateToast, type TermsUpdateToastProps } from "./components/terms-update-toast";
export { Spinner, type SpinnerProps } from "./components/spinner";
export {
  DAY_KEYS,
  DETAIL_ANIMATION_MS,
  RestaurantDetailSheet,
  type DayKey,
  type RestaurantDetailLabels,
  type RestaurantDetailSheetProps,
  type RestaurantHours,
} from "./components/menu/restaurant-detail-sheet";
export {
  INTRO_FLY_MS,
  INTRO_SHOW_MS,
  RestaurantIntro,
  useRestaurantIntro,
  type IntroPhase,
  type RestaurantIntroLabels,
  type RestaurantIntroProps,
  type UseRestaurantIntroOptions,
} from "./components/menu/restaurant-intro";
export {
  MenuActions,
  MenuActionsPill,
  MenuHamburger,
  PillButton,
  PillCartButton,
  PillOrderButton,
  PillPepperButton,
  UserAvatar,
  type MenuActionsPillProps,
  type MenuActionsProps,
  type MenuHamburgerProps,
  type PillButtonProps,
  type PillPepperButtonProps,
  type UserAvatarProps,
} from "./components/menu/menu-actions-pill";
export { CategoryTabs, type CategoryTab, type CategoryTabsProps } from "./components/menu/category-tabs";
export { FloatingCartButton, type FloatingCartButtonProps } from "./components/menu/floating-cart-button";
export { MenuEmptyState, type MenuEmptyStateProps } from "./components/menu/menu-empty-state";
export { MenuProductCard, type MenuProductCardProps } from "./components/menu/menu-product-card";
export { MenuRestaurantHeading, type MenuRestaurantHeadingProps } from "./components/menu/menu-restaurant-heading";
export { MenuSearchInput, type MenuSearchInputProps } from "./components/menu/menu-search-input";
export { QuantityStepper, type QuantityStepperProps } from "./components/menu/quantity-stepper";
