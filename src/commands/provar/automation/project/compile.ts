import * as fileSystem from 'node:fs';
import { spawnSync } from 'node:child_process';
import { SfCommand } from '@salesforce/sf-plugins-core';
import {
  errorMessages,
  sfCommandConstants,
  SfProvarCommandResult,
  populateResult,
  ErrorHandler,
  ProvarConfig,
  UserSupport,
  fileContainsString,
  getStringAfterSubstring,
  Messages,
} from '@provartesting/provardx-plugins-utils';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages(
  '@provartesting/provardx-plugins-automation',
  'provar.automation.project.compile'
);

export default class ProvarAutomationProjectCompile extends SfCommand<SfProvarCommandResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  private errorHandler: ErrorHandler = new ErrorHandler();

  public async run(): Promise<SfProvarCommandResult> {
    const { flags } = await this.parse(ProvarAutomationProjectCompile);
    const config: ProvarConfig = await ProvarConfig.loadConfig(this.errorHandler);
    const propertiesFilePath = config.get('PROVARDX_PROPERTIES_FILE_PATH')?.toString();
    if (propertiesFilePath === undefined || !fileSystem.existsSync(propertiesFilePath)) {
      this.errorHandler.addErrorsToList('MISSING_FILE', errorMessages.MISSING_FILE_ERROR);
      return populateResult(flags, this.errorHandler, messages, this.log.bind(this));
    }

    try {
      /* eslint-disable */
      const propertiesdata = fileSystem.readFileSync(propertiesFilePath, { encoding: 'utf8' });
      const propertiesInstance = JSON.parse(propertiesdata);
      const rawProperties = JSON.stringify(propertiesInstance);
      const userSupport = new UserSupport();
      const updateProperties = userSupport.prepareRawProperties(rawProperties);

      const provarDxJarPath = propertiesInstance.provarHome + '/provardx/provardx.jar';
      const projectCompilecommand =
        'java -cp "' +
        provarDxJarPath +
        '"' +
        sfCommandConstants.DX_COMMAND_EXECUTER +
        updateProperties +
        ' ' +
        'NA' +
        ' ' +
        'Compile';
      const javaProcessOutput = spawnSync(projectCompilecommand, { shell: true });
      const compileSuccessMessage = 'Compile task finished sucessfully.';
      if (!fileContainsString(javaProcessOutput.stderr.toString(), compileSuccessMessage)) {
        let errorMessage = getStringAfterSubstring(javaProcessOutput.stderr.toString(), 'ERROR');
        if (!errorMessage) {
          errorMessage = getStringAfterSubstring(javaProcessOutput.stderr.toString(), 'Compilation task failed.');
        }
        this.errorHandler.addErrorsToList('COMPILATION_ERROR', `${errorMessage}`);
      }
    } catch (error: any) {
      if (error.name === 'SyntaxError') {
        this.errorHandler.addErrorsToList('MALFORMED_FILE', errorMessages.MALFORMED_FILE_ERROR);
      } else if (error.name === 'MultipleFailureError') {
        return populateResult(flags, this.errorHandler, messages, this.log.bind(this));
      } else {
        this.errorHandler.addErrorsToList('COMPILATION_ERROR', `${error.errorMessage}`);
      }
    }

    return populateResult(flags, this.errorHandler, messages, this.log.bind(this));
  }
}
