import { ExtendedSerializedPluginConfigurationData } from "plugins";

export interface PluginUpdatesConfirmationProperties {
	isOpen: boolean;
	plugins: ExtendedSerializedPluginConfigurationData[];
	onClose?: () => void;
	onContinue?: () => void;
}
