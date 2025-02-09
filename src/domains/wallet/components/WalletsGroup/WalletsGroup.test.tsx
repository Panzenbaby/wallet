import React, { useRef } from "react";
import userEvent from "@testing-library/user-event";
import { Contracts } from "@payvo/sdk-profiles";
import { createMemoryHistory } from "history";
import { env, getDefaultProfileId, render, screen, syncDelegates, waitFor, within } from "utils/testing-library";
import { renderHook } from "@testing-library/react-hooks";
import { Route } from "react-router-dom";
import { PortfolioHeader } from "@/domains/wallet/components/PortfolioHeader";
import * as envHooks from "@/app/hooks/env";
import * as configurationModule from "@/app/contexts/Configuration/Configuration";
import { translations as commonTranslations } from "@/app/i18n/common/i18n";
import { translations as walletTranslations } from "@/domains/wallet/i18n";
import * as useDisplayWallets from "@/domains/wallet/hooks/use-display-wallets";
import { GroupNetworkTotal } from "@/domains/wallet/components/WalletsGroup/WalletsGroup.blocks";
import { UseDisplayWallets } from "@/domains/wallet/hooks/use-display-wallets.contracts";
import { WalletsGroupsList } from "@/domains/wallet/components/WalletsGroup/WalletsGroupsList";
import { WalletsGroup } from "@/domains/wallet/components/WalletsGroup/WalletsGroup";
import * as useThemeHook from "@/app/hooks/use-theme";

const dashboardURL = `/profiles/${getDefaultProfileId()}/dashboard`;
const history = createMemoryHistory();

describe("WalletsGroup", () => {
	let profile: Contracts.IProfile;
	let wallets: Contracts.IReadWriteWallet[];
	let mainnetWallet: Contracts.IReadWriteWallet;

	let duplicateWallets: Contracts.IReadWriteWallet[];

	let useDisplayWalletsResult: Partial<ReturnType<UseDisplayWallets>>;
	let useDisplayWalletsSpy: jest.SpyInstance;

	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());

		history.push(dashboardURL);

		mainnetWallet = await profile.walletFactory().fromAddress({
			address: "AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX",
			coin: "ARK",
			network: "ark.mainnet",
		});

		profile.wallets().push(mainnetWallet);
		wallets = profile.wallets().valuesWithCoin();

		await syncDelegates(profile);

		duplicateWallets = [mainnetWallet];
		for (const _ of Array.from({ length: 12 })) {
			duplicateWallets.push(wallets[0]);
		}

		jest.spyOn(envHooks, "useActiveProfile").mockReturnValue(profile);
	});

	beforeEach(() => {
		history.push(dashboardURL);

		useDisplayWalletsResult = {
			filteredWalletsGroupedByNetwork: [
				[mainnetWallet.network(), [mainnetWallet]],
				[wallets[0].network(), duplicateWallets],
			],
			hasWalletsMatchingOtherNetworks: false,
		};

		useDisplayWalletsSpy = jest.spyOn(useDisplayWallets, "useDisplayWallets").mockReturnValue({
			...useDisplayWalletsResult,
			availableWallets: duplicateWallets,
		} as ReturnType<UseDisplayWallets>);
	});

	afterEach(() => {
		useDisplayWalletsSpy.mockRestore();
	});

	it("should render GroupNetworkTotal with amounts", () => {
		const useConfigurationSpy = jest
			.spyOn(configurationModule, "useConfiguration")
			.mockReturnValue({ profileIsSyncing: false, profileIsSyncingExchangeRates: false });

		const { asFragment } = render(
			<Route path="/profiles/:profileId/dashboard">
				<GroupNetworkTotal network={wallets[0].network()} wallets={wallets} isSinglePageMode={false} />
				<GroupNetworkTotal network={mainnetWallet.network()} wallets={wallets} isSinglePageMode={false} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(asFragment()).toMatchSnapshot();

		useConfigurationSpy.mockRestore();
	});

	it("should handle list wallet click", () => {
		const { asFragment } = render(
			<Route path="/profiles/:profileId/dashboard">
				<PortfolioHeader />
				<WalletsGroupsList />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(asFragment()).toMatchSnapshot();

		const toggleArkMainnet = screen.getAllByTestId("NetworkGroup_Toggle")[0];
		const toggleArkDevnet = screen.getAllByTestId("NetworkGroup_Toggle")[1];

		expect(screen.queryByText(wallets[2].address()!)).not.toBeInTheDocument();

		userEvent.click(toggleArkMainnet);

		expect(screen.getAllByTestId("WalletsGroup_Header")[0].classList.contains("border-b")).toBeTruthy();
		expect(screen.queryAllByTestId("WalletsGroup_Header")[1].classList.contains("border-b")).toBeFalsy();

		expect(screen.queryByText(wallets[0].alias()!)).not.toBeInTheDocument();
		expect(screen.getByText(wallets[2].address()!)).toBeInTheDocument();

		userEvent.click(toggleArkDevnet);

		expect(screen.getAllByText(wallets[0].alias()!)[0]).toBeInTheDocument();

		userEvent.click(screen.getAllByText(wallets[0].alias()!)[0]);

		expect(history.location.pathname).toBe(`/profiles/${profile.id()}/wallets/${wallets[0].id()}`);
	});

	it("should rename wallet through wallet dropdown", async () => {
		render(
			<Route path="/profiles/:profileId/dashboard">
				<PortfolioHeader />
				<WalletsGroupsList />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		const name = "New Name";

		userEvent.click(screen.getAllByTestId("NetworkGroup_Toggle")[1]);

		await waitFor(() => {
			expect(screen.getByTestId("WalletTable")).toBeInTheDocument();
		});

		const walletRow = screen.getAllByTestId("TableRow")[0];

		expect(within(walletRow).queryByText(name)).not.toBeInTheDocument();

		userEvent.click(within(walletRow).getByTestId("dropdown__toggle"));

		expect(screen.getByTestId("dropdown__content")).toBeInTheDocument();
		expect(screen.getByText(walletTranslations.PAGE_WALLET_DETAILS.OPTIONS.WALLET_NAME)).toBeInTheDocument();

		userEvent.click(screen.getByText(walletTranslations.PAGE_WALLET_DETAILS.OPTIONS.WALLET_NAME));

		await expect(screen.findByTestId("modal__inner")).resolves.toBeVisible();

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(walletTranslations.MODAL_NAME_WALLET.TITLE);

		const inputElement: HTMLInputElement = screen.getByTestId("UpdateWalletName__input");

		inputElement.select();
		userEvent.paste(inputElement, name);

		await waitFor(() => expect(inputElement).toHaveValue(name));

		expect(screen.getByTestId("UpdateWalletName__submit")).not.toBeDisabled();

		userEvent.click(screen.getByTestId("UpdateWalletName__submit"));

		await waitFor(() => expect(profile.wallets().findById(mainnetWallet.id()).alias()).toBe(name));

		expect(within(walletRow).getByText(name)).toBeInTheDocument();
	});

	it("should delete wallet through wallet dropdown", async () => {
		render(
			<Route path="/profiles/:profileId/dashboard">
				<PortfolioHeader />
				<WalletsGroupsList />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		const count = profile.wallets().count();

		userEvent.click(screen.getAllByTestId("NetworkGroup_Toggle")[1]);

		await waitFor(() => {
			expect(screen.getByTestId("WalletTable")).toBeInTheDocument();
		});

		userEvent.click(within(screen.getAllByTestId("TableRow")[0]).getByTestId("dropdown__toggle"));

		expect(screen.getByTestId("dropdown__content")).toBeInTheDocument();
		expect(screen.getByText(commonTranslations.DELETE)).toBeInTheDocument();

		userEvent.click(screen.getByText(commonTranslations.DELETE));

		await expect(screen.findByTestId("modal__inner")).resolves.toBeVisible();

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(walletTranslations.MODAL_DELETE_WALLET.TITLE);

		userEvent.click(screen.getByTestId("DeleteResource__submit-button"));

		await waitFor(() => expect(profile.wallets().count()).toBe(count - 1));
	});

	it.each([-500, 0, 500])("should render group with different widths", (width) => {
		const { result: balanceWidthReference } = renderHook(() => useRef(width));
		const { result: currencyWidthReference } = renderHook(() => useRef(width));

		const { asFragment } = render(
			<WalletsGroup
				wallets={profile.wallets().values()}
				network={mainnetWallet.network()}
				maxWidthReferences={{
					balance: balanceWidthReference.current,
					currency: currencyWidthReference.current,
				}}
			/>,
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it.each([true, false])("should render with dark mode = %s", (isDarkMode) => {
		const useThemeMock = jest.spyOn(useThemeHook, "useTheme").mockReturnValue({ isDarkMode } as never);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletsGroupsList />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(asFragment()).toMatchSnapshot();

		useThemeMock.mockRestore();
	});

	it("should render skeleton when there are no available wallets yet and profile is syncing", () => {
		const useConfigurationSpy = jest
			.spyOn(configurationModule, "useConfiguration")
			.mockReturnValue({ profileIsSyncing: true });

		useDisplayWalletsSpy = jest.spyOn(useDisplayWallets, "useDisplayWallets").mockReturnValue({
			...useDisplayWalletsResult,
			availableWallets: [],
		} as ReturnType<UseDisplayWallets>);

		render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletsGroupsList />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByTestId("WalletsGroup_HeaderSkeleton").lastChild).toHaveClass("ring-theme-primary-100");
		expect(screen.getByTestId("WalletsGroup_HeaderSkeleton")).toBeInTheDocument();

		useConfigurationSpy.mockRestore();
		useDisplayWalletsSpy.mockRestore();
	});

	it("should render skeleton as placeholder when there are no wallets grouped by network and profile is restored", () => {
		const useConfigurationSpy = jest
			.spyOn(configurationModule, "useConfiguration")
			.mockReturnValue({ profileIsSyncing: false });

		useDisplayWalletsSpy = jest.spyOn(useDisplayWallets, "useDisplayWallets").mockReturnValue({
			...useDisplayWalletsResult,
			filteredWalletsGroupedByNetwork: [],
		} as ReturnType<UseDisplayWallets>);

		render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletsGroupsList />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(screen.getByTestId("WalletsGroup_HeaderSkeleton")).toBeInTheDocument();

		useConfigurationSpy.mockRestore();
		useDisplayWalletsSpy.mockRestore();
	});

	it("should render with show all button", () => {
		const { asFragment } = render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletsGroupsList />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		userEvent.click(screen.getAllByTestId("NetworkGroup_Toggle")[1]);

		expect(screen.getByTestId("WalletsList")).toBeInTheDocument();
		expect(screen.getByTestId("WalletsList__ShowAll")).toBeInTheDocument();
		expect(screen.getAllByText(wallets[0].alias()!)).toHaveLength(9);

		userEvent.click(screen.getByTestId("WalletsList__ShowAll"));

		expect(asFragment()).toMatchSnapshot();

		expect(history.location.pathname).toBe(`/profiles/${profile.id()}/network/${wallets[0].networkId()}`);
	});

	it("should show skeleton when syncing exchange rates", () => {
		const useConfigurationSpy = jest
			.spyOn(configurationModule, "useConfiguration")
			.mockReturnValue({ profileIsSyncingExchangeRates: true });

		useDisplayWalletsSpy = jest.spyOn(useDisplayWallets, "useDisplayWallets").mockReturnValue({
			...useDisplayWalletsResult,
			availableWallets: [],
		} as ReturnType<UseDisplayWallets>);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletsGroupsList />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);
		userEvent.click(screen.getAllByTestId("NetworkGroup_Toggle")[1]);

		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getAllByTestId("CurrencyCell")[0].querySelector(".react-loading-skeleton")).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();

		useConfigurationSpy.mockRestore();
	});
});
