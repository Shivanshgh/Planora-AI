import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keep keyboard focus inside an open modal and return it to its opener on close. */
export function useDialogAccessibility(
  isOpen: boolean,
  dialogRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  initialFocusSelector?: string
): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const initialTarget = initialFocusSelector ? dialog.querySelector<HTMLElement>(initialFocusSelector) : null;
    (initialTarget ?? dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? dialog).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)]
        .filter(element => element.offsetParent !== null);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen, dialogRef, initialFocusSelector]);
}
