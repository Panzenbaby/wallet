import { Contracts } from "@payvo/sdk-profiles";
import { renderHook } from "@testing-library/react-hooks";
import { createMemoryHistory } from "history";
import React from "react";
import { Router } from "react-router-dom";
import { env, getDefaultProfileId } from "utils/testing-library";
import { DropdownOption } from "@/app/components/Dropdown";
import { ConfigurationProvider, EnvironmentProvider } from "@/app/contexts";
import * as useActiveProfileModule from "@/app/hooks/env";
import { useWalletActions } from "@/domains/wallet/hooks/use-wallet-actions";

describe("useWalletActions", () => {
	const history = createMemoryHistory();

	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;

	const wrapper = ({ children }) => (
		<Router history={history}>
			<EnvironmentProvider env={env}>
				<ConfigurationProvider>{children}</ConfigurationProvider>
			</EnvironmentProvider>
		</Router>
	);

	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().first();

		jest.spyOn(useActiveProfileModule, "useActiveProfile").mockReturnValue(profile);
	});

	it("should return undefined if there is no wallet", async () => {
		const {
			result: { current },
		} = renderHook(() => useWalletActions(), { wrapper });

		expect(current.handleOpen()).toBeUndefined();
		expect(current.handleSend()).toBeUndefined();
		await expect(current.handleToggleStar()).resolves.toBeUndefined();
		await expect(current.handleDelete()).resolves.toBeUndefined();
		expect(current.handleConfirmEncryptionWarning()).toBeUndefined();
		expect(current.handleSelectOption({} as DropdownOption)).toBeUndefined();
	});

	it("should push right urls to history", () => {
		const {
			result: { current },
		} = renderHook(() => useWalletActions(wallet), { wrapper });

		current.handleCreate();

		expect(history.location.pathname).toBe(`/profiles/${profile.id()}/wallets/create`);

		current.handleImport();

		expect(history.location.pathname).toBe(`/profiles/${profile.id()}/wallets/import`);

		current.handleImportLedger();

		expect(history.location.pathname).toBe(`/profiles/${profile.id()}/wallets/import`);
		expect(history.location.search).toBe(`?ledger=true`);

		current.handleConfirmEncryptionWarning();

		expect(history.location.pathname).toBe(
			`/profiles/${profile.id()}/wallets/${wallet.id()}/send-registration/secondSignature`,
		);
	});
});
