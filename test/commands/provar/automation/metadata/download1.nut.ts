/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fileSystem from 'node:fs/promises';
// import * as os from 'node:os';
import * as path from 'node:path';
import { TestSession } from '@salesforce/cli-plugins-testkit';
// import { expect } from 'chai';
// import { commandConstants, SfProvarCommandResult } from '@provartesting/provardx-plugins-utils';
// import * as validateConstants from '../../../../assertion/validateConstants.js';
// import { Global } from '@salesforce/core';
// import * as metadataDownloadConstants from '../../../../assertion/metadataDownloadConstants.js';
// mport { config } from '@oclif/core/lib/errors/config.js';
import { Global } from '@salesforce/core';
// import { ProvarConfig } from '@provartesting/provardx-plugins-utils';

describe('setting Path at sf config path location', () => {
  let session: TestSession;

  after(async () => {
    await session?.clean();
  });

  it('It should update the PROVARDX_PROPERTIES_FILE_PATH in sfdx config.json', () => {
    async function UpdateFileConfigSfdx() {
      try {
        const file = (await fileSystem.readdir(Global.SFDX_DIR)).find((filename: string) =>
          filename.match('.*config.json')
        );
        const fileData = await fileSystem.readFile(path.resolve(file ? `${Global.SFDX_DIR}\\${file}` : ''), {
          encoding: 'utf8',
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const configFile = JSON.parse(fileData);

        const configFilePath = path.join(process.cwd(), './dummy.json');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
        await fileSystem.writeFile(configFile, JSON.stringify(configFilePath, null, 4), 'utf8');
        // eslint-disable-next-line no-console
        console.log('Config file updated successfully.');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error on updating the config file', error);
      }
    }
    void UpdateFileConfigSfdx();

    // type Config = {
    //   PROVARDX_PROPERTIES_FILE_PATH?: string;
    // };
    // async function UpdateSfdxConfig() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
    //   const configPath = path.join(os.homedir(), '.sfdx');
    //   if (!fileSystem.existsSync(configPath)) {
    //     fileSystem.mkdirSync(configPath, { recursive: true });
    //   }
    //   const configFilePath = path.join(configPath, 'sfdx-config.json');

    //   try {
    //     let config: Config = {};

    //     if (fileSystem.existsSync(configFilePath)) {
    //       const configFile = await fileSystem.promises.readFile(configFilePath, 'utf8');
    //       // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    //       config = JSON.parse(configFile || '{}');
    //     }
    //     config.PROVARDX_PROPERTIES_FILE_PATH = 'D:\\abc.json';
    //     await fileSystem.promises.writeFile(configFilePath, JSON.stringify(config, null, 4), 'utf8');
    //     // eslint-disable-next-line no-console
    //     console.log('Config file created/updated successfully.');
    //   } catch (error) {
    //     // eslint-disable-next-line no-console
    //     console.error('Error updating the config file:', error);
    //   }
    // }
    // // eslint-disable-next-line @typescript-eslint/no-floating-promises
    // void UpdateSfdxConfig();
  });

  it('It should update the PROVARDX_PROPERTIES_FILE_PATH in sfdx config.json', async () => {
    //   type config = {
    //     PROVARDX_PROPERTIES_FILE_PATH?: string;
    // }
    // const propertiesFileName = path.join(process.cwd(), './provardx-properties.json');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    // const config: ProvarConfig = await ProvarConfig.loadConfig(this.errorHandler);
    // config.set('PROVARDX_PROPERTIES_FILE_PATH', propertiesFileName);
    // await config.write();
  });

  // it('Metadata should be downloaded for the provided connection and return the success message', () => {
  //   const result = execCmd<SfProvarCommandResult>(
  //     `${commandConstants.SF_PROVAR_AUTOMATION_METADATA_DOWNLOAD_COMMAND} -c RegressionOrg`
  //   ).shellOutput;
  //   expect(result.stdout).to.deep.equal(metadataDownloadConstants.successMessage);
  // });

  // it('Metadata should be downloaded for the provided connection and return the success message in json format', () => {
  //   const result = execCmd<SfProvarCommandResult>(
  //     `${commandConstants.SF_PROVAR_AUTOMATION_METADATA_DOWNLOAD_COMMAND} -c RegressionOrg --json`
  //   ).jsonOutput;
  //   expect(result).to.deep.equal(metadataDownloadConstants.successJsonMessage);
});
