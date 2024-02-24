/**
 * Types used in the application.
 *
 * @module @src/types
 */

/**
 * The categories of alert.
 */
export const ALERT_VARIANTS = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
export type AlertVariant = (typeof ALERT_VARIANTS)[number];

/**
 * The type to aid in the rendering of the alert.
 */
export interface AlertBody {
	body: JSX.Element;
	variant: AlertVariant;
}

/**
 * The type definition for flash messages.
 */
export interface FlashMessage {
	message: string;
	variant: AlertVariant;
}
