import * as fileSystem from 'node:fs';
import { spawn } from 'node:child_process';
import * as path from 'node:path';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { xml2json } from 'xml-js';
import {
  sfCommandConstants,
  errorMessages,
  ProvarConfig,
  UserSupport,
  getStringAfterSubstring,
  checkNestedProperty,
  GenericErrorHandler,
  TestRunError,
  GenericError,
  SfProvarCommandResult,
  Messages,
} from '@provartesting/provardx-plugins-utils';
import { SfProvarAutomationTestRunResult } from '../../../../result/sfProvarAutomationTestRunResult.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const mdFile: string = 'provar.automation.test.run';
const messages = Messages.loadMessages('@provartesting/provardx-plugins-automation', mdFile);

export default class ProvarAutomationTestRun extends SfCommand<SfProvarCommandResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'output-file': Flags.string({
      summary: messages.getMessage('flags.output-file.summary'),
      char: 'o',
    }),
  };
  private genericErrorHandler: GenericErrorHandler = new GenericErrorHandler();

  public async run(): Promise<SfProvarCommandResult> {
    const { flags } = await this.parse(ProvarAutomationTestRun);
    const config: ProvarConfig = await ProvarConfig.loadConfig(this.genericErrorHandler);
    const propertiesFilePath = config.get('PROVARDX_PROPERTIES_FILE_PATH')?.toString();
    const sfProvarAutomationTestRunResult = new SfProvarAutomationTestRunResult();

    if (propertiesFilePath === undefined || !fileSystem.existsSync(propertiesFilePath)) {
      const errorObj: GenericError = new GenericError();
      errorObj.setCode('MISSING_FILE');
      errorObj.setMessage(errorMessages.MISSING_FILE_ERROR);
      this.genericErrorHandler.addErrorsToList(errorObj);
      return sfProvarAutomationTestRunResult.populateResult(
        flags,
        this.genericErrorHandler,
        messages,
        this.log.bind(this)
      );
    }

    try {
      /* eslint-disable */
      const propertiesData = fileSystem.readFileSync(propertiesFilePath, { encoding: 'utf8' });
      const propertiesInstance = JSON.parse(propertiesData);
      if (propertiesInstance?.testCase) {
        propertiesInstance.testCase = propertiesInstance.testCase.map((testCasePath: string) => {
          if (testCasePath.startsWith('/tests')) {
            return getStringAfterSubstring(testCasePath, '/tests');
          } else if (testCasePath.startsWith('tests')) {
            return getStringAfterSubstring(testCasePath, 'tests');
          }
          return testCasePath;
        });
      }
      if (propertiesInstance?.testPlan) {
        propertiesInstance.testPlan = propertiesInstance.testPlan.map((testCasePathInstance: string) => {
          if (testCasePathInstance.startsWith('/plans')) {
            return getStringAfterSubstring(testCasePathInstance, '/plans');
          } else if (testCasePathInstance.startsWith('plans')) {
            return getStringAfterSubstring(testCasePathInstance, 'plans');
          }
          return testCasePathInstance;
        });
      }
      const rawProperties = JSON.stringify(propertiesInstance);
      const userSupport = new UserSupport();
      const updateProperties = userSupport.prepareRawProperties(rawProperties);
      const userInfo = await userSupport.getDxUsersInfo(
        propertiesInstance.connectionOverride,
        this.genericErrorHandler
      );
      if (userInfo === null) {
        return sfProvarAutomationTestRunResult.populateResult(
          flags,
          this.genericErrorHandler,
          messages,
          this.log.bind(this)
        );
      }
      const userInfoString = userSupport.prepareRawProperties(JSON.stringify({ dxUsers: userInfo }));
      const projectPath = propertiesInstance.projectPath;
      if (!fileSystem.existsSync(projectPath)) {
        const errorObj: GenericError = new GenericError();
        errorObj.setCode('INVALID_PATH');
        errorObj.setMessage('projectPath does not exist');
        this.genericErrorHandler.addErrorsToList(errorObj);
        return sfProvarAutomationTestRunResult.populateResult(
          flags,
          this.genericErrorHandler,
          messages,
          this.log.bind(this)
        );
      }

      const provarDxJarPath = propertiesInstance.provarHome + '/provardx/provardx.jar';
      const testRunCommand =
        'java -cp "' +
        provarDxJarPath +
        '"' +
        sfCommandConstants.DX_COMMAND_EXECUTER +
        updateProperties +
        ' ' +
        userInfoString +
        ' Runtests';

      await this.runJavaCommand(testRunCommand, flags['output-file'] ?? '');
    } catch (error: any) {
      if (error.name === 'SyntaxError') {
        const errorObj: GenericError = new GenericError();
        errorObj.setCode('MALFORMED_FILE');
        errorObj.setMessage(errorMessages.MALFORMED_FILE_ERROR);
        this.genericErrorHandler.addErrorsToList(errorObj);
      } else if (error.name === 'MultipleFailureError') {
        return sfProvarAutomationTestRunResult.populateResult(
          flags,
          this.genericErrorHandler,
          messages,
          this.log.bind(this)
        );
      } else {
        const errorObj: GenericError = new GenericError();
        errorObj.setCode('GENERIC_ERROR');
        errorObj.setMessage(`${error.errorMessage}`);
        this.genericErrorHandler.addErrorsToList(errorObj);
      }
    }
    return sfProvarAutomationTestRunResult.populateResult(
      flags,
      this.genericErrorHandler,
      messages,
      this.log.bind(this)
    );
  }

  private async runJavaCommand(command: string, logFilePath: string): Promise<void> {
    const resolvers: any = {
      done: null,
      error: null,
    };
    const promise = new Promise<void>((resolve, error) => {
      resolvers.done = resolve;
      resolvers.error = error;
    });
    try {
      const javaProcessOutput = spawn(command, { shell: true, stdio: ['pipe', 'pipe', 'pipe'] });

      javaProcessOutput.stdout.on('data', (data: { toString: () => string }) => {
        const logMessage = data.toString().trim();
        this.extractReportAndAddFailuresToErrorHandler(logMessage, logFilePath);
      });
      javaProcessOutput.stderr.on('error', (error: { toString: () => string }) => {
        const logError = error.toString().trim();
        this.extractReportAndAddFailuresToErrorHandler(logError, logFilePath);
      });
      javaProcessOutput.stderr.on('data', (error: { toString: () => string }) => {
        const logError = error.toString().trim();
        this.extractReportAndAddFailuresToErrorHandler(logError, logFilePath);
      });

      javaProcessOutput.stderr.on('finish', (error: { toString: () => string }) => {
        resolvers.done();
      });
    } catch (error: any) {
      return;
    }
    return promise;
  }

  private extractReportAndAddFailuresToErrorHandler(logMessage: string, logFilePath: string): void {
    const successMessage = 'JUnit XML report written successfully.';
    if (logMessage.includes(successMessage)) {
      const xmlJunitReportPath = getStringAfterSubstring(logMessage, successMessage);
      this.getFailureMessagesFromXML(xmlJunitReportPath);
    } else if (logMessage.includes('cause: [Exception')) {
      const errorObj: GenericError = new GenericError();
      errorObj.setCode('TEST_RUN_ERROR');
      errorObj.setMessage(`Error ${getStringAfterSubstring(logMessage, 'Error')}`);
      this.genericErrorHandler.addErrorsToList(errorObj);
    }

    if (logFilePath) {
      try {
        fileSystem.appendFileSync(path.resolve(logFilePath), logMessage, { encoding: 'utf-8' });
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          const error: GenericError = new GenericError();
          error.setCode('INVALID_PATH');
          error.setMessage(`The provided output file path does not exist or is invalid.`);
          this.genericErrorHandler.addErrorsToList(error);
        } else if (error.code === 'EPERM' || error.code === 'EACCES') {
          const error: GenericError = new GenericError();
          error.setCode('INSUFFICIENT_PERMISSIONS');
          error.setMessage('The user does not have permissions to create the output file.');
          this.genericErrorHandler.addErrorsToList(error);
        }
        throw error;
      }
    } else {
      this.log(logMessage);
    }
  }

  private getFailureMessagesFromXML(filePath: string): void {
    if (fileSystem.existsSync(filePath)) {
      const xmlContent = fileSystem.readFileSync(filePath, 'utf8');
      const dataString = xml2json(xmlContent, { compact: true });
      const jsonData = JSON.parse(dataString);
      const testsuiteJson = jsonData?.testsuite;
      if (testsuiteJson?.testcase) {
        if (Array.isArray(testsuiteJson?.testcase)) {
          for (let testCase of testsuiteJson?.testcase) {
            this.addTestcaseFailures(testCase);
          }
        } else {
          this.addTestcaseFailures(testsuiteJson?.testcase);
        }
      } else {
      }
    }
  }
  private addTestcaseFailures(testCase: any) {
    if (checkNestedProperty(testCase, 'failure')) {
      const errorObj: TestRunError = new TestRunError();
      errorObj.setTestCasePath(`${testCase?._attributes.name}`);
      errorObj.setMessage(`${testCase?.failure._cdata}.`);
      this.genericErrorHandler.addErrorsToList(errorObj);
    }
  }
}
