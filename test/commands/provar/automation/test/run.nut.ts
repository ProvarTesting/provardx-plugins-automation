import * as fs from 'node:fs/promises';
import * as fileSystem from 'node:fs';
import * as path from 'node:path';
import { execCmd } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import {
  errorMessages,
  commandConstants,
  SfProvarCommandResult,
  setNestedProperty,
} from '@provartesting/provardx-plugins-utils';
import { Global } from '@salesforce/core';
import * as validateConstants from '../../../../assertion/validateConstants.js';
import * as runConstants from '../../../../assertion/runConstants.js';

describe('provar automation test run NUTs', () => {
  void UpdateFileConfigSfdx();
  let configFilePath = '';

  async function UpdateFileConfigSfdx(): Promise<void> {
    const files = await fs.readdir(Global.SF_DIR);
    const configFileName = files.find((filename) => filename.match('config.json'));
    if (!configFileName) {
      configFilePath = path.join(Global.SF_DIR, 'config.json');
      const emptyConfig = JSON.stringify({}, null, 2);
      await fs.writeFile(configFilePath, emptyConfig, 'utf8');
    } else {
      configFilePath = path.join(`${Global.SF_DIR}`, `${configFileName}`);
    }
  }
  enum FILE_PATHS {
    PROVARDX_PROPERTIES_FILE = 'provardx-properties.json',
  }
  const jsonFilePath = FILE_PATHS.PROVARDX_PROPERTIES_FILE;

  it('Boilerplate json file should not run if the file has not been loaded', () => {
    const fileData = fileSystem.readFileSync(configFilePath, { encoding: 'utf8' });
    /* eslint-disable */
    const configFile = JSON.parse(fileData);
    if ('PROVARDX_PROPERTIES_FILE_PATH' in configFile) {
      delete configFile.PROVARDX_PROPERTIES_FILE_PATH;
    }
    const updatedFileData = JSON.stringify(configFile, null, 4);
    fileSystem.writeFileSync(configFilePath, updatedFileData, 'utf8');
    const res = execCmd<SfProvarCommandResult>(`${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND}`).shellOutput;
    expect(res.stderr).to.deep.equal(`Error (1): [MISSING_FILE] ${errorMessages.MISSING_FILE_ERROR}\n\n\n`);
  });

  it('Boilerplate json file should not run if the file has not been loaded and return result in json format', () => {
    const res = execCmd<SfProvarCommandResult>(`${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND} --json`, {
      ensureExitCode: 0,
    });
    expect(res.jsonOutput).to.deep.equal(validateConstants.missingFileJsonError);
  });

  it('Test Run command should be successful', () => {
    const configFilePatheData = fileSystem.readFileSync(configFilePath, { encoding: 'utf8' });
    const configFilePathParsed = JSON.parse(configFilePatheData);
    configFilePathParsed['PROVARDX_PROPERTIES_FILE_PATH'] = path.join(process.cwd(), './provardx-properties.json');
    const updatedCongiFileData = JSON.stringify(configFilePathParsed, null, 4);
    fileSystem.writeFileSync(configFilePath, updatedCongiFileData, 'utf8');
    const SET_PROVAR_HOME_VALUE = path.join(process.cwd(), './ProvarHome').replace(/\\/g, '/');
    const SET_PROJECT_PATH_VALUE = path.join(process.cwd(), './ProvarRegression/AutomationRevamp').replace(/\\/g, '/');
    const SET_RESULT_PATH = './';
    interface PropertyFileJsonData {
      [key: string]: string | boolean | number | string[];
    }
    const jsonDataString = fileSystem.readFileSync(jsonFilePath, 'utf-8');
    const jsonData: PropertyFileJsonData = JSON.parse(jsonDataString) as PropertyFileJsonData;
    jsonData.provarHome = SET_PROVAR_HOME_VALUE;
    jsonData.projectPath = SET_PROJECT_PATH_VALUE;
    jsonData.resultsPath = SET_RESULT_PATH;
    jsonData.testCase = ['/Test Case 5.testcase'];
    const updatedJsonDataString = JSON.stringify(jsonData, null, 2);
    fileSystem.writeFileSync(jsonFilePath, updatedJsonDataString, 'utf-8');
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND}`
    ).shellOutput;

    expect(result.stdout).to.deep.contains(runConstants.successMessage);
    runConstants.successfulResultSubstrings.forEach((resultSubstring) => {
      expect(result.stdout + result.stderr).to.include(resultSubstring);
    });
  });

  it('Test Run command should be successful in outputfile', async () => {
    /* eslint-disable */
    const configFilePatheData = fileSystem.readFileSync(configFilePath, { encoding: 'utf8' });
    const configFilePathParsed = JSON.parse(configFilePatheData);
    configFilePathParsed['PROVARDX_PROPERTIES_FILE_PATH'] = path.join(process.cwd(), './provardx-properties.json');
    const updatedConfigFileData = JSON.stringify(configFilePathParsed, null, 4);
    fileSystem.writeFileSync(configFilePath, updatedConfigFileData, 'utf8');
    const SET_PROVAR_HOME_VALUE = path.join(process.cwd(), './ProvarHome').replace(/\\/g, '/');
    const SET_PROJECT_PATH_VALUE = path.join(process.cwd(), './ProvarRegression/AutomationRevamp').replace(/\\/g, '/');
    const SET_RESULT_PATH = './';
    interface PropertyFileJsonData {
      [key: string]: string | boolean | number | string[];
    }
    const jsonDataString = fileSystem.readFileSync(jsonFilePath, 'utf-8');
    const jsonData: PropertyFileJsonData = JSON.parse(jsonDataString) as PropertyFileJsonData;
    jsonData.provarHome = SET_PROVAR_HOME_VALUE;
    jsonData.projectPath = SET_PROJECT_PATH_VALUE;
    jsonData.resultsPath = SET_RESULT_PATH;
    jsonData.testCase = ['/Test Case 5.testcase'];
    const updatedJsonDataString = JSON.stringify(jsonData, null, 2);
    fileSystem.writeFileSync(jsonFilePath, updatedJsonDataString, 'utf-8');
    const outputFile = runConstants.outputFileAtRelativeLocation;
    let filePath = '';
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND} -o ${outputFile}`
    ).shellOutput;
    expect(result.stdout).to.deep.contains('The test results are stored in ' + outputFile + '\n');
    if (!outputFile.match('/')) {
      filePath = path.join(process.cwd(), 'result.txt');
    } else if (outputFile.startsWith('.')) {
      filePath = path.join(process.cwd(), outputFile.replace(outputFile.charAt(0), ''));
    } else {
      filePath = outputFile;
    }
    const fileContent = fileSystem.readFileSync(filePath, 'utf-8');
    runConstants.successfulResultSubstrings.forEach((resultSubstring) => {
      expect(fileContent).to.include(resultSubstring);
    });
  });
  it('Test Run command should be successful and return result in json', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND} --json`
    ).jsonOutput;
    expect(result).to.deep.equal(runConstants.SuccessJson);
  });

  it('Test Run command should be successful in case of outfile and return result in json', () => {
    const outputFile = runConstants.outputFileAtRelativeLocation;
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND} -o ${outputFile} --json`
    ).jsonOutput;
    expect(result).to.deep.equal(runConstants.SuccessJson);
  });

  it('Test Run command should not be successful and return the error', () => {
    interface PropertyFileJsonData {
      [key: string]: string | boolean | number | string[];
    }
    const jsonDataString = fileSystem.readFileSync(jsonFilePath, 'utf-8');
    const jsonData: PropertyFileJsonData = JSON.parse(jsonDataString) as PropertyFileJsonData;
    jsonData.testCase = ['/Test Case 6.testcase'];
    const updatedJsonDataString = JSON.stringify(jsonData, null, 2);
    fileSystem.writeFileSync(jsonFilePath, updatedJsonDataString, 'utf-8');

    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND}`
    ).shellOutput;
    expect(result.stderr).to.deep.contains(runConstants.errorMessage);
    runConstants.successfulResultSubstrings.forEach((resultSubstring) => {
      expect(result.stdout + result.stderr).to.include(resultSubstring);
    });
  });

  it('Test Run command should not be successful and return result in json format', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND} --json`
    ).jsonOutput;
    expect(result).to.deep.equal(runConstants.errorJson);
  });

  it('Test case should be Executed successfully when Environment is encrypted', () => {
    interface EnvironmentSecret {
      name: string;
      secretsPassword: string;
    }

    interface PropertyFileJsonData {
      [key: string]: string | boolean | number | string[] | { [key: string]: string } | EnvironmentSecret[] | undefined;
      environmentsSecrets?: EnvironmentSecret[];
    }
    const jsonDataString = fileSystem.readFileSync(jsonFilePath, 'utf-8');
    const jsonData: PropertyFileJsonData = JSON.parse(jsonDataString) as PropertyFileJsonData;
    jsonData.testCase = ['/Test Case 6.testcase'];
    setNestedProperty(jsonData, 'environment.testEnvironment', 'Env');
    jsonData.environmentsSecrets = [
      {
        name: `${runConstants.environmentName}`,
        secretsPassword: `${runConstants.secretsPassword}`,
      },
    ];

    const updatedJsonDataString = JSON.stringify(jsonData, null, 2);
    fileSystem.writeFileSync(jsonFilePath, updatedJsonDataString, 'utf-8');

    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND}`
    ).shellOutput;
    expect(result.stderr).to.deep.contains(runConstants.errorMessage);
    runConstants.successfulResultSubstrings.forEach((resultSubstring) => {
      expect(result.stdout + result.stderr).to.include(resultSubstring);
    });
  });

  it('Test case should be Executed successfully when Environment is encrypted and return result in json format', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND} --json`
    ).jsonOutput;
    expect(result).to.deep.equal(runConstants.errorJson);
  });

  it('Test Run command should be successful', () => {
    const configFilePatheData = fileSystem.readFileSync(configFilePath, { encoding: 'utf8' });
    const configFilePathParsed = JSON.parse(configFilePatheData);
    configFilePathParsed['PROVARDX_PROPERTIES_FILE_PATH'] = path.join(process.cwd(), './provardx-properties.json');
    const updatedCongiFileData = JSON.stringify(configFilePathParsed, null, 4);
    fileSystem.writeFileSync(configFilePath, updatedCongiFileData, 'utf8');
    const SET_PROVAR_HOME_VALUE = path.join(process.cwd(), './ProvarHome').replace(/\\/g, '/');
    const SET_PROJECT_PATH_VALUE = path.join(process.cwd(), './ProvarRegression/AutomationRevamp').replace(/\\/g, '/');
    const SET_RESULT_PATH = './';
    interface PropertyFileJsonData {
      [key: string]: string | boolean | number | string[];
    }
    const jsonDataString = fileSystem.readFileSync(jsonFilePath, 'utf-8');
    const jsonData: PropertyFileJsonData = JSON.parse(jsonDataString) as PropertyFileJsonData;
    jsonData.provarHome = SET_PROVAR_HOME_VALUE;
    jsonData.projectPath = SET_PROJECT_PATH_VALUE;
    jsonData.resultsPath = SET_RESULT_PATH;
    jsonData.testCase = ['/Test Case 5.testcase'];
    const updatedJsonDataString = JSON.stringify(jsonData, null, 2);
    fileSystem.writeFileSync(jsonFilePath, updatedJsonDataString, 'utf-8');
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
    interface PropertyFileJsonData {
      [key: string]: string | boolean | number | string[];
    }
    const jsonDataString = fileSystem.readFileSync(jsonFilePath, 'utf-8');
    const jsonData: PropertyFileJsonData = JSON.parse(jsonDataString) as PropertyFileJsonData;
    jsonData.testCase = ['/Test Case 6.testcase'];
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

  it('Test case should be Executed successfully when Environment is encrypted', () => {
    interface EnvironmentSecret {
      name: string;
      secretsPassword: string;
    }

    interface PropertyFileJsonData {
      [key: string]: string | boolean | number | string[] | { [key: string]: string } | EnvironmentSecret[] | undefined;
      environmentsSecrets?: EnvironmentSecret[];
    }
    const jsonDataString = fileSystem.readFileSync(jsonFilePath, 'utf-8');
    const jsonData: PropertyFileJsonData = JSON.parse(jsonDataString) as PropertyFileJsonData;
    jsonData.testCase = ['/Test Case 6.testcase'];
    setNestedProperty(jsonData, 'environment.testEnvironment', 'Env');
    jsonData.environmentsSecrets = [
      {
        name: `${runConstants.environmentName}`,
        secretsPassword: `${runConstants.secretsPassword}`,
      },
    ];

    const updatedJsonDataString = JSON.stringify(jsonData, null, 2);
    fileSystem.writeFileSync(jsonFilePath, updatedJsonDataString, 'utf-8');

    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND}`
    ).shellOutput;
    expect(result.stderr).to.deep.equal(runConstants.errorMessage);
  });

  it('Test case should be Executed successfully when Environment is encrypted and return result in json format', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND} --json`
    ).jsonOutput;
    expect(result).to.deep.equal(runConstants.errorJson);
  });
});
