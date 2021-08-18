import { Modal } from "app/components/Modal";
import {
	TransactionAmount,
	TransactionConfirmations,
	TransactionExplorerLink,
	TransactionFee,
	TransactionMemo,
	TransactionSender,
	TransactionTimestamp,
} from "domains/transaction/components/TransactionDetail";
import { TransactionAliases } from "domains/transaction/components/TransactionDetailModal/TransactionDetailModal.models";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { MultiPaymentRecipients } from "./components/MultiPaymentRecipients";

interface MultiPaymentDetailProperties {
	isOpen: boolean;
	transaction: any;
	aliases?: TransactionAliases;
	onClose?: any;
}

export const MultiPaymentDetail = ({ isOpen, transaction, aliases, onClose }: MultiPaymentDetailProperties) => {
	const { t } = useTranslation();

	const wallet = useMemo(() => transaction.wallet(), [transaction]);

	const { recipients, returnedAmount } = useMemo(() => {
		const recipients = [];
		let returnedAmount = 0;

		for (const [index, recipient] of transaction.recipients().entries()) {
			if (transaction.isReturn() && transaction.sender() === recipient.address) {
				returnedAmount += recipient.amount;
			}

			recipients.push({
				...recipient,
				alias: aliases?.recipients[index].alias,
				isDelegate: aliases?.recipients[index].isDelegate,
			});
		}

		return { recipients, returnedAmount };
	}, [aliases, transaction]);

	return (
		<Modal title={t("TRANSACTION.MODAL_TRANSFER_DETAIL.TITLE")} isOpen={isOpen} onClose={onClose}>
			<TransactionSender
				address={transaction.sender()}
				alias={aliases?.sender.alias}
				isDelegate={aliases?.sender.isDelegate}
				border={false}
			/>

			<MultiPaymentRecipients transaction={transaction} recipients={recipients} />

			<TransactionAmount
				amount={transaction.amount()}
				convertedAmount={transaction.convertedAmount()}
				returnedAmount={returnedAmount}
				currency={wallet.currency()}
				exchangeCurrency={wallet.exchangeCurrency()}
				isMultiPayment={true}
				isSent={transaction.isSent()}
			/>

			<TransactionFee currency={wallet.currency()} value={transaction.fee()} />

			{transaction.memo() && <TransactionMemo memo={transaction.memo()} />}

			<TransactionTimestamp timestamp={transaction.timestamp()} />

			<TransactionConfirmations transaction={transaction} />

			<TransactionExplorerLink transaction={transaction} />
		</Modal>
	);
};

MultiPaymentDetail.defaultProps = {
	isOpen: false,
};

MultiPaymentDetail.displayName = "MultiPaymentDetail";
