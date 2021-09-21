import { BigNumber } from "@payvo/helpers";
import { DateTime } from "@payvo/intl";
import { Contracts } from "@payvo/profiles";
import { LSK } from "@payvo/sdk-lsk";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LedgerProvider } from "app/contexts";
import { buildTranslations } from "app/i18n/helpers";
import nock from "nock";
import React from "react";
import transactionFixture from "tests/fixtures/coins/lsk/testnet/transactions/unlock-token.json";
import { env, getDefaultLedgerTransport, render } from "utils/testing-library";

import { UnlockTokensModal } from "./UnlockTokensModal";

const translations = buildTranslations();
const transport = getDefaultLedgerTransport() as any;

describe("UnlockTokensModal", () => {
	const mnemonic = "barrel own close sponsor strike win twice dwarf blame intact aerobic wild";

	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;

	beforeAll(async () => {
		nock.disableNetConnect();

		env.registerCoin("LSK", LSK);

		profile = env.profiles().create("empty");

		wallet = await profile.walletFactory().fromMnemonicWithBIP39({
			coin: "LSK",
			mnemonic,
			network: "lsk.testnet",
		});

		// wallet for fee calculation

		const feeWallet = await profile.walletFactory().generate({
			coin: wallet.coinId(),
			network: wallet.networkId(),
		});

		jest.spyOn(profile.walletFactory(), "generate").mockResolvedValue(feeWallet);
		jest.spyOn(feeWallet.wallet.coin().transaction(), "unlockToken").mockResolvedValue({
			fee: () => BigNumber.make(+transactionFixture.data.fee / 1e8),
		} as any);

		// items mock

		jest.spyOn(wallet.coin().client(), "unlockableBalances").mockResolvedValue({
			current: BigNumber.make(30),
			objects: [
				{
					address: "lsk5gjpsoqgchb8shk8hvwez6ddx3a4b8gga59rw4",
					amount: BigNumber.make(30),
					height: "789",
					isReady: true,
					timestamp: DateTime.make("2020-01-01T00:00:00.000Z"),
				},
			],
			pending: BigNumber.make(0),
		});

		// wallet mocks

		jest.spyOn(wallet, "isSecondSignature").mockReturnValue(false);
		jest.spyOn(wallet, "isMultiSignature").mockReturnValue(false);
		jest.spyOn(wallet, "isDelegate").mockReturnValue(false);
		jest.spyOn(wallet, "isResignedDelegate").mockReturnValue(false);

		// transaction mocks

		jest.spyOn(wallet.transaction(), "transaction").mockReturnValue({
			amount: () => 30,
			convertedAmount: () => 0,
			convertedFee: () => 0,
			explorerLink: () => `https://testnet.lisk.observer/transaction/${transactionFixture.data.id}`,
			fee: () => +transactionFixture.data.fee / 1e8,
			id: () => transactionFixture.data.id,
			isMultiSignatureRegistration: () => false,
			isUnlockToken: () => true,
			sender: () => transactionFixture.data.sender,
			timestamp: () => DateTime.make(),
			type: () => "unlockToken",
			usesMultiSignature: () => false,
			wallet: () => wallet,
		} as any);
	});

	it("should render", async () => {
		const onClose = jest.fn();

		const { asFragment } = render(
			<LedgerProvider transport={transport}>
				<UnlockTokensModal wallet={wallet} onClose={onClose} profile={profile} />
			</LedgerProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("UnlockTokensModal")).toBeInTheDocument());

		expect(asFragment()).toMatchSnapshot();

		userEvent.click(screen.getByText(translations.COMMON.CLOSE));

		expect(onClose).toHaveBeenCalled();
	});

	it.each(["success", "error"])("should handle unlock token transaction with %s", async (expectedOutcome) => {
		const { asFragment } = render(
			<LedgerProvider transport={transport}>
				<UnlockTokensModal wallet={wallet} onClose={jest.fn()} profile={profile} />
			</LedgerProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("UnlockTokensModal")).toBeInTheDocument());

		expect(asFragment()).toMatchSnapshot();

		expect(screen.getAllByTestId("TableRow")).toHaveLength(1);
		expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(2);

		await waitFor(() => {
			expect(within(screen.getAllByTestId("UnlockTokensTotal")[0]).getByTestId("AmountCrypto")).toHaveTextContent(
				"+ 30 LSK",
			);
		});

		expect(within(screen.getAllByTestId("UnlockTokensTotal")[1]).getByTestId("AmountCrypto")).toHaveTextContent(
			"- 0.00147 LSK",
		);

		// continue to review step

		userEvent.click(screen.getByText(translations.TRANSACTION.UNLOCK_TOKENS.UNLOCK));

		expect(screen.getByText(translations.TRANSACTION.UNLOCK_TOKENS.REVIEW.TITLE)).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();

		// back to select step

		userEvent.click(screen.getByText(translations.COMMON.BACK));

		await waitFor(() => {
			expect(within(screen.getAllByTestId("UnlockTokensTotal")[1]).getByTestId("AmountCrypto")).toHaveTextContent(
				"- 0.00147 LSK",
			);
		});

		// continue to review step

		userEvent.click(screen.getByText(translations.TRANSACTION.UNLOCK_TOKENS.UNLOCK));

		expect(screen.getByText(translations.TRANSACTION.UNLOCK_TOKENS.REVIEW.TITLE)).toBeInTheDocument();

		// continue to auth step

		userEvent.click(screen.getByText(translations.COMMON.CONFIRM));

		await waitFor(() => expect(screen.getByTestId("AuthenticationStep")).toBeInTheDocument());

		// back to review step

		userEvent.click(screen.getByText(translations.COMMON.BACK));

		expect(screen.getByText(translations.TRANSACTION.UNLOCK_TOKENS.REVIEW.TITLE)).toBeInTheDocument();

		// continue to auth step

		userEvent.click(screen.getByText(translations.COMMON.CONFIRM));

		await waitFor(() => expect(screen.getByTestId("AuthenticationStep")).toBeInTheDocument());

		expect(asFragment()).toMatchSnapshot();

		// enter signing key

		fireEvent.input(screen.getByTestId("AuthenticationStep__mnemonic"), { target: { value: mnemonic } });

		await waitFor(() => expect(screen.getByTestId("AuthenticationStep__mnemonic")).toHaveValue(mnemonic));

		// send transaction

		const signMock = jest
			.spyOn(wallet.transaction(), "signUnlockToken")
			.mockResolvedValue(transactionFixture.data.id);

		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue(
			expectedOutcome === "success"
				? {
						accepted: [transactionFixture.data.id],
						errors: {},
						rejected: [],
				  }
				: {
						accepted: [],
						errors: { error: "unable to unlock token" },
						rejected: [transactionFixture.data.id],
				  },
		);

		userEvent.click(screen.getByTestId("UnlockTokensAuthentication__send"));

		if (expectedOutcome === "success") {
			await waitFor(() => expect(screen.getByTestId("TransactionSuccessful")).toBeInTheDocument());
		} else {
			await waitFor(() => expect(screen.getByTestId("ErrorStep__errorMessage")).toBeInTheDocument());
		}

		expect(asFragment()).toMatchSnapshot();

		expect(signMock).toHaveBeenCalled();
		expect(broadcastMock).toHaveBeenCalled();

		signMock.mockRestore();
		broadcastMock.mockRestore();
	});
});
