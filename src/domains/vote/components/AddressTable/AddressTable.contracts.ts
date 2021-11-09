import { Contracts } from "@payvo/profiles";

export interface AddressTableProperties {
	wallets: Contracts.IReadWriteWallet[];
	onSelect?: (address: string, network: string) => void;
	isCompact?: boolean;
}
