import { Contracts, DTO } from "@payvo/profiles";

export interface TransactionTableProperties {
	transactions: DTO.ExtendedConfirmedTransactionData[];
	exchangeCurrency?: string;
	hideHeader?: boolean;
	onRowClick?: (row: DTO.ExtendedConfirmedTransactionData) => void;
	isLoading?: boolean;
	skeletonRowsLimit?: number;
	profile: Contracts.IProfile;
}
