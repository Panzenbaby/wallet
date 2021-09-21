import { Contracts } from "@payvo/profiles";
import { Button } from "app/components/Button";
import { EmptyBlock } from "app/components/EmptyBlock";
import { Header } from "app/components/Header";
import { Table } from "app/components/Table";
import React, { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { UnlockableBalance, UnlockableBalanceSkeleton, UnlockTokensFormState } from "../../UnlockTokens.contracts";
import { useColumns, useFees } from "../../UnlockTokens.helpers";
import { UnlockTokensRow } from "./UnlockTokensRow";
import { UnlockTokensTotal } from "./UnlockTokensTotal";

interface Properties {
	items: UnlockableBalance[];
	loading: boolean;
	wallet: Contracts.IReadWriteWallet;
	profile: Contracts.IProfile;
	onClose: () => void;
	onUnlock: () => void;
	isFirstLoad?: boolean;
}

const SKELETON_ROWS = new Array<UnlockableBalanceSkeleton>(3).fill({});

export const UnlockTokensSelect: React.FC<Properties> = ({
	wallet,
	profile,
	onClose,
	onUnlock,
	items,
	loading,
	isFirstLoad,
}: Properties) => {
	const { t } = useTranslation();

	const { setValue, watch } = useFormContext<UnlockTokensFormState>();
	const { amount, fee, selectedObjects } = watch();

	const [isLoadingFee, setIsLoadingFee] = useState<boolean>(false);
	const [selectedIds, setSelectedIds] = useState<string[]>(selectedObjects.map((value) => value.id));

	const { calculateFee } = useFees({
		coin: wallet.coinId(),
		network: wallet.networkId(),
		profile,
	});

	const { data, isEmpty, isLoading } = useMemo(
		() => ({
			data: loading && items.length === 0 ? SKELETON_ROWS : items,
			isEmpty: !loading && items.length === 0,
			isLoading: loading && items.length === 0, // show skeleton only on initial loading
		}),
		[items, loading],
	);

	const selectableObjects = useMemo(() => items.filter((item) => item.isReady), [items]);

	const isAllSelected = useMemo(() => selectableObjects.every((item) => selectedIds.includes(item.id)), [
		selectedIds,
		selectableObjects,
	]);

	useEffect(() => {
		// pre-select unlockable items on first load
		if (isFirstLoad && selectableObjects.length > 0 && selectedIds.length === 0) {
			setSelectedIds(selectableObjects.map((item) => item.id));
		}
	}, [selectableObjects, isFirstLoad]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		setValue(
			"selectedObjects",
			items.filter((item) => selectedIds.includes(item.id)),
		);
	}, [items, selectedIds, setValue]);

	useEffect(() => {
		const recalculateAmount = () => {
			setValue(
				"amount",
				selectedObjects.reduce((total, value) => total + value.amount.toHuman(), 0),
			);
		};

		const recalculateFee = async () => {
			setIsLoadingFee(true);
			setValue("fee", await calculateFee(selectedObjects));
			setIsLoadingFee(false);
		};

		recalculateAmount();
		void recalculateFee();
	}, [calculateFee, selectedObjects, setValue]);

	const toggle = (itemId: string): void => {
		setSelectedIds((value) => (value.includes(itemId) ? value.filter((id) => id !== itemId) : [...value, itemId]));
	};

	const onToggleAll = (): void => {
		if (!selectableObjects.some((item) => selectedIds.includes(item.id))) {
			setSelectedIds(selectableObjects.map((item) => item.id));
		} else {
			setSelectedIds([]);
		}
	};

	const columns = useColumns({ canSelectAll: selectableObjects.length > 0, isAllSelected, onToggleAll });

	return (
		<>
			<Header
				title={t("TRANSACTION.UNLOCK_TOKENS.SELECT.TITLE")}
				subtitle={t("TRANSACTION.UNLOCK_TOKENS.SELECT.DESCRIPTION")}
			/>

			<div className="py-3">
				{isEmpty ? (
					<EmptyBlock>{t("TRANSACTION.UNLOCK_TOKENS.EMPTY_MESSAGE")}</EmptyBlock>
				) : (
					<>
						<div className="relative border-b border-theme-secondary-300 dark:border-theme-secondary-800">
							<Table columns={columns} data={data}>
								{(item: UnlockableBalanceSkeleton | UnlockableBalance) => (
									<UnlockTokensRow
										item={item}
										loading={isLoading}
										ticker={wallet.currency()}
										onToggle={() => toggle(item.id)}
										checked={selectedIds.includes(item.id)}
									/>
								)}
							</Table>
						</div>
						<UnlockTokensTotal
							fee={fee}
							isLoadingFee={isLoadingFee}
							isLoading={isLoading}
							amount={amount}
							wallet={wallet}
						/>
					</>
				)}
			</div>
			<div className="flex justify-end space-x-3">
				<Button variant="secondary" onClick={onClose}>
					{t("COMMON.CLOSE")}
				</Button>
				<Button variant="primary" disabled={selectedIds.length === 0 || isLoadingFee} onClick={onUnlock}>
					{t("TRANSACTION.UNLOCK_TOKENS.UNLOCK")}
				</Button>
			</div>
		</>
	);
};
