/* eslint-disable react/display-name */
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { RouterView } from "router";
import { render, screen } from "utils/testing-library";

describe("PluginRoutes", () => {
	it("should render", () => {
		const { asFragment } = render(
			<MemoryRouter>
				<RouterView routes={[{ component: () => <h1>PluginRoutes</h1>, path: "/" }]} />
			</MemoryRouter>,
		);

		expect(screen.getByText("PluginRoutes")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});
});
