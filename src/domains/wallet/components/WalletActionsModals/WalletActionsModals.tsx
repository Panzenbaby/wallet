import React, { useCallback, useMemo, VFC } from "react";
import { useActiveProfile, useWalletAlias } from "@/app/hooks";
import { UnlockTokensModal } from "@/domains/transaction/components/UnlockTokens";
import { DeleteWallet } from "@/domains/wallet/components/DeleteWallet";
import { ReceiveFunds } from "@/domains/wallet/components/ReceiveFunds";
import { SignMessage } from "@/domains/wallet/components/SignMessage";
import { UpdateWalletName } from "@/domains/wallet/components/UpdateWalletName";
import { VerifyMessage } from "@/domains/wallet/components/VerifyMessage";
import { WalletActionsProperties } from "@/domains/wallet/components/WalletActionsModals/WalletActionsModals.contracts";
import { WalletEncryptionWarning } from "@/domains/wallet/components/WalletEncryptionWarning";
import { useWalletActions } from "@/domains/wallet/hooks/use-wallet-actions";

export const WalletActionsModals: VFC<WalletActionsProperties> = ({ wallet, activeModal, setActiveModal }) => {
	const profile = useActiveProfile();
	const { getWalletAlias } = useWalletAlias();
	const { handleDelete, handleConfirmEncryptionWarning } = useWalletActions(wallet);

	const hideActiveModal = useCallback(
		(event?: React.MouseEvent<HTMLElement>) => {
			event?.preventDefault();
			event?.stopPropagation();
			setActiveModal(undefined);
		},
		[setActiveModal],
	);

	const { alias } = useMemo(
		() =>
			getWalletAlias({
				address: wallet.address(),
				network: wallet.network(),
				profile: profile,
			}),
		[profile, getWalletAlias, wallet],
	);

	return (
		<>
			{activeModal === "sign-message" && (
				<SignMessage
					profile={profile}
					walletId={wallet.id()}
					isOpen={true}
					onClose={hideActiveModal}
					onCancel={hideActiveModal}
				/>
			)}

			{activeModal === "verify-message" && (
				<VerifyMessage
					isOpen={true}
					onClose={hideActiveModal}
					onCancel={hideActiveModal}
					walletId={wallet.id()}
					profileId={profile.id()}
				/>
			)}

			{activeModal === "receive-funds" && (
				<ReceiveFunds
					address={wallet.address()}
					name={alias}
					network={wallet.network()}
					onClose={hideActiveModal}
				/>
			)}

			{activeModal === "wallet-name" && (
				<UpdateWalletName
					onAfterSave={hideActiveModal}
					onCancel={hideActiveModal}
					profile={profile}
					wallet={wallet}
				/>
			)}
			{activeModal === "delete-wallet" && (
				<DeleteWallet onClose={hideActiveModal} onCancel={hideActiveModal} onDelete={handleDelete} />
			)}

			{activeModal === "second-signature" && (
				<WalletEncryptionWarning
					importType={wallet.actsWithMnemonicWithEncryption() ? "mnemonic" : "secret"}
					onCancel={hideActiveModal}
					onConfirm={handleConfirmEncryptionWarning}
				/>
			)}

			{activeModal === "unlockable-balances" && (
				<UnlockTokensModal profile={profile} wallet={wallet} onClose={hideActiveModal} />
			)}
		</>
	);
};
