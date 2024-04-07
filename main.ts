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
		return this.fileExplorer?.containerEl?.children[1].children[1].children[0]
	}
	getDirFilteredItems(dir, filterClass) {
		return Array.from(dir.children).filter((c) =>
			c.classList.contains(filterClass)
		);
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
	updateExplorer() {
		const fileExplorerContainer = this.getFileExplorerContainer();
		if (!fileExplorerContainer) {
			return;
		} 
		if(this.firstTime) {
			this.firstTime = false;
			this.originFiles = this.getDirFilteredItems(fileExplorerContainer, "tree-item").map(item => item.cloneNode(true));
		}
		const items = this.removeSameNameDir(fileExplorerContainer, true)
		this.updateExplorerList(fileExplorerContainer, items)
	}

	/**
	 * 
	 * @param dir current directory
	 * @param isRoot is current dir is Root of current explorer? A little diff in HTML view
	 * @returns file explorer object without any same name dir.
	 */
	removeSameNameDir(dir, isRoot) {
		if(dir.children.length == 1) {
			return null;
		}
		
		const folders : any = [];
		const files : any = [];
		const items : any = [];
		let iterateChild = isRoot ? dir : dir.children[1]; 
		Array.from(iterateChild.children).forEach(item => {
			if (item.classList[1] === "nav-folder") {
				let dataPath = item.children[0].getAttribute("data-path")
				folders.push([
					dataPath + ".md",
					item,
				]);
				console.log(dataPath)
			} else if (item.classList[1] === 'nav-file') {
				files.push(item);
			}
			items.push(item)
		})
		folders.forEach((folder) => {
			let subItems = this.removeSameNameDir(folder[1], false)
			
			if(subItems) {
				console.log("current folder:", folder, subItems)
				this.updateSubDirList(folder[1], subItems)
			}
		})
		//if file has same name as folder, remove it from items.
		files.forEach((item) => {
			const fileName = item.children[0].getAttribute("data-path");
			const find = folders.find((i) => i[0] === fileName);
			if (find) {
				// console.log("remove this file",fileName, item, isRoot, find)
				items.remove(find[1]);
			}
		});
		return items;
	}
	updateSubDirList(subDir, list) {
		subDir = subDir.children[1];
		while (subDir.firstChild) {
			subDir.removeChild(subDir.firstChild);
		}
		list.forEach((item) => {
			subDir.appendChild(item.cloneNode(true));
		});
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
