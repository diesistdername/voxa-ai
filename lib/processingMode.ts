/**
 * Processing Mode constants and helpers.
 *
 * A block is "highlighted" when its BlockNote `backgroundColor` prop equals
 * HIGHLIGHT_BG_VALUE. The matching CSS is defined in app/globals.css.
 */

export const HIGHLIGHT_BG_VALUE = "yellow" as const;

/** Returns true when a block's backgroundColor prop is set to the highlight value. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isHighlighted(block: any): boolean {
  return block?.props?.backgroundColor === HIGHLIGHT_BG_VALUE;
}
