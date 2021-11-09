import { BigNumber } from "@payvo/helpers";
import { CURRENCIES, Money, Numeral } from "@payvo/intl";

import { CurrenciesMap, DEFAULT_DECIMALS, FormatParameters } from "./Amount.contracts";

const getDecimalsByTicker = (ticker: string): number =>
	(CURRENCIES as CurrenciesMap)[ticker]?.decimals ?? DEFAULT_DECIMALS;

const formatCrypto = ({ locale, value, ticker }: FormatParameters): string => {
	const decimals = getDecimalsByTicker(ticker);

	const numeral = Numeral.make(locale as string, {
		currencyDisplay: "name",
		maximumFractionDigits: decimals,
		minimumFractionDigits: 0,
	});

	// Intl.NumberFormat throws error for some tickers like DARK
	// so format as BTC then replace
	return numeral.formatAsCurrency(value, "BTC").replace("BTC", ticker.toUpperCase());
};

const formatFiat = ({ value, ticker }: FormatParameters): string => {
	const decimals = getDecimalsByTicker(ticker);

	const cents = BigNumber.make(value).times(Math.pow(10, decimals)).decimalPlaces(0).toNumber();
	const money = Money.make(cents, ticker);

	return money.format();
};

const formatWithSign = (amount: string, isNegative: boolean): string => {
	const sign = isNegative ? "-" : "+";
	return `${sign} ${amount}`;
};

export { formatCrypto, formatFiat, formatWithSign, getDecimalsByTicker };
