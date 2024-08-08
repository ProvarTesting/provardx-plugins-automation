import * as fs from 'node:fs/promises';
import * as fileSystem from 'node:fs';
import * as path from 'node:path';
import { execCmd } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { errorMessages, commandConstants, SfProvarCommandResult } from '@provartesting/provardx-plugins-utils';
import { Global } from '@salesforce/core';
import * as compileConstants from '../../../../assertion/compileConstants.js';
import * as validateConstants from '../../../../assertion/validateConstants.js';

describe('provar automation project compile NUTs', () => {
  void UpdateFileConfigSfdx();
  let configFilePath = '';

  async function UpdateFileConfigSfdx(): Promise<void> {
    try {
      const files = await fs.readdir(Global.SF_DIR);
      const configFileName = files.find((filename) => filename.match('.*config.json'));

      if (!configFileName) {
        throw new Error('config.json file not found');
      }

      // configFilePath = path.join(Global.SF_DIR, configFileName);
      configFilePath = path.join(`${Global.SF_DIR}`, `${configFileName}`);
    } catch (error) {
      throw new Error('Error on updating the config file');
    }
  }

  enum FILE_PATHS {
    PROVARDX_PROPERTIES_FILE = 'provardx-properties.json',
  }

  it('Boilerplate json file should not be compiled if the file has not been loaded', async () => {
    // Remove the existing PROVARDX_PROPERTIES_FILE_PATH if it exists
    // Read the config.json file
    const fileData = fileSystem.readFileSync(configFilePath, { encoding: 'utf8' });

    // Parse the JSON data
    /* eslint-disable */
    const configFile = JSON.parse(fileData);
    if ('PROVARDX_PROPERTIES_FILE_PATH' in configFile) {
      delete configFile.PROVARDX_PROPERTIES_FILE_PATH;
    }
    // Convert the updated JSON object back to a string
    const updatedFileData = JSON.stringify(configFile, null, 4);

    // Write the updated JSON string back to the config.json file
    fileSystem.writeFileSync(configFilePath, updatedFileData, 'utf8');
    interface PropertyFileJsonData {
      [key: string]: string | boolean | number;
    }
    const jsonFilePath = FILE_PATHS.PROVARDX_PROPERTIES_FILE;
    // reading the json data
    const jsonDataString = fileSystem.readFileSync(jsonFilePath, 'utf-8');
    const jsonData: PropertyFileJsonData = JSON.parse(jsonDataString) as PropertyFileJsonData;
    jsonData.provarHome = '';
    jsonData.projectPath = '';
    const updatedJsonDataString = JSON.stringify(jsonData, null, 2);
    fileSystem.writeFileSync(jsonFilePath, updatedJsonDataString, 'utf-8');
    const res = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_PROJECT_COMPILE_COMMAND}`
    ).shellOutput;
    expect(res.stderr).to.deep.equal(`Error (1): [MISSING_FILE] ${errorMessages.MISSING_FILE_ERROR}\n\n`);
  });

  it('Boilerplate json file should not be compiled if the file has not been loaded and return result in json format', () => {
    const res = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_PROJECT_COMPILE_COMMAND} --json`,
      {
        ensureExitCode: 0,
      }
    );
    expect(res.jsonOutput).to.deep.equal(validateConstants.missingFileJsonError);
  });

  it('Compile command should be successful', async () => {
    // Read the config.json file
    const configFilePatheData = fileSystem.readFileSync(configFilePath, { encoding: 'utf8' });

    // Parse the JSON data
    const configFilePathParsed = JSON.parse(configFilePatheData);
    configFilePathParsed['PROVARDX_PROPERTIES_FILE_PATH'] = path.join(process.cwd(), './provardx-properties.json');
    // Convert the updated JSON object back to a string
    const updatedCongiFileData = JSON.stringify(configFilePathParsed, null, 4);

    // Write the updated JSON string back to the config.json file
    fileSystem.writeFileSync(configFilePath, updatedCongiFileData, 'utf8');

    const SET_PROVAR_HOME_VALUE = path.join(process.cwd(), './ProvarHome').replace(/\\/g, '/');
    const SET_PROJECT_PATH_VALUE = path.join(process.cwd(), './ProvarRegression/AutomationRevamp').replace(/\\/g, '/');
    interface PropertyFileJsonData {
      [key: string]: string | boolean | number;
    }
    const jsonFilePath = FILE_PATHS.PROVARDX_PROPERTIES_FILE;
    // reading the json data
    const jsonDataString = fileSystem.readFileSync(jsonFilePath, 'utf-8');
    const jsonData: PropertyFileJsonData = JSON.parse(jsonDataString) as PropertyFileJsonData;
    jsonData.provarHome = SET_PROVAR_HOME_VALUE;
    jsonData.projectPath = SET_PROJECT_PATH_VALUE;
    const updatedJsonDataString = JSON.stringify(jsonData, null, 2);
    fileSystem.writeFileSync(jsonFilePath, updatedJsonDataString, 'utf-8');

    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_PROJECT_COMPILE_COMMAND}`
    ).shellOutput;
    expect(result.stdout).to.deep.equal(compileConstants.successMessage);
  });

  it('Compile command should be successful and return the result in json', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_PROJECT_COMPILE_COMMAND} --json`
    ).jsonOutput;
    expect(result).to.deep.equal(compileConstants.successJsonMessage);
  });
});
