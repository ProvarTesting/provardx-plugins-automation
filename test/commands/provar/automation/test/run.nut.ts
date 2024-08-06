import * as fileSystem from 'node:fs';
import * as path from 'node:path';
import { execCmd } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { commandConstants, SfProvarCommandResult } from '@provartesting/provardx-plugins-utils';
// import * as validateConstants from '../../../../assertion/validateConstants.js';
import * as runConstants from '../../../../assertion/runConstants.js';
// import * as setupConstants from '../../../../assertion/setupConstants.js';

describe('provar automation test run NUTs', () => {
  // let session: TestSession;
  enum FILE_PATHS {
    MISSING_FILE = 'provardx-properties.json',
    TEST_RUN = 'testRun.json',
  }

  // after(async () => {
  //   await session?.clean();
  //   Object.values(FILE_PATHS).forEach((filePath) => {
  //     fileSystem.unlink(filePath, (err) => {
  //       if (err) {
  //         return err;
  //       }
  //     });
  //   });
  // });

  // it('Boilerplate json file should not run if the file has not been loaded', () => {
  //   // execCmd<SfProvarCommandResult>(
  //   //   `${commandConstants.SF_PROVAR_AUTOMATION_CONFIG_GENERATE_COMMAND} -p ${FILE_PATHS.MISSING_FILE}`
  //   // );
  //   type PropertyFileJsonData = {
  //     [key: string]: string | boolean;
  //   }
  //   function removeProperties(jsonObject: PropertyFileJsonData, propertiesToRemove: string[]): void {
  //     propertiesToRemove.forEach((property) => {
  //       // eslint-disable-next-line no-param-reassign
  //       delete jsonObject[property];
  //     });
  //   }
  //   const jsonFilePath = FILE_PATHS.MISSING_FILE;
  //   const jsonData = fileSystem.readFileSync(jsonFilePath, 'utf-8');
  //   const originalJsonData: PropertyFileJsonData = JSON.parse(jsonData) as PropertyFileJsonData;
  //   const propertiesToRemove: string[] = ['provarHome'];
  //   removeProperties(originalJsonData, propertiesToRemove);
  //   const updatedJsonData = JSON.stringify(originalJsonData, null, 2);
  //   fileSystem.writeFileSync(jsonFilePath, updatedJsonData, 'utf-8');
  //   expect(originalJsonData).to.not.have.all.keys(propertiesToRemove);
  //   // execCmd<SfProvarCommandResult>(`${commandConstants.SF_PROVAR_AUTOMATION_CONFIG_LOAD_COMMAND}`);
  //   const res = execCmd<SfProvarCommandResult>(`${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND}`).shellOutput;
  //   expect(res.stderr).to.deep.equal(`Error (1): [MISSING_FILE] ${errorMessages.MISSING_FILE_ERROR}\n\n\n`);
  // });

  // it('Boilerplate json file should not run if the file has not been loaded and return result in json format', () => {
  //   const res = execCmd<SfProvarCommandResult>(`${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND} --json`, {
  //     ensureExitCode: 0,
  //   });
  //   expect(res.jsonOutput).to.deep.equal(validateConstants.missingFileJsonError);
  // });

  // it('Build should be installed using flag -v and return the success output', () => {
  //   const result = execCmd<SfProvarCommandResult>(
  //     `${commandConstants.SF_PROVAR_AUTOMATION_SETUP_COMMAND} -v 2.12.1`
  //   ).shellOutput;
  //   expect(result.stdout).to.deep.equal(setupConstants.successMessage);
  // });

  it('Test Run command should be successful', () => {
    // execCmd<SfProvarCommandResult>(
    //   `${commandConstants.SF_PROVAR_AUTOMATION_CONFIG_GENERATE_COMMAND} -p ${FILE_PATHS.TEST_RUN}`
    // );
    // execCmd<SfProvarCommandResult>(
    //   `${commandConstants.SF_PROVAR_AUTOMATION_CONFIG_LOAD_COMMAND} -p ${FILE_PATHS.TEST_RUN}`
    // );

    const SET_PROVAR_HOME_VALUE = path.join(process.cwd(), './ProvarHome').replace(/\\/g, '/');
    const SET_PROJECT_PATH_VALUE = path.join(process.cwd(), './ProvarRegression/AutomationRevamp').replace(/\\/g, '/');
    const SET_RESULT_PATH = './';

    interface PropertyFileJsonData {
      [key: string]: string | boolean | number | string[];
    }
    const jsonFilePath = FILE_PATHS.MISSING_FILE;
    // reading the json data
    const jsonDataString = fileSystem.readFileSync(jsonFilePath, 'utf-8');
    const jsonData: PropertyFileJsonData = JSON.parse(jsonDataString) as PropertyFileJsonData;
    jsonData.provarHome = SET_PROVAR_HOME_VALUE;
    jsonData.projectPath = SET_PROJECT_PATH_VALUE;
    jsonData.resultsPath = SET_RESULT_PATH;
    jsonData.testCase = ['/Priya{}[].testcase'];
    const updatedJsonDataString = JSON.stringify(jsonData, null, 2);
    fileSystem.writeFileSync(jsonFilePath, updatedJsonDataString, 'utf-8');

    // set provarHome and projectPath locations
    // execCmd<SfProvarCommandResult>(
    //   `${commandConstants.SF_PROVAR_AUTOMATION_CONFIG_SET_COMMAND} "provarHome"=${SET_PROVAR_HOME_VALUE} "projectPath"=${SET_PROJECT_PATH_VALUE} "resultsPath"=${SET_RESULT_PATH}`
    // );
    // execCmd<SfProvarCommandResult>(
    //   `${commandConstants.SF_PROVAR_AUTOMATION_CONFIG_SET_COMMAND} "testCase"="[\\"/Test Case 1.testcase\\"]"`
    // );
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND}`
    ).shellOutput;
    expect(result.stdout).to.deep.equal(runConstants.successMessage);
  });

  it('Test Run command should be successful and return result in json', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND} --json`
    ).jsonOutput;
    expect(result).to.deep.equal(runConstants.SuccessJson);
  });

  it('Test Run command should not be successful and return the error', () => {
    // execCmd<SfProvarCommandResult>(
    //   `${commandConstants.SF_PROVAR_AUTOMATION_CONFIG_SET_COMMAND} "testCase"="[\\"/Test Case 4.testcase\\"]"`
    // );
    interface PropertyFileJsonData {
      [key: string]: string | boolean | number | string[];
    }
    const jsonFilePath = FILE_PATHS.MISSING_FILE;
    // reading the json data
    const jsonDataString = fileSystem.readFileSync(jsonFilePath, 'utf-8');
    const jsonData: PropertyFileJsonData = JSON.parse(jsonDataString) as PropertyFileJsonData;
    jsonData.testCase = ['/Test Case 4.testcase'];
    const updatedJsonDataString = JSON.stringify(jsonData, null, 2);
    fileSystem.writeFileSync(jsonFilePath, updatedJsonDataString, 'utf-8');

    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND}`
    ).shellOutput;
    expect(result.stderr).to.deep.equal(runConstants.errorMessage);
  });

  it('Test Run command should not be successful and return result in json format', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND} --json`
    ).jsonOutput;
    expect(result).to.deep.equal(runConstants.errorJson);
  });
});
