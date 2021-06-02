import { Contracts } from "@arkecosystem/platform-sdk-profiles";
import React from "react";
import * as utils from "utils/electron-utils";
import { act, env, fireEvent, getDefaultProfileId, render, screen, waitFor } from "utils/testing-library";

import { SignedTransactionTable } from "./SignedTransactionTable";

describe("Signed Transaction Table", () => {
	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;

	const fixtures: Record<string, any> = {
		transfer: undefined,
		multiSignature: undefined,
		multiPayment: undefined,
		vote: undefined,
		unvote: undefined,
		ipfs: undefined,
	};

	beforeEach(async () => {
		profile = env.profiles().findById(getDefaultProfileId());

		wallet = profile.wallets().first();

		await profile.sync();

		fixtures.transfer = await wallet
			.coin()
			.transaction()
			.transfer({
				nonce: "1",
				fee: "0.00000001",
				data: {
					to: wallet.address(),
					amount: "0.00000001",
				},
				signatory: await wallet
					.coin()
					.signatory()
					.multiSignature(2, [wallet.publicKey()!, profile.wallets().last().publicKey()!]),
			});

		fixtures.multiSignature = await wallet
			.coin()
			.transaction()
			.multiSignature({
				nonce: "1",
				fee: "0.00000001",
				data: {
					min: 2,
					publicKeys: [wallet.publicKey()!, profile.wallets().last().publicKey()!],
					senderPublicKey: wallet.publicKey()!,
				},
				signatory: await wallet
					.coin()
					.signatory()
					.multiSignature(2, [wallet.publicKey()!, profile.wallets().last().publicKey()!]),
			});

		fixtures.multiPayment = await wallet
			.coin()
			.transaction()
			.multiPayment({
				nonce: "1",
				fee: "0.00000001",
				data: {
					payments: [
						{
							amount: "0.00000001",
							to: wallet.address(),
						},
						{
							amount: "0.00000002",
							to: wallet.address(),
						},
					],
				},
				signatory: await wallet
					.coin()
					.signatory()
					.multiSignature(2, [wallet.publicKey()!, profile.wallets().last().publicKey()!]),
			});

		fixtures.vote = await wallet
			.coin()
			.transaction()
			.vote({
				nonce: "1",
				fee: "0.00000001",
				data: {
					votes: ["034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192"],
					unvotes: [],
				},
				signatory: await wallet
					.coin()
					.signatory()
					.multiSignature(2, [wallet.publicKey()!, profile.wallets().last().publicKey()!]),
			});

		fixtures.unvote = await wallet
			.coin()
			.transaction()
			.vote({
				nonce: "1",
				fee: "0.00000001",
				data: {
					votes: [],
					unvotes: ["034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192"],
				},
				signatory: await wallet
					.coin()
					.signatory()
					.multiSignature(2, [wallet.publicKey()!, profile.wallets().last().publicKey()!]),
			});

		fixtures.ipfs = await wallet
			.coin()
			.transaction()
			.ipfs({
				nonce: "1",
				fee: "0.00000001",
				data: {
					hash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
				},
				signatory: await wallet
					.coin()
					.signatory()
					.multiSignature(2, [wallet.publicKey()!, profile.wallets().last().publicKey()!]),
			});
	});

	it("should render", () => {
		const isMultiSignatureReadyMock = jest
			.spyOn(wallet.coin().multiSignature(), "isMultiSignatureReady")
			.mockReturnValue(true);
		const canBeSignedMock = jest.spyOn(wallet.transaction(), "canBeSigned").mockReturnValue(false);
		const { asFragment } = render(
			<SignedTransactionTable transactions={Object.values(fixtures)} wallet={wallet} />,
		);
		expect(asFragment()).toMatchSnapshot();
		canBeSignedMock.mockReset();
		isMultiSignatureReadyMock.mockRestore();
	});

	it("should show as awaiting confirmations", async () => {
		const isAwaitingConfirmationMock = jest
			.spyOn(wallet.transaction(), "isAwaitingConfirmation")
			.mockImplementation(() => true);

		const { asFragment } = render(<SignedTransactionTable transactions={[fixtures.transfer]} wallet={wallet} />);
		await waitFor(() => expect(screen.getByText("status-pending.svg")).toBeInTheDocument());

		expect(asFragment()).toMatchSnapshot();
		isAwaitingConfirmationMock.mockRestore();
	});

	it("should show as awaiting the wallet signature", async () => {
		const isAwaitingOurSignatureMock = jest
			.spyOn(wallet.transaction(), "isAwaitingOurSignature")
			.mockImplementation(() => true);

		const { asFragment } = render(<SignedTransactionTable transactions={[fixtures.transfer]} wallet={wallet} />);
		await waitFor(() => expect(screen.getByText("awaiting-our-signature.svg")).toBeInTheDocument());

		expect(asFragment()).toMatchSnapshot();
		isAwaitingOurSignatureMock.mockRestore();
	});

	it("should show as awaiting other wallets signatures", async () => {
		const isAwaitingOurSignatureMock = jest
			.spyOn(wallet.transaction(), "isAwaitingOtherSignatures")
			.mockImplementation(() => true);
		const remainingSignatureCountMock = jest
			.spyOn(wallet.coin().multiSignature(), "remainingSignatureCount")
			.mockImplementation(() => 3);

		const { asFragment } = render(<SignedTransactionTable transactions={[fixtures.transfer]} wallet={wallet} />);
		await waitFor(() => expect(screen.getByText("awaiting-other-signature.svg")).toBeInTheDocument());

		expect(asFragment()).toMatchSnapshot();
		isAwaitingOurSignatureMock.mockRestore();
		remainingSignatureCountMock.mockRestore();
	});

	it("should show as final signature", async () => {
		const isAwaitingOurSignatureMock = jest
			.spyOn(wallet.coin().multiSignature(), "isMultiSignatureReady")
			.mockImplementation(() => {
				throw new Error();
			});

		const { asFragment } = render(<SignedTransactionTable transactions={[fixtures.transfer]} wallet={wallet} />);
		await waitFor(() => expect(screen.getByText("awaiting-final-signature.svg")).toBeInTheDocument());

		expect(asFragment()).toMatchSnapshot();
		isAwaitingOurSignatureMock.mockRestore();
	});

	it("should show the sign button", () => {
		const onClick = jest.fn();
		const awaitingMock = jest.spyOn(wallet.transaction(), "canBeSigned").mockReturnValue(true);

		const { asFragment } = render(
			<SignedTransactionTable transactions={[fixtures.multiSignature]} wallet={wallet} onClick={onClick} />,
		);

		act(() => {
			fireEvent.click(screen.getByTestId("TransactionRow__sign"));
		});

		expect(onClick).toHaveBeenCalled();
		expect(asFragment()).toMatchSnapshot();

		awaitingMock.mockReset();
	});

	it.each(["light", "dark"])("should set %s shadow color on mouse events", async (theme) => {
		jest.spyOn(utils, "shouldUseDarkColors").mockImplementation(() => theme === "dark");

		render(<SignedTransactionTable transactions={[fixtures.multiSignature]} wallet={wallet} />);
		act(() => {
			fireEvent.mouseEnter(screen.getAllByRole("row")[1]);
		});

		await waitFor(() => expect(screen.getAllByRole("row")[1]).toBeInTheDocument());

		act(() => {
			fireEvent.mouseLeave(screen.getAllByRole("row")[1]);
		});

		await waitFor(() => expect(screen.getAllByRole("row")[1]).toBeInTheDocument());
	});
});
