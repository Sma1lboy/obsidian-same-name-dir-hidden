import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	WorkspaceLeaf,
} from "obsidian";

interface MyPluginSettings {
	turnHiddenFileOn: boolean;
	turnStatusTextBar: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	turnHiddenFileOn: true,
	turnStatusTextBar: true,
};

export default class MainPlugin extends Plugin {
	settings: MyPluginSettings;
	statusBarItemEl: HTMLElement;
	fileExplorer?: WorkspaceLeaf;
	originFiles?: any;
	firstTime = true;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this));

		this.statusBarItemEl = this.addStatusBarItem();

		this.addCommand({
			id: "toggle-hidden-folder",
			name: "Toggle Hidden Folder",
			callback: () => {
				this.update();
			},
		});

		this.app.workspace.onLayoutReady(() => {
			this.fileExplorer = this.getFileExplorer();

			this.registerEvent(
				this.app.vault.on("create", () => {
					this.update();
				})
			);
			this.registerEvent(
				this.app.vault.on("modify", () => {
					this.update();
				})
			);
			this.registerEvent(
				this.app.vault.on("delete", () => {
					this.update();
				})
			);
			this.registerEvent(
				this.app.vault.on("rename", () => {
					this.update();
				})
			);
			this.registerInterval(
				window.setInterval(() => {
					this.update();
				}, 1000)
			);
		});
	}

	getFileExplorer(): WorkspaceLeaf | undefined {
		return this.app.workspace.getLeavesOfType("file-explorer")[0];
	}
	getFileExplorerContainer() : object {
		return this.fileExplorer?.containerEl?.children[1].children[1]
			.children[0]?.children[1];
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

	/**
	 * Update the current status for current plugin.
	 */
	update() {
		//TODO Testing console, remember to remove it 
		this.statusBarItemEl.setText(this.settings.turnStatusTextBar ? ("Hidden turn " + (this.settings.turnHiddenFileOn ? "on" : "off")) : "");
		if (this.settings.turnHiddenFileOn) {
			this.updateExplorer();
		} else if(!this.firstTime) {
			this.firstTime = true;
			const fileExplorerContainer = this.getFileExplorerContainer();
			this.updateExplorerList(fileExplorerContainer, this.originFiles)
		}
	}
	updateExplorerList(container : any, files : any) {
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}
		files.forEach((item) => {
			container.appendChild(item.cloneNode(true));
		});
	}

	/**
	 * Found All folder and all files
	 * @param currDir current folder
	 * @param files 
	 * @param folders 
	 */
	getAllFolderAndDir(currDir, files, folders, items) {
		if(currDir.children[0].classList[0]==="tree-item-self") {
			return;
		}

		
		Array.from(currDir.children).forEach(item => {
			if (item.classList[1] === "nav-folder") {
				folders.push([
					item.children[0].getAttribute("data-path") + ".md",
					item,
				]);
				this.getAllFolderAndDir(item, files, folders, items)
			} else if (item.classList[1] === 'nav-file') {
				console.log(item)

				files.push(item);
			}
			items.push(item)
		})
		
	}
	getAllElementRemoveSameNameDir(fileExplorerContainer : any) {
		
		const folders : any = [];
		const files : any = [];
		const items : any = [];

		this.getAllFolderAndDir(fileExplorerContainer, files, folders, items)
		console.log(items)
		//if file has same name as folder, remove it from items.
		files.forEach((item) => {
			const fileName = item.children[0].getAttribute("data-path");
			const find = folders.find((i) => i[0] === fileName);
			if (find) {
				items.remove(find[1]);
			}
		});
		return items;
	}
	updateExplorer() {
		const fileExplorerContainer = this.getFileExplorerContainer();
		if (!fileExplorerContainer) {
			return;
		} 
		if(this.firstTime) {
			this.firstTime = false;
			this.originFiles = this.getFilteredItems(fileExplorerContainer, "tree-item").map(item => item.cloneNode(true));
		}
		const items = this.getAllElementRemoveSameNameDir(fileExplorerContainer)
		this.updateExplorerList(fileExplorerContainer, items)
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
						this.plugin.update();
					}) 
			);
			new Setting(containerEl)
			.setName("Turn Status Text Bar On")
			.setDesc(
				"Turn on shown the plugin status on bottom right"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.turnStatusTextBar)
					.onChange(async (value) => {
						this.plugin.settings.turnStatusTextBar = value;
						await this.plugin.saveSettings();
						this.plugin.update();
					}) 
			);
	}
}
