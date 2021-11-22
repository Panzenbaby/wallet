import { Contracts } from "@payvo/sdk-profiles";
import React from "react";
import { env, fireEvent, getDefaultProfileId, render, screen, waitFor } from "utils/testing-library";

import { ResetProfile } from "./ResetProfile";

let profile: Contracts.IProfile;

describe("ResetProfile", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		profile.settings().set(Contracts.ProfileSetting.Theme, "dark");
		env.persist();
	});

	it("should render", async () => {
		const { asFragment } = render(<ResetProfile isOpen profile={profile} />);

		await screen.findByTestId("modal__inner");

		expect(screen.getByTestId("ResetProfile__submit-button")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should reset profile", async () => {
		const onReset = jest.fn();

		render(<ResetProfile isOpen profile={profile} onReset={onReset} />);

		const theme = profile.settings().get(Contracts.ProfileSetting.Theme);

		await screen.findByTestId("modal__inner");

		fireEvent.click(screen.getByTestId("ResetProfile__submit-button"));

		await waitFor(() => expect(profile.settings().get(Contracts.ProfileSetting.Theme)).not.toBe(theme));

		expect(onReset).toHaveBeenCalledWith();
	});
});
