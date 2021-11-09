import { DropdownOption } from "app/components/Dropdown";
import { NavbarVariant } from "types";

export interface NavigationBarMenuItem {
	title: string;
	mountPath: ((profileId: string) => string) | (() => string);
}

export interface NavigationBarProperties {
	title?: string;
	isBackDisabled?: boolean;
	variant?: NavbarVariant;
}

export interface UserInfoProperties {
	avatarImage: string;
	onUserAction: (option: DropdownOption) => void;
	userInitials?: string;
}

export interface NavigationBarLogoOnlyProperties {
	title?: string;
}

export interface NavigationBarFullProperties {
	title?: string;
	isBackDisabled?: boolean;
}
