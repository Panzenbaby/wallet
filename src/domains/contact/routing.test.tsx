/* eslint-disable react/display-name */
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { RouterView } from "router";
import { render, screen } from "utils/testing-library";

describe("ContactRoutes", () => {
	it("should render", () => {
		const { asFragment } = render(
			<MemoryRouter>
				<RouterView routes={[{ component: () => <h1>ContactRoutes</h1>, path: "/" }]} />
			</MemoryRouter>,
		);

		expect(screen.getByText("ContactRoutes")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});
});
