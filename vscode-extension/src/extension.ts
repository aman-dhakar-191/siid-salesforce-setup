import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export function activate(context: vscode.ExtensionContext) {
    console.log('SIID Salesforce extension is now active');

    // Create output channel for logging
    const outputChannel = vscode.window.createOutputChannel('SIID Salesforce Setup');
    context.subscriptions.push(outputChannel);

    // Register URI handler
    const uriHandler = new SiidUriHandler(context, outputChannel);
    context.subscriptions.push(
        vscode.window.registerUriHandler(uriHandler)
    );

    // Register setup command
    let disposable = vscode.commands.registerCommand('siid-salesforce.setupOrg', async () => {
        vscode.window.showInformationMessage('SIID Salesforce Setup command executed');
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

class SiidUriHandler implements vscode.UriHandler {
    constructor(
        private context: vscode.ExtensionContext,
        private outputChannel: vscode.OutputChannel
    ) {}

    private log(message: string) {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
    }

    private logError(message: string, error?: any) {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ERROR: ${message}`);
        if (error) {
            this.outputChannel.appendLine(`[${timestamp}] ${error}`);
        }
    }

    async handleUri(uri: vscode.Uri): Promise<void> {
        this.log(`Received URI: ${uri.toString()}`);
        this.log(`URI path: ${uri.path}`);
        this.log(`URI query: ${uri.query}`);
        this.outputChannel.show();
        
        try {
            // Validate URI path
            if (uri.path !== '/setup') {
                const errorMsg = `Invalid URI path: ${uri.path}. Expected /setup`;
                this.logError(errorMsg);
                vscode.window.showErrorMessage(errorMsg);
                return;
            }

            // Parse the URI: vscode://siid.siid-salesforce-vscode/setup?sessionId=...&instanceUrl=...
            const queryParams = new URLSearchParams(uri.query);
            const sessionId = queryParams.get('sessionId');
            const instanceUrl = queryParams.get('instanceUrl');

            if (!sessionId) {
                this.logError('No session ID provided in URI');
                vscode.window.showErrorMessage('No session ID provided in URI');
                return;
            }

            if (!instanceUrl) {
                this.logError('No instance URL provided in URI');
                vscode.window.showErrorMessage('No instance URL provided in URI');
                return;
            }

            this.log(`Starting Salesforce setup for instance: ${instanceUrl}`);
            vscode.window.showInformationMessage(`Starting Salesforce setup...`);

            // Start the setup process
            await this.setupSalesforceProject(sessionId, instanceUrl);
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logError(`Error handling URI: ${errorMessage}`, error);
            vscode.window.showErrorMessage(`Error handling URI: ${errorMessage}`);
        }
    }

    async setupSalesforceProject(sessionId: string, instanceUrl: string): Promise<void> {
        try {
            // Authenticate first (creates auth file globally)
            this.log('Authenticating Salesforce org...');
            await this.authenticateOrg(sessionId, instanceUrl);

            // Get org info
            const orgInfo = await this.getOrgInfoFromAuthenticated();
            if (!orgInfo) {
                this.logError('Failed to retrieve org information');
                return;
            }

            this.log(`Org Name: ${orgInfo.username}, Org ID: ${orgInfo.id}`);

            // Check if we already have a project for this org
            const existingProject = await this.getExistingProject(orgInfo.username);
            
            if (existingProject && fs.existsSync(existingProject)) {
                this.log(`Found existing project for org: ${existingProject}`);
                vscode.window.showInformationMessage(`Found existing project for ${orgInfo.username}. Retrieving latest data...`);
                
                // Retrieve latest metadata in existing project
                await this.retrieveMetadata(existingProject);
                
                // Open existing project
                this.log(`Opening existing project: ${existingProject}`);
                vscode.window.showInformationMessage('Setup complete! Opening project in new window...');
                const folderUri = vscode.Uri.file(existingProject);
                await vscode.commands.executeCommand('vscode.openFolder', folderUri, true);
            } else {
                // Create new project
                this.log('Creating new project...');
                const newProjectPath = await this.createNewProjectFolder(orgInfo.username);
                if (!newProjectPath) {
                    return;
                }

                // Store project mapping
                await this.storeProjectMapping(orgInfo.username, newProjectPath);

                // Create Salesforce project structure
                await this.createSalesforceProject(newProjectPath);

                // Retrieve metadata
                await this.retrieveMetadata(newProjectPath);

                // After complete setup, open in new window
                this.log(`Setup complete for new project: ${newProjectPath}`);
                vscode.window.showInformationMessage('Setup complete! Opening project in new window...');
                const folderUri = vscode.Uri.file(newProjectPath);
                await vscode.commands.executeCommand('vscode.openFolder', folderUri, true);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logError(`Setup failed: ${errorMessage}`, error);
            vscode.window.showErrorMessage(`Setup failed: ${errorMessage}`);
        }
    }

    private async getOrgInfoFromAuthenticated(): Promise<{username: string, id: string} | undefined> {
        try {
            this.log('Retrieving org information from authenticated org...');
            
            // Get org display info
            const { stdout } = await execAsync('sf org display --target-org siid-org --json');
            const orgData = JSON.parse(stdout);
            
            if (orgData.result && orgData.result.username && orgData.result.id) {
                this.log(`Org info retrieved: ${orgData.result.username}`);
                return {
                    username: orgData.result.username,
                    id: orgData.result.id
                };
            }
            
            this.logError('Failed to parse org info from response');
            return undefined;
        } catch (error) {
            this.logError('Failed to retrieve org info', error);
            return undefined;
        }
    }

    private async getExistingProject(orgName: string): Promise<string | undefined> {
        const projectMappings = this.context.globalState.get<Record<string, string>>('projectMappings', {});
        return projectMappings[orgName];
    }

    private async storeProjectMapping(orgName: string, projectPath: string): Promise<void> {
        this.log(`Storing project mapping: ${orgName} -> ${projectPath}`);
        const projectMappings = this.context.globalState.get<Record<string, string>>('projectMappings', {});
        projectMappings[orgName] = projectPath;
        await this.context.globalState.update('projectMappings', projectMappings);
    }

    private async createNewProjectFolder(orgName?: string): Promise<string | undefined> {
        // Create a new folder automatically in user's home directory
        const homeDir = process.env.USERPROFILE || process.env.HOME || '';
        const timestamp = Date.now();
        const safeName = orgName ? orgName.replace(/[^a-zA-Z0-9_-]/g, '_') : 'project';
        const projectName = `${safeName}-${timestamp}`;
        const newProjectPath = path.join(homeDir, 'Documents', 'Salesforce Projects', projectName);
        
        try {
            // Create the directory
            if (!fs.existsSync(newProjectPath)) {
                fs.mkdirSync(newProjectPath, { recursive: true });
            }
            
            this.log(`Created new project folder: ${newProjectPath}`);
            vscode.window.showInformationMessage(`Creating new Salesforce project at: ${newProjectPath}`);
            return newProjectPath;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logError(`Failed to create project folder: ${errorMessage}`, error);
            vscode.window.showErrorMessage(`Failed to create project folder: ${errorMessage}`);
            return undefined;
        }
    }

    private async createSalesforceProject(workspaceFolder: string): Promise<void> {
        this.log('Creating Salesforce project structure...');
        vscode.window.showInformationMessage('Creating Salesforce project...');
        
        try {
            // Use sf project generate command
            const projectName = path.basename(workspaceFolder);
            const { stdout, stderr } = await execAsync(
                `sf project generate --name "${projectName}"`,
                { cwd: path.dirname(workspaceFolder) }
            );
            
            this.log(`Project created: ${stdout}`);
            if (stderr) {
                this.log(`Project creation warnings: ${stderr}`);
            }

            this.log('Salesforce project created successfully');
            vscode.window.showInformationMessage('Salesforce project created successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logError(`Failed to create Salesforce project: ${errorMessage}`, error);
            throw new Error(`Failed to create Salesforce project: ${errorMessage}`);
        }
    }

    private async authenticateOrg(sessionId: string, instanceUrl: string): Promise<void> {
        this.log('Authenticating Salesforce org...');
        vscode.window.showInformationMessage('Authenticating Salesforce org...');
        
        try {
            // Convert Lightning URL to My Domain URL
            // Lightning: https://co1754479384179.lightning.force.com
            // My Domain: https://co1754479384179.my.salesforce.com
            let actualInstanceUrl = instanceUrl;
            if (instanceUrl.includes('.lightning.force.com')) {
                actualInstanceUrl = instanceUrl.replace('.lightning.force.com', '.my.salesforce.com');
                this.log(`Converted Lightning URL to My Domain: ${actualInstanceUrl}`);
            } else {
                this.log(`Using instance URL as-is: ${actualInstanceUrl}`);
            }

            this.log(`Using SF_ACCESS_TOKEN environment variable for authentication`);

            // Use sf org login access-token with SF_ACCESS_TOKEN environment variable
            // This avoids any shell escaping issues with special characters in the token
            const authCommand = `sf org login access-token --instance-url ${actualInstanceUrl} --alias siid-org --set-default --no-prompt`;
            
            const { stdout, stderr } = await execAsync(authCommand, {
                env: {
                    ...process.env,
                    SF_ACCESS_TOKEN: sessionId
                }
            });
            
            this.log(`Auth output: ${stdout}`);
            if (stderr) {
                this.log(`Auth warnings: ${stderr}`);
            }

            this.log('Org authenticated successfully');
            vscode.window.showInformationMessage('Org authenticated successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logError(`Failed to authenticate org: ${errorMessage}`, error);
            throw new Error(`Failed to authenticate org: ${errorMessage}`);
        }
    }

    private async retrieveMetadata(workspaceFolder: string): Promise<void> {
        this.log('Retrieving metadata from org...');
        vscode.window.showInformationMessage('Retrieving metadata from org...');
        
        try {
            // Retrieve ApexClass, LWC, Aura, ApexTrigger, and Lightning types
            const metadataTypes = [
                'ApexClass',
                'LightningComponentBundle',  // LWC
                'AuraDefinitionBundle',       // Aura
                'ApexTrigger',
                'CustomObject'                // For lightning types/custom objects
            ];

            this.log(`Retrieving metadata types: ${metadataTypes.join(', ')}`);

            // Use sf project retrieve start command with multiple --metadata flags
            const metadataFlags = metadataTypes.map(type => `--metadata ${type}`).join(' ');
            const retrieveCommand = `sf project retrieve start ${metadataFlags} --target-org siid-org`;
            
            this.log(`Running command: ${retrieveCommand}`);
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Retrieving metadata...',
                cancellable: false
            }, async (progress) => {
                progress.report({ message: 'Fetching metadata from org...' });
                
                const { stdout, stderr } = await execAsync(retrieveCommand, { cwd: workspaceFolder });
                
                this.log(`Retrieve output: ${stdout}`);
                if (stderr) {
                    this.log(`Retrieve warnings: ${stderr}`);
                }
            });

            this.log('Metadata retrieved successfully');
            vscode.window.showInformationMessage('Metadata retrieved successfully! Check your workspace for the files.');
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Don't throw here, just show warning as some metadata might not exist
            this.logError(`Metadata retrieval completed with warnings: ${errorMessage}`, error);
            vscode.window.showWarningMessage(`Metadata retrieval completed with warnings: ${errorMessage}`);
        }
    }
}
