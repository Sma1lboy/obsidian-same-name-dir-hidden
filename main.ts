import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	WorkspaceLeaf,
} from "obsidian";

interface MyPluginSettings {
	turnHiddenFileOn: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	turnHiddenFileOn: true,
};

export default class MainPlugin extends Plugin {
	settings: MyPluginSettings;
	statusBarItemEl: HTMLElement;
	fileExplorer?: WorkspaceLeaf;
	update() {
		this.statusBarItemEl.setText(
			"Hidden turn " + (this.settings.turnHiddenFileOn ? "on" : "off")
		);
	}
	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this));

		this.statusBarItemEl = this.addStatusBarItem();
		this.update();

		this.addCommand({
			id: "toggle-hidden-folder",
			name: "Toggle Hidden Folder",
			callback: () => {
				this.settings.turnHiddenFileOn =
					!this.settings.turnHiddenFileOn;
				this.update();
			},
		});

		this.fileExplorer = this.getFileExplorer();
		const fileExplorerContainer = this.getFileExplorerContainer();

		const items = this.getFilteredItems(fileExplorerContainer, "tree-item");

		this.app.workspace.onLayoutReady(() => {
			this.updateExplorer(items, fileExplorerContainer);
		});

		this.registerEvent(
			this.app.vault.on("create", () => {
				this.updateExplorer(items, fileExplorerContainer);
			})
		);
		this.registerEvent(
			this.app.vault.on("modify", () => {
				this.updateExplorer(items, fileExplorerContainer);
			})
		);
		this.registerEvent(
			this.app.vault.on("delete", () => {
				this.updateExplorer(items, fileExplorerContainer);
			})
		);
		this.registerEvent(
			this.app.vault.on("rename", () => {
				this.updateExplorer(items, fileExplorerContainer);
			})
		);
		this.registerEvent(
			this.app.vault.on("rename", () => {
				this.updateExplorer(items, fileExplorerContainer);
			})
		);
	}

	getFileExplorerContainer() {
		const fileExplorerDiv = this.fileExplorer.containerEl;
		return fileExplorerDiv.children[1].children[1].children[0].children[1];
	}

	getFilteredItems(container, filterClass) {
		return Array.from(container.children).filter((c) =>
			c.classList.contains(filterClass)
		);
	}

	getItemsByClass(items, className) {
		return items
			.filter((item) => item.classList.contains(className))
			.map((item) => ({
				path: item.children[0].getAttribute("data-path") + ".md",
				element: item,
			}));
	}

	updateExplorer(items, fileExplorerContainer) {
		let folder = [];
		items.forEach((item) => {
			if (item.classList[1] === "nav-folder") {
				console.log(item.children[0].getAttribute("data-path"));
				folder.push([
					item.children[0].getAttribute("data-path") + ".md",
					item,
				]);
			}
		});

		let files = items.filter((item) => item.classList[1] === "nav-file");

		files.forEach((item) => {
			let fileName = item.children[0].getAttribute("data-path");
			let find = folder.find((i) => i[0] === fileName);
			if (find) {
				items.remove(find[1]);
			}
		});
		while (fileExplorerContainer.firstChild) {
			fileExplorerContainer.removeChild(fileExplorerContainer.firstChild);
		}

		console.log(fileExplorerContainer.childNodes);
		items.forEach((item) => {
			fileExplorerContainer.appendChild(item.cloneNode(true));
			console.log("done appends");
		});
	}

	getFileExplorer(): WorkspaceLeaf | undefined {
		return this.app.workspace.getLeavesOfType("file-explorer")[0];
	}

	patchExplorerFolder() {
		this.fileExplorer = this.getFileExplorer();
	}

	onunload() {
		console.log("unload project");
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SettingTab extends PluginSettingTab {
	plugin: MainPlugin;

	constructor(app: App, plugin: MainPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Turn Hidden File On")
			.setDesc(
				"Turn on will hidden same directory name as same file name"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.turnHiddenFileOn)
					.onChange(async (value) => {
						this.plugin.settings.turnHiddenFileOn = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
