"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
function activate(context) {
    console.log('SIID Salesforce extension is now active');
    // Register URI handler
    const uriHandler = new SiidUriHandler();
    context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));
    // Register setup command
    let disposable = vscode.commands.registerCommand('siid-salesforce.setupOrg', async () => {
        vscode.window.showInformationMessage('SIID Salesforce Setup command executed');
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
class SiidUriHandler {
    async handleUri(uri) {
        console.log('Received URI:', uri.toString());
        try {
            // Parse the URI: siid://sessionId?instanceUrl=https://instance.salesforce.com
            const sessionId = uri.authority;
            const queryParams = new URLSearchParams(uri.query);
            const instanceUrl = queryParams.get('instanceUrl');
            if (!sessionId) {
                vscode.window.showErrorMessage('No session ID provided in URI');
                return;
            }
            if (!instanceUrl) {
                vscode.window.showErrorMessage('No instance URL provided in URI');
                return;
            }
            vscode.window.showInformationMessage(`Starting Salesforce setup with session ID and instance URL...`);
            // Start the setup process
            await this.setupSalesforceProject(sessionId, instanceUrl);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Error handling URI: ${errorMessage}`);
            console.error('Error handling URI:', error);
        }
    }
    async setupSalesforceProject(sessionId, instanceUrl) {
        // Step 1: Check if we have a workspace folder
        const workspaceFolder = await this.getOrCreateWorkspaceFolder();
        if (!workspaceFolder) {
            return;
        }
        // Step 2: Check if this is a Salesforce project
        const isSalesforceProject = await this.checkSalesforceProject(workspaceFolder);
        if (!isSalesforceProject) {
            // Step 3: Create Salesforce project if not exists
            await this.createSalesforceProject(workspaceFolder);
        }
        // Step 4: Authenticate org with session ID
        await this.authenticateOrg(sessionId, instanceUrl, workspaceFolder);
        // Step 5: Retrieve metadata
        await this.retrieveMetadata(workspaceFolder);
    }
    async getOrCreateWorkspaceFolder() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            return workspaceFolders[0].uri.fsPath;
        }
        // Ask user to select or create a folder
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            openLabel: 'Select Workspace Folder'
        });
        if (folderUri && folderUri.length > 0) {
            const folderPath = folderUri[0].fsPath;
            // Open the folder as workspace
            await vscode.commands.executeCommand('vscode.openFolder', folderUri[0]);
            return folderPath;
        }
        vscode.window.showErrorMessage('No workspace folder selected');
        return undefined;
    }
    async checkSalesforceProject(workspaceFolder) {
        const sfdxProjectPath = path.join(workspaceFolder, 'sfdx-project.json');
        return fs.existsSync(sfdxProjectPath);
    }
    async createSalesforceProject(workspaceFolder) {
        vscode.window.showInformationMessage('Creating Salesforce project...');
        try {
            // Use sf project generate command
            const projectName = path.basename(workspaceFolder);
            const { stdout, stderr } = await execAsync(`sf project generate --name "${projectName}"`, { cwd: path.dirname(workspaceFolder) });
            console.log('Project created:', stdout);
            if (stderr) {
                console.warn('Project creation warnings:', stderr);
            }
            vscode.window.showInformationMessage('Salesforce project created successfully');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to create Salesforce project: ${errorMessage}`);
        }
    }
    async authenticateOrg(sessionId, instanceUrl, workspaceFolder) {
        vscode.window.showInformationMessage('Authenticating Salesforce org...');
        try {
            // Extract instance URL (up to .com)
            const urlMatch = instanceUrl.match(/^(https?:\/\/[^\/]+\.salesforce\.com)/);
            const cleanInstanceUrl = urlMatch ? urlMatch[1] : instanceUrl;
            console.log('Authenticating with instance URL:', cleanInstanceUrl);
            console.log('Session ID length:', sessionId.length);
            // Use sf org login access-token command
            const authCommand = `sf org login access-token --instance-url "${cleanInstanceUrl}" --access-token "${sessionId}" --set-default --alias siid-org`;
            const { stdout, stderr } = await execAsync(authCommand, { cwd: workspaceFolder });
            console.log('Auth output:', stdout);
            if (stderr) {
                console.warn('Auth warnings:', stderr);
            }
            vscode.window.showInformationMessage('Org authenticated successfully');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to authenticate org: ${errorMessage}`);
        }
    }
    async retrieveMetadata(workspaceFolder) {
        vscode.window.showInformationMessage('Retrieving metadata from org...');
        try {
            // Retrieve ApexClass, LWC, Aura, ApexTrigger, and Lightning types
            const metadataTypes = [
                'ApexClass',
                'LightningComponentBundle', // LWC
                'AuraDefinitionBundle', // Aura
                'ApexTrigger',
                'CustomObject' // For lightning types/custom objects
            ];
            // Use sf project retrieve start command
            const retrieveCommand = `sf project retrieve start --metadata ${metadataTypes.join(',')} --target-org siid-org`;
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Retrieving metadata...',
                cancellable: false
            }, async (progress) => {
                progress.report({ message: 'Fetching metadata from org...' });
                const { stdout, stderr } = await execAsync(retrieveCommand, { cwd: workspaceFolder });
                console.log('Retrieve output:', stdout);
                if (stderr) {
                    console.warn('Retrieve warnings:', stderr);
                }
                return Promise.resolve();
            });
            vscode.window.showInformationMessage('Metadata retrieved successfully! Check your workspace for the files.');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Don't throw here, just show warning as some metadata might not exist
            vscode.window.showWarningMessage(`Metadata retrieval completed with warnings: ${errorMessage}`);
            console.warn('Metadata retrieval warning:', error);
        }
    }
}
//# sourceMappingURL=extension.js.map