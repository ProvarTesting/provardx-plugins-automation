/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fileSystem from 'node:fs/promises';
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
import * as metadataDownloadConstants from '../../../../assertion/metadataDownloadConstants.js';

describe('sf provar config metadataDownload NUTs', () => {
  const DOWNLOAD_ERROR = 'Error (1): [DOWNLOAD_ERROR]';
  it('Update Provar Home and ProjectPath in provar dx properties file', async () => {
    const ProvarDXPropertiesFilePath1 = path.join(process.cwd(), './provardx-properties.json');

    // Read the config.json file
    const ProvarDXPropertiesFileData = await fileSystem.readFile(ProvarDXPropertiesFilePath1, { encoding: 'utf8' });

    // Parse the JSON data
    /* eslint-disable */
    const ProvarDXPropertiesFileParsed = JSON.parse(ProvarDXPropertiesFileData);
    ProvarDXPropertiesFileParsed['provarHome'] = path.join(process.cwd(), './ProvarHome').replace(/\\/g, '/');
    ProvarDXPropertiesFileParsed['projectPath'] = path
      .join(process.cwd(), './ProvarRegression/AutomationRevamp')
      .replace(/\\/g, '/');

    setNestedProperty(ProvarDXPropertiesFileParsed, 'metadata.metadataLevel', 'Reuse');

    // Convert the updated JSON object back to a string
    const updatedPropertiesFileData = JSON.stringify(ProvarDXPropertiesFileParsed, null, 4);

    // Write the updated JSON string back to the config.json file
    await fileSystem.writeFile(ProvarDXPropertiesFilePath1, updatedPropertiesFileData, 'utf8');
  });

  it('It should update the PROVARDX_PROPERTIES_FILE_PATH in sf config.json', async () => {
    // Call the function to perform the update
    await UpdateFileConfigSfdx();
    async function UpdateFileConfigSfdx(): Promise<void> {
      try {
        // Read the directory and find the config.json file
        const files = await fileSystem.readdir(Global.SF_DIR);

        const configFileName = files.find((filename) => filename.match('.*config.json'));

        if (!configFileName) {
          throw new Error('config.json file not found');
        }

        const configFilePath = path.join(Global.SF_DIR, configFileName);

        // Read the config.json file
        const fileData = await fileSystem.readFile(configFilePath, { encoding: 'utf8' });

        // Parse the JSON data
        const configFile = JSON.parse(fileData);

        const ProvarDXPropertiesFilePath = path.join(process.cwd(), './provardx-properties.json');

        // Read the config.json file
        const ProvarDXPropertiesFileData = await fileSystem.readFile(ProvarDXPropertiesFilePath, { encoding: 'utf8' });

        // Parse the JSON data
        const ProvarDXPropertiesFileParsed = JSON.parse(ProvarDXPropertiesFileData);
        ProvarDXPropertiesFileParsed['provarHome'] = path.join(process.cwd(), './ProvarHome').replace(/\\/g, '/');

        // Convert the updated JSON object back to a string
        const updatedPropertiesFileData = JSON.stringify(ProvarDXPropertiesFileParsed, null, 4);

        // Write the updated JSON string back to the config.json file
        await fileSystem.writeFile(ProvarDXPropertiesFilePath, updatedPropertiesFileData, 'utf8');

        // Update the PROVARDX_PROPERTIES_FILE_PATH
        configFile.PROVARDX_PROPERTIES_FILE_PATH = ProvarDXPropertiesFilePath;

        // Convert the updated JSON object back to a string
        const updatedFileData = JSON.stringify(configFile, null, 4);

        // Write the updated JSON string back to the config.json file
        await fileSystem.writeFile(configFilePath, updatedFileData, 'utf8');

        // Read the config.json file again to verify the update
        const updatedFileDataVerify = await fileSystem.readFile(configFilePath, { encoding: 'utf8' });
        const updatedConfigFile = JSON.parse(updatedFileDataVerify);
        // Assert that the PROVARDX_PROPERTIES_FILE_PATH has been updated correctly

        expect(updatedConfigFile.PROVARDX_PROPERTIES_FILE_PATH).to.equal(ProvarDXPropertiesFilePath);
      } catch (error) {
        throw new Error('Error on updating the config file');
      }
    }
  });

  it('Metadata should be downloaded for the provided connection and return the success message', async () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_METADATA_DOWNLOAD_COMMAND} -c RegmainOrg`
    ).shellOutput;

    expect(result.stdout).to.deep.equal(metadataDownloadConstants.successMessage);
  });

  it('Metadata should be downloaded for the provided connection and return the success message in json format', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_METADATA_DOWNLOAD_COMMAND} -c RegressionOrg --json`
    ).jsonOutput;
    expect(result).to.deep.equal(metadataDownloadConstants.successJsonMessage);
  });

  it('Metadata should not be downloaded as incorrect connection name and return the error message', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_METADATA_DOWNLOAD_COMMAND} -c RegOrg`
    ).shellOutput;
    expect(result.stderr).to.include(DOWNLOAD_ERROR);
  });

  it('Metadata should not be downloaded as incorrect connection name and return the error message in json format', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_METADATA_DOWNLOAD_COMMAND} --connections REGMAINORG --json`
    ).jsonOutput;
    expect(result?.result.success).to.deep.equal(false);
    // eslint-disable-next-line
    expect((result?.result.errors?.[0] as any)?.code).to.equals('DOWNLOAD_ERROR');
  });

  it('Metadata should not be downloaded for the invalid user name and return the error', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_METADATA_DOWNLOAD_COMMAND} -c PrereleaseOrg`
    ).shellOutput;
    expect(result.stderr).to.include(DOWNLOAD_ERROR);
  });

  it('Metadata should not be downloaded for the invalid user name and return the error in json format', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_METADATA_DOWNLOAD_COMMAND} -c PrereleaseOrg --json`
    ).jsonOutput;
    expect(result?.result.success).to.deep.equal(false);
    // eslint-disable-next-line
    expect((result?.result.errors?.[0] as any)?.code).to.equals('DOWNLOAD_ERROR');
  });

  it('Metadata should not be downloaded when user does not have download permissions and return the error', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_METADATA_DOWNLOAD_COMMAND} -c NonAdmin`
    ).shellOutput;
    expect(result.stderr).to.include(DOWNLOAD_ERROR);
  });

  it('Metadata should not be downloaded as provarHome & projectPath are not correct and return the error message', async () => {
    const ProvarDXPropertiesFilePath = path.join(process.cwd(), './provardx-properties.json');

    // Read the config.json file
    const ProvarDXPropertiesFileData = await fileSystem.readFile(ProvarDXPropertiesFilePath, { encoding: 'utf8' });

    // Parse the JSON data
    const ProvarDXPropertiesFileParsed = JSON.parse(ProvarDXPropertiesFileData);
    ProvarDXPropertiesFileParsed['provarHome'] = './ProvarHome1';

    // Convert the updated JSON object back to a string
    const updatedPropertiesFileData = JSON.stringify(ProvarDXPropertiesFileParsed, null, 4);

    // Write the updated JSON string back to the config.json file
    await fileSystem.writeFile(ProvarDXPropertiesFilePath, updatedPropertiesFileData, 'utf8');

    // download metadata for the connection
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_METADATA_DOWNLOAD_COMMAND} -c RegressionOrg`
    ).shellOutput;
    expect(result.stderr).to.include(DOWNLOAD_ERROR);
  });

  it('Metadata should not be downloaded as provarHome & projectPath are not correct and return the error in json format', async () => {
    const ProvarDXPropertiesFilePath = path.join(process.cwd(), './provardx-properties.json');

    // Read the config.json file
    const ProvarDXPropertiesFileData = await fileSystem.readFile(ProvarDXPropertiesFilePath, { encoding: 'utf8' });

    // Parse the JSON data
    const ProvarDXPropertiesFileParsed = JSON.parse(ProvarDXPropertiesFileData);
    ProvarDXPropertiesFileParsed['provarHome'] = './ProvarHome1';

    // Convert the updated JSON object back to a string
    const updatedPropertiesFileData = JSON.stringify(ProvarDXPropertiesFileParsed, null, 4);

    // Write the updated JSON string back to the config.json file
    await fileSystem.writeFile(ProvarDXPropertiesFilePath, updatedPropertiesFileData, 'utf8');

    // download metadata for the connection
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_METADATA_DOWNLOAD_COMMAND} -c RegressionOrg --json`
    ).jsonOutput;
    expect(result?.result.success).to.deep.equal(false);
    expect((result?.result.errors?.[0] as any)?.code).to.equals('DOWNLOAD_ERROR');
  });

  it('Metadata should not be downloaded as provarHome & projectPath are not correct and return the error in json format', async () => {
    const ProvarDXPropertiesFilePath = path.join(process.cwd(), './provardx-properties.json');

    // Read the config.json file
    const ProvarDXPropertiesFileData = await fileSystem.readFile(ProvarDXPropertiesFilePath, { encoding: 'utf8' });

    // Parse the JSON data
    const ProvarDXPropertiesFileParsed = JSON.parse(ProvarDXPropertiesFileData);
    ProvarDXPropertiesFileParsed['provarHome'] = './ProvarHome1';

    // Convert the updated JSON object back to a string
    const updatedPropertiesFileData = JSON.stringify(ProvarDXPropertiesFileParsed, null, 4);

    // Write the updated JSON string back to the config.json file
    await fileSystem.writeFile(ProvarDXPropertiesFilePath, updatedPropertiesFileData, 'utf8');

    // download metadata for the connection
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_METADATA_DOWNLOAD_COMMAND} -c RegressionOrg --json`
    ).jsonOutput;
    expect(result?.result.success).to.deep.equal(false);
    expect((result?.result.errors?.[0] as any)?.code).to.equals('DOWNLOAD_ERROR');
  });

  it('Metadata should not be downloaded and return the error message as invalid value exists in metadataLevel property', async () => {
    const ProvarDXPropertiesFilePath1 = path.join(process.cwd(), './provardx-properties.json');

    // Read the config.json file
    const ProvarDXPropertiesFileData = await fileSystem.readFile(ProvarDXPropertiesFilePath1, { encoding: 'utf8' });

    // Parse the JSON data
    const ProvarDXPropertiesFileParsed = JSON.parse(ProvarDXPropertiesFileData);
    ProvarDXPropertiesFileParsed['provarHome'] = path.join(process.cwd(), './ProvarHome').replace(/\\/g, '/');
    ProvarDXPropertiesFileParsed['projectPath'] = path
      .join(process.cwd(), './ProvarRegression/AutomationRevamp')
      .replace(/\\/g, '/');
    setNestedProperty(ProvarDXPropertiesFileParsed, 'metadata.metadataLevel', 'xyz');

    // Convert the updated JSON object back to a string
    const updatedPropertiesFileData = JSON.stringify(ProvarDXPropertiesFileParsed, null, 4);

    // Write the updated JSON string back to the config.json file
    await fileSystem.writeFile(ProvarDXPropertiesFilePath1, updatedPropertiesFileData, 'utf8');

    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_METADATA_DOWNLOAD_COMMAND} --connections RegmainOrg`
    ).shellOutput;
    expect(result.stderr).to.include(DOWNLOAD_ERROR);
  });

  it('Metadata should not be downloaded and return the json error message as invalid value exists in metadataLevel property', async () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_METADATA_DOWNLOAD_COMMAND} -c RegmainOrg --json`
    ).jsonOutput;
    expect(result?.result.success).to.deep.equal(false);

    expect((result?.result.errors?.[0] as any)?.code).to.equals('DOWNLOAD_ERROR');
  });

  it('It should Delete the PROVARDX_PROPERTIES_FILE_PATH in sf config.json', async () => {
    async function deleteFileConfigSfdx(): Promise<void> {
      try {
        // Read the directory and find the config.json file
        const files = await fileSystem.readdir(Global.SF_DIR);
        const configFileName = files.find((filename) => filename.match('.*config.json'));

        if (!configFileName) {
          throw new Error('config.json file not found');
        }

        const configFilePath = path.join(Global.SF_DIR, configFileName);

        // Read the config.json file
        const fileData = await fileSystem.readFile(configFilePath, { encoding: 'utf8' });

        // Parse the JSON data
        const configFile = JSON.parse(fileData);

        // Remove the existing PROVARDX_PROPERTIES_FILE_PATH if it exists
        if ('PROVARDX_PROPERTIES_FILE_PATH' in configFile) {
          delete configFile.PROVARDX_PROPERTIES_FILE_PATH;

          // Assert that the property was deleted
          expect(configFile).to.not.have.property('PROVARDX_PROPERTIES_FILE_PATH');

          // Convert the updated JSON object back to a string
          const updatedFileData = JSON.stringify(configFile, null, 4);

          // Write the updated JSON string back to the config.json file
          await fileSystem.writeFile(configFilePath, updatedFileData, 'utf8');

          // Re-read the config.json file to confirm deletion
          const newFileData = await fileSystem.readFile(configFilePath, { encoding: 'utf8' });
          const newConfigFile = JSON.parse(newFileData);

          // Final assertion to confirm the property is deleted
          expect(newConfigFile).to.not.have.property('PROVARDX_PROPERTIES_FILE_PATH');
        }
      } catch (error) {
        // console.error('Error on Deleting the config file', error);
      }
    }

    // Call the function to perform the update
    await deleteFileConfigSfdx();
  });

  it('Missing file error as json file is not loaded', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_METADATA_DOWNLOAD_COMMAND} --connections RegressionOrg`
    ).shellOutput;

    expect(result.stderr).to.deep.equal(`Error (1): [MISSING_FILE] ${errorMessages.MISSING_FILE_ERROR}\n\n`);
  });

  it('Missing file error as json file is not loaded', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_METADATA_DOWNLOAD_COMMAND} --connections "RegressionOrg,RegmainOrg"`
    ).shellOutput;

    expect(result.stderr).to.deep.equal(`Error (1): [MISSING_FILE] ${errorMessages.MISSING_FILE_ERROR}\n\n`);
  });

  it('Missing file json error in json format as json file is not loaded', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_METADATA_DOWNLOAD_COMMAND} -c RegressionOrg --json`,
      {
        ensureExitCode: 0,
      }
    );
    expect(result.jsonOutput).to.deep.equal(validateConstants.missingFileJsonError);
  });
});
