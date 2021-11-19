import { Contracts } from "@payvo/sdk-profiles";
import { PluginService } from "plugins/core";
import { PluginHooks } from "plugins/core/internals";
import { PluginServiceConfig, PluginServiceIdentifier } from "plugins/types";

export class ProfilePluginService implements PluginService {
	#profile: Contracts.IProfile | undefined;

	config(): PluginServiceConfig {
		return {
			accessor: "profile",
			id: PluginServiceIdentifier.Profile,
		};
	}

	boot(context: { hooks: PluginHooks }): void {
		context.hooks.onProfileChange((profile) => (this.#profile = profile));
	}

	api(): Record<string, Function> {
		return {
			exchangeCurrency: () =>
				this.#profile
					?.settings()
					.get(Contracts.ProfileSetting.ExchangeCurrency),
			id: () => this.#profile?.id(),
			locale: () =>
				this.#profile
					?.settings()
					.get(Contracts.ProfileSetting.Locale),
			// TODO: return ReadOnlyWallet[]
			wallets: () =>
				this.#profile
					?.wallets()
					.values()
					.map((wallet) => wallet.toObject()),
		};
	}
}
