import userEvent from "@testing-library/user-event";
import React from "react";
import { Column } from "react-table";

import { Table } from "./Table";
import { render, screen, within } from "@/utils/testing-library";

const data = [
	{
		col1: "column 1",
		col2: "column 2",
		col3: "column 3",
	},
	{
		col1: "column 1",
		col2: "column 2",
		col3: "column 3",
	},
];

const columns: Column<typeof data[number]>[] = [
	{
		Header: "Header 1",
		accessor: "col1",
		className: "flex-row-reverse",
		minimumWidth: true,
	},
	{
		Header: "Header 2",
		accessor: "col2",
		className: "no-border",
	},
	{
		Header: "Header 3",
		accessor: "col3",
		className: "justify-end",
	},
];

describe("Table", () => {
	it("should render", () => {
		const { container } = render(
			<Table columns={columns} data={data}>
				{() => (
					<tr>
						<td>1</td>
						<td>2</td>
					</tr>
				)}
			</Table>,
		);

		expect(container).toMatchSnapshot();
	});

	it("should render empty rows if template is not provided", async () => {
		const { container } = render(<Table columns={columns} data={[data[0]]} />);

		await expect(within(screen.getAllByRole("rowgroup")[1]).findAllByRole("row")).resolves.toHaveLength(1);
		await expect(within(screen.getAllByRole("rowgroup")[1]).findByTestId("TableRow")).rejects.toThrow(
			/Unable to find an element by/,
		);

		expect(container).toMatchSnapshot();
	});

	it("should change sort order on th click", () => {
		render(<Table columns={columns} data={data} />);

		const th = screen.getAllByRole("columnheader")[0];

		userEvent.click(th);

		expect(th).toHaveTextContent("chevron-down-small.svg");

		expect(within(th).getByRole("img")).toHaveClass("rotate-180");

		userEvent.click(th);

		expect(within(th).getByRole("img")).not.toHaveClass("rotate-180");
	});

	it("should hide header", () => {
		render(<Table hideHeader columns={columns} data={data} />);

		expect(screen.queryAllByRole("columnheader")).toHaveLength(0);
	});

	it("should render with width class applied to column header", () => {
		render(
			<Table
				columns={[
					{
						Header: "Header 1",
						cellWidth: "width",
					},
				]}
				data={data}
			/>,
		);

		expect(screen.getByTestId("table__th--0")).toHaveClass("width");
	});

	it("should split rows", async () => {
		const { container } = render(<Table columns={columns} data={data} rowsPerPage={1} />);

		// expect(screen.getAllByRole("rowgroup")[1].querySelectorAll("tr")).toHaveLength(1);
		await expect(within(screen.getAllByRole("rowgroup")[1]).findAllByRole("row")).resolves.toHaveLength(1);

		expect(container).toMatchSnapshot();
	});
});
