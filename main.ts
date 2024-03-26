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

		//command trigger shown/off folder
		this.addCommand({
			id: "trigger-on-off-hidden-folder",
			name: "Trigger Hidden folder",
			callback: () => {
				console.log("trigger");
				this.settings.turnHiddenFileOn =
					!this.settings.turnHiddenFileOn;

				this.update();
			},
		});
		this.addRibbonIcon("dice", "Print leaf types", () => {
			this.app.workspace.iterateAllLeaves((leaf) => {
				console.log(leaf.getViewState().type);
			});
		});
		this.app.workspace.onLayoutReady(() => {
			this.patchExplorerFolder();
			// this.fileExplorer!.requestSort();
		});
	}

	getFileExplorer(): WorkspaceLeaf | undefined {
		return this.app.workspace?.getLeafById(
			"file-explorer"
		) as WorkspaceLeaf;
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
