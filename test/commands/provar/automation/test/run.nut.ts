import * as fileSystem from 'node:fs';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { errorMessages, commandConstants, SfProvarCommandResult } from '@provartesting/provardx-plugins-utils';
import * as validateConstants from '../../../../assertion/validateConstants.js';

describe('provar automation test run NUTs', () => {
  let session: TestSession;
  enum FILE_PATHS {
    MISSING_FILE = 'missingRunFile.json',
    TEST_RUN = 'testRun.json',
  }

  after(async () => {
    await session?.clean();
    Object.values(FILE_PATHS).forEach((filePath) => {
      fileSystem.unlink(filePath, (err) => {
        if (err) {
          return err;
        }
      });
    });
  });

  it('Boilerplate json file should not run if the file has not been loaded', () => {
    execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_CONFIG_GENERATE_COMMAND} -p ${FILE_PATHS.MISSING_FILE}`
    );
    interface PropertyFileJsonData {
      [key: string]: string | boolean | number;
    }
    const jsonFilePath = FILE_PATHS.MISSING_FILE;
    // reading the json data
    const jsonDataString = fileSystem.readFileSync(jsonFilePath, 'utf-8');
    const jsonData: PropertyFileJsonData = JSON.parse(jsonDataString) as PropertyFileJsonData;
    jsonData.provarHome = '';
    const updatedJsonDataString = JSON.stringify(jsonData, null, 2);
    fileSystem.writeFileSync(jsonFilePath, updatedJsonDataString, 'utf-8');
    execCmd<SfProvarCommandResult>(`${commandConstants.SF_PROVAR_AUTOMATION_CONFIG_LOAD_COMMAND}`);
    const res = execCmd<SfProvarCommandResult>(`${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND}`).shellOutput;
    expect(res.stderr).to.deep.equal(`Error (1): [MISSING_FILE] ${errorMessages.MISSING_FILE_ERROR}\n\n\n`);
  });

  it('Boilerplate json file should not run if the file has not been loaded and return result in json format', () => {
    const res = execCmd<SfProvarCommandResult>(`${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND} --json`, {
      ensureExitCode: 0,
    });
    expect(res.jsonOutput).to.deep.equal(validateConstants.missingFileJsonError);
  });
});
