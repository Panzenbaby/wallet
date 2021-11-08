import { StubStorage } from "./StubStorage";

describe("StubStorage", () => {
	const stubStorage = new StubStorage();

	beforeEach(function () {
		stubStorage.flush();
	});

	it("should return current storage", async () => {
		await expect(stubStorage.all()).resolves.toEqual({});
	});

	it("should return set and get an entry into storage", async () => {
		await stubStorage.set("item", "bleh");

		await expect(stubStorage.get("item")).resolves.toEqual("bleh");
	});

	it("should return set and get an entry into storage", async () => {
		await stubStorage.set("item", "bleh");

		await expect(stubStorage.get("item")).resolves.toEqual("bleh");
	});

	it("should check if the storage has a key", async () => {
		await stubStorage.set("item", "bleh");

		await expect(stubStorage.has("item")).resolves.toEqual(true);
	});

	it("should forget a key", async () => {
		await stubStorage.set("item", "bleh");
		await stubStorage.forget("item");

		await expect(stubStorage.has("item")).resolves.toEqual(false);
	});

	it("should flush the storage", async () => {
		await stubStorage.set("item", "bleh");
		await stubStorage.flush();

		await expect(stubStorage.all()).resolves.toEqual({});
	});

	it("should return count", async () => {
		await expect(stubStorage.count()).resolves.toEqual(0);
	});

	it("should restore", async () => {
		await expect(stubStorage.restore()).resolves.toEqual(undefined);
	});
	it("should snapshot", async () => {
		await expect(stubStorage.snapshot()).resolves.toEqual(undefined);
	});
});
