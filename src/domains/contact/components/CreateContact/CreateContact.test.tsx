/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/sdk-profiles";
import userEvent from "@testing-library/user-event";
import React from "react";

import { CreateContact } from "./CreateContact";
import { translations } from "@/domains/contact/i18n";
import { env, getDefaultProfileId, render, screen, waitFor } from "@/utils/testing-library";

const onSave = jest.fn();

let profile: Contracts.IProfile;
let contact: Contracts.IContact;

describe("CreateContact", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		contact = profile.contacts().values()[0];
	});

	it("should not render if not open", () => {
		const { asFragment } = render(<CreateContact profile={profile} isOpen={false} onSave={onSave} />);

		expect(screen.queryByTestId("modal__inner")).not.toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render", () => {
		const { asFragment } = render(<CreateContact profile={profile} isOpen={true} onSave={onSave} />);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_CREATE_CONTACT.TITLE);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_CREATE_CONTACT.DESCRIPTION);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not create new contact if contact name exists", async () => {
		render(<CreateContact profile={profile} isOpen={true} onSave={onSave} />);

		userEvent.paste(screen.getByTestId("contact-form__name-input"), contact.name());

		await waitFor(() => {
			expect(screen.getByTestId("contact-form__name-input")).toHaveValue(contact.name());
		});

		expect(screen.getByTestId("Input__error")).toBeVisible();

		const selectNetworkInput = screen.getByTestId("SelectDropdown__input");

		userEvent.paste(selectNetworkInput, "ARK D");
		userEvent.keyboard("{enter}");

		await waitFor(() => expect(selectNetworkInput).toHaveValue("ARK Devnet"));

		userEvent.type(screen.getByTestId("contact-form__address-input"), "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib");

		await waitFor(() => {
			expect(screen.getByTestId("contact-form__add-address-btn")).not.toBeDisabled();
		});

		userEvent.click(screen.getByTestId("contact-form__add-address-btn"));

		await waitFor(() => {
			expect(screen.getByTestId("contact-form__save-btn")).toBeDisabled();
		});

		userEvent.click(screen.getByTestId("contact-form__save-btn"));

		expect(onSave).not.toHaveBeenCalled();
	});
});
