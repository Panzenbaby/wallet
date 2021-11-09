import electron from "electron";
import fs from "fs";
import { PluginService, PluginServiceIdentifier } from "plugins/types";

export class FileSystemPluginService implements PluginService {
	config() {
		return {
			accessor: "filesystem",
			id: PluginServiceIdentifier.FileSystem,
		};
	}

	api() {
		return {
			askUserToOpenFile: this.askUserToOpenFile.bind(undefined),
			askUserToSaveFile: this.askUserToSaveFile.bind(undefined),
		};
	}

	private async askUserToSaveFile(content: string, suggestedFileName?: string) {
		const { canceled, filePath } = await electron.remote.dialog.showSaveDialog({defaultPath: suggestedFileName});

		if (canceled) {
			throw new Error('Canceled by user');
		}

		/* istanbul ignore next */
		if (!filePath) {
			return;
		}

		return fs.writeFileSync(filePath, content, "utf-8");
	}

	private async askUserToOpenFile() {
		const { filePaths } = await electron.remote.dialog.showOpenDialog({ properties: ["openFile"] });

		/* istanbul ignore next */
		if (!filePaths?.length) {
			return;
		}

		return fs.readFileSync(filePaths[0], "utf-8");
	}
}
