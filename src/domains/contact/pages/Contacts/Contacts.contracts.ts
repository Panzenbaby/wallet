export interface ContactsHeaderExtraProperties {
	showSearchBar: boolean;
	onSearch?: (query: string) => void;
	onAddContact?: () => void;
}
