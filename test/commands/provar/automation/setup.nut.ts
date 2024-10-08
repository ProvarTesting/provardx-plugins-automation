import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { errorMessages, commandConstants, SfProvarCommandResult } from '@provartesting/provardx-plugins-utils';
import * as setupConstants from '../../../assertion/setupConstants.js';

describe('sf provar automation setup NUTs', () => {
  let testSession: TestSession;
  const SET_VALID_BUILD_VERSION = '2.13.2';

  after(async () => {
    await testSession?.clean();
  });

  it('Invalid build should not be installed using flag -v and return the error message', () => {
    const setInvalidBuildVersion = '7.12.1';
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_SETUP_COMMAND} -v ${setInvalidBuildVersion}`
    ).shellOutput;
    expect(result.stderr).to.deep.equal(
      `Error (1): [SETUP_ERROR] ${errorMessages.SETUP_ERROR}Provided version is not a valid version.\n\n`
    );
  });

  it('Invalid build should not be installed using flag --version and return the success result in json format', () => {
    const setInvalidBuildVersion = '21.345.00';
    const res = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_SETUP_COMMAND} --version ${setInvalidBuildVersion} --json`,
      {
        ensureExitCode: 0,
      }
    ).jsonOutput;
    expect(res).to.deep.equal(setupConstants.failureJsonMessage);
  });

  it('Build should be installed using flag -v and return the success output', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_SETUP_COMMAND} -v ${SET_VALID_BUILD_VERSION}`
    ).shellOutput;
    expect(result.stdout).to.deep.equal(setupConstants.successMessage);
  });

  if (process.platform === 'win32') {
    it('INSUFFICIENT_PERMISSIONS error on installing the build again using flag --version', () => {
      const res = execCmd<SfProvarCommandResult>(
        `${commandConstants.SF_PROVAR_AUTOMATION_SETUP_COMMAND} --version ${SET_VALID_BUILD_VERSION} --json`,
        {
          ensureExitCode: 0,
        }
      ).jsonOutput;
      expect(res).to.deep.equal(setupConstants.insufficientPermissions);
    });
  }
});
