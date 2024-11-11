import {
  ErrorHandler,
  GenericErrorHandler,
  SfProvarCommandResult,
  SFProvarResult,
} from '@provartesting/provardx-plugins-utils';
import { Messages } from '@salesforce/core';

/* eslint-disable */
export class SfProvarAutomationTestRun extends SFProvarResult {
  /**
   * Declaring return type and populating return object for async run method of the commands.
   *
   */

  public populateResult(
    flags: any,
    errorHandler: ErrorHandler | GenericErrorHandler,
    messages: Messages<string>,
    log: Function
  ): SfProvarCommandResult {
    let result: SfProvarCommandResult = { success: true };

    const errorObjects: Error[] | object[] = errorHandler.getErrors();
    if (errorObjects.length > 0) {
      if (!flags['json']) {
        log();
        throw messages.createError('error.MultipleFailure', errorHandler.errorsToStringArray());
      }
      result = {
        success: false,
        errors: errorObjects,
      };
    } else {
      if (flags['output-file']) {
        log(`The test results are stored in ${flags['output-file']}`);
      } else {
        log();
        messages.messages.has('success_message') ? log(messages.getMessage('success_message')) : '';
      }
    }
    return result;
  }
}
