import { join } from "path";
import { debug, WorkspaceFolder } from "vscode";
import { ITestRunnerInterface } from "../interfaces/ITestRunnerInterface";
import { ConfigurationProvider } from "../providers/ConfigurationProvider";
import { TerminalProvider } from "../providers/TerminalProvider";

// TODO: Make a more generic test runner class and extend it
export class AvaTestRunner implements ITestRunnerInterface {
  public name: string = "ava";
  public path: string = join("node_modules", ".bin", this.name);
  public terminalProvider: TerminalProvider = null;
  public configurationProvider: ConfigurationProvider = null;

  constructor(
    configurationProvider: ConfigurationProvider,
    terminalProvider: TerminalProvider,
    path?: string
  ) {
    this.terminalProvider = terminalProvider;
    this.configurationProvider = configurationProvider;

    if (path) {
      this.path = path;
    }
  }

  public runWatch(
    rootPath: WorkspaceFolder,
    fileName: string,
    testName: string
  ) {
    const additionalArguments = this.configurationProvider.additionalArguments;
    const environmentVariables =
      this.configurationProvider.environmentVariables;

    const command = `${this.path} ${this.transformFileName(
      fileName
    )} -m "${testName}" --watch ${additionalArguments}`;

    const terminal = this.terminalProvider.get(
      { env: environmentVariables },
      rootPath
    );

    terminal.sendText(command, true);
    terminal.show(true);
  }

  public runTest(
    rootPath: WorkspaceFolder,
    fileName: string,
    testName: string
  ) {
    const additionalArguments = this.configurationProvider.additionalArguments;
    const environmentVariables =
      this.configurationProvider.environmentVariables;

    const command = `${this.path} ${this.transformFileName(
      fileName
    )} -m "${testName}" ${additionalArguments}`;

    const terminal = this.terminalProvider.get(
      { env: environmentVariables },
      rootPath
    );

    terminal.sendText(command, true);
    terminal.show(true);
  }

  public debugTest(
    rootPath: WorkspaceFolder,
    fileName: string,
    testName: string
  ) {
    const additionalArguments = this.configurationProvider.additionalArguments;
    const environmentVariables =
      this.configurationProvider.environmentVariables;
    const skipFiles = this.configurationProvider.skipFiles;

    debug.startDebugging(rootPath, {
      console: "integratedTerminal",
      env: environmentVariables,
      name: "Debug Test",
      outputCapture: "std",
      port: 9229,
      request: "launch",
      runtimeArgs: [
        "debug",
        "--break",
        "--serial",
        this.transformFileName(fileName),
        `--match="${testName}"`,
        ...additionalArguments.split(" ")
      ],
      runtimeExecutable: join(rootPath.uri.fsPath, this.path),
      skipFiles,
      type: "node"
    });
  }

  // We force slash instead of backslash for Windows
  private transformFileName(fileName: string) {
    return fileName.replace(/\\/g, "/");
  }
}
