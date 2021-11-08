import { Contracts } from "@payvo/profiles";
import { images } from "app/assets/images";
import { Button } from "app/components/Button";
import { Icon } from "app/components/Icon";
import { NotificationsDropdown } from "app/components/Notifications";
import { Tooltip } from "app/components/Tooltip";
import { getNavigationMenu } from "app/constants/navigation";
import { useConfiguration } from "app/contexts";
import { useActiveProfile, useScroll, useTheme } from "app/hooks";
import cn from "classnames";
import { ReceiveFunds } from "domains/wallet/components/ReceiveFunds";
import { SearchWallet } from "domains/wallet/components/SearchWallet";
import { SelectedWallet } from "domains/wallet/components/SearchWallet/SearchWallet.models";
import React, { FC, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useHistory } from "react-router-dom";
import tw, { css, styled } from "twin.macro";
import { openExternal } from "utils/electron-utils";

import { DropdownOption } from "../Dropdown";
import { BackButton } from "./components/BackButton";
import { Balance } from "./components/Balance";
import { UserInfo } from "./components/UserInfo/UserInfo";
import { NavigationBarMenuItem, NavigationBarProperties } from "./NavigationBar.contracts";
import { defaultStyle } from "./NavigationBar.styles";

const { PayvoLogo } = images.common;

const NavWrapper = styled.nav<{ noBorder?: boolean; noShadow?: boolean; scroll?: number }>`
	${defaultStyle}

	${tw`sticky inset-x-0 top-0 transition-all duration-200 border-b border-theme-background bg-theme-background`}

	${({ noBorder, scroll }) => {
		if (!noBorder && !scroll) {
			return tw`border-theme-secondary-300 dark:border-theme-secondary-800`;
		}
	}}

	${({ noShadow, scroll }) => {
		if (!noShadow && scroll) {
			return tw`shadow-header-smooth dark:shadow-header-smooth-dark`;
		}
	}};
`;

const LogoContainer = styled.div`
	${tw`flex items-center justify-center my-auto mr-4 pl-0.5 text-white rounded-xl w-11 h-11 bg-theme-success-600`};
`;

export const NavigationButtonWrapper = styled.div`
	${css`
		button {
			${tw`w-11 h-11 overflow-hidden rounded text-theme-secondary-700 dark:text-theme-secondary-600 not-disabled:(hover:text-theme-primary-600 hover:bg-theme-primary-100 dark:hover:bg-theme-secondary-800 dark:hover:text-theme-secondary-100)`};
		}
	`};
`;

export const NavigationBar: FC<NavigationBarProperties> = ({ title, isBackDisabled, variant = "full" }) => {
	const history = useHistory();
	const profile = useActiveProfile();
	const { t } = useTranslation();
	const { setTheme } = useTheme();
	const scroll = useScroll();

	const { profileIsSyncingExchangeRates } = useConfiguration();

	const [searchWalletIsOpen, setSearchWalletIsOpen] = useState(false);

	const [selectedWallet, setSelectedWallet] = useState<SelectedWallet | undefined>();
	const isVariantFull = variant === "full";

	const navigationMenu = useMemo<NavigationBarMenuItem[]>(() => getNavigationMenu(t), [t]);

	const renderMenu = () => {
		if (!profile?.id()) {
			return null;
		}
		return navigationMenu.map((menuItem, index) => (
			<li key={index} className="flex">
				<NavLink
					to={menuItem.mountPath(profile.id())}
					title={menuItem.title}
					className="flex relative items-center font-semibold transition-colors duration-200 focus:outline-none text-md text-theme-secondary-text ring-focus"
					data-ring-focus-margin="-mx-2"
				>
					{menuItem.title}
				</NavLink>
			</li>
		));
	};
	const userInitials = useMemo(() => {
		const name = profile?.settings().get(Contracts.ProfileSetting.Name);
		return name ? (name as string).slice(0, 2).toUpperCase() : undefined;
	}, [profile]);

	const profileWalletsCount = profile?.wallets().count();
	const wallets = useMemo<Contracts.IReadWriteWallet[]>(() => {
		if (!profile) {
			return [];
		}

		if (profile.settings().get(Contracts.ProfileSetting.UseTestNetworks)) {
			return profile.wallets().values();
		}

		return profile
			.wallets()
			.values()
			.filter((wallet) => wallet.network().isLive());
	}, [profile, profileWalletsCount]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleSelectWallet = (wallet: SelectedWallet) => {
		setSearchWalletIsOpen(false);

		setSelectedWallet(wallet);
	};

	const handleCloseRecieveFunds = useCallback(() => setSelectedWallet(undefined), [setSelectedWallet]);

	const renderLogo = () => (
		<div className="flex items-center my-auto">
			<LogoContainer>
				<PayvoLogo height={28} />
			</LogoContainer>

			{title && <span className="text-2xl font-bold">{title}</span>}
		</div>
	);

	const renderFullBarVariant = () => (
		<>
			<ul className="flex mr-auto ml-4 space-x-8 h-21" data-testid={"navigationBar__menu"}>
				{renderMenu()}
			</ul>

			<div className="flex items-center my-auto space-x-4" data-testid={"navigationBar__notifications"}>
				{profile && <NotificationsDropdown profile={profile} />}

				<div className="h-8 border-r border-theme-secondary-300 dark:border-theme-secondary-800" />

				<div className="flex items-center">
					<Tooltip content={wallets.length > 0 ? undefined : t("COMMON.NOTICE_NO_WALLETS")}>
						<NavigationButtonWrapper>
							<Button
								data-testid="navbar__buttons--send"
								disabled={wallets.length === 0}
								size="icon"
								variant="transparent"
								onClick={() => {
									const sendTransferPath = `/profiles/${profile?.id()}/send-transfer`;

									// add query param reset = 1 if already on send transfer page
									/* istanbul ignore next: tested in e2e */
									const reset = history.location.pathname === sendTransferPath ? 1 : 0;
									history.push(`${sendTransferPath}?reset=${reset}`);
								}}
							>
								<Icon name="DoubleArrowRight" size="lg" className="p-1" />
							</Button>
						</NavigationButtonWrapper>
					</Tooltip>
				</div>

				<div className="h-8 border-r border-theme-secondary-300 dark:border-theme-secondary-800" />

				<div className="flex items-center">
					<Tooltip content={wallets.length > 0 ? undefined : t("COMMON.NOTICE_NO_WALLETS")}>
						<NavigationButtonWrapper>
							<Button
								data-testid="navbar__buttons--receive"
								disabled={wallets.length === 0}
								size="icon"
								variant="transparent"
								onClick={() => setSearchWalletIsOpen(true)}
							>
								<Icon name="QrCode" size="lg" className="p-1" />
							</Button>
						</NavigationButtonWrapper>
					</Tooltip>
				</div>

				<div className="h-8 border-r border-theme-secondary-300 dark:border-theme-secondary-800" />
			</div>

			<div className="flex items-center my-auto ml-8 space-x-4" data-testid={"navigationBar__userInfo"}>
				<Balance profile={profile} isLoading={profileIsSyncingExchangeRates} />

				<UserInfo
					userInitials={userInitials}
					avatarImage={profile?.avatar()}
					onUserAction={(action: DropdownOption) => {
						if (action?.isExternal) {
							return openExternal(action.mountPath());
						}

						if (action?.value === "sign-out") {
							profile?.status().reset();

							setTheme("system");
						}

						return history.push(action.mountPath(profile?.id()));
					}}
				/>
			</div>
		</>
	);

	return (
		<NavWrapper aria-labelledby="main menu" noBorder={!isVariantFull} noShadow={false} scroll={scroll}>
			<div className="flex relative h-21">
				{isVariantFull && <BackButton className="flex w-12" disabled={isBackDisabled} />}

				<div className={cn("flex flex-1 px-8", { "ml-12": !isVariantFull })}>
					{renderLogo()}
					{isVariantFull && renderFullBarVariant()}
				</div>
			</div>

			{profile && (
				<>
					<SearchWallet
						profile={profile}
						isOpen={searchWalletIsOpen}
						title={t("WALLETS.MODAL_SELECT_ACCOUNT.TITLE")}
						description={t("WALLETS.MODAL_SELECT_ACCOUNT.DESCRIPTION")}
						searchPlaceholder={t("WALLETS.MODAL_SELECT_ACCOUNT.SEARCH_PLACEHOLDER")}
						wallets={wallets}
						onSelectWallet={handleSelectWallet}
						onClose={() => setSearchWalletIsOpen(false)}
					/>

					{selectedWallet && (
						<ReceiveFunds
							address={selectedWallet.address}
							name={selectedWallet.name}
							network={selectedWallet.network}
							onClose={handleCloseRecieveFunds}
						/>
					)}
				</>
			)}
		</NavWrapper>
	);
};
