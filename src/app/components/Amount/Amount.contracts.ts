import { CURRENCIES } from "@payvo/intl";

const DEFAULT_DECIMALS = 8;

type CurrencyKey = keyof typeof CURRENCIES;

interface AmountProperties {
	ticker: string;
	value: number;
	showSign?: boolean;
	showTicker?: boolean;
	isNegative?: boolean;
	locale?: string;
	className?: string;
}

interface AmountLabelProperties {
	isCompact?: boolean;
	isNegative: boolean;
	value: number;
	ticker: string;
	hint?: string;
}

interface FormatParameters {
	locale?: string;
	value: number;
	ticker: string;
}

interface Currency {
	symbol: string;
	decimals: number;
}

type CurrenciesMap = Record<string, Currency | undefined>;

export { DEFAULT_DECIMALS };

export type { AmountLabelProperties, AmountProperties, CurrenciesMap, CurrencyKey, FormatParameters };
