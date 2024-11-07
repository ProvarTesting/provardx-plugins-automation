export const successMessage = 'The tests were run successfully.\n';
export const errorMessage =
  'Error (1): [Test Case 6.testcase] Assertion failed.  (result) ProvarDX = ProvarDx (target).\n\n\n';
export const SuccessJson = {
  status: 0,
  result: {
    success: true,
  },
  warnings: [],
};
export const errorJson = {
  status: 0,
  result: {
    success: false,
    errors: [
      {
        testCasePath: 'Test Case 6.testcase',
        message: 'Assertion failed.  (result) ProvarDX = ProvarDx (target).',
      },
    ],
  },
  warnings: [],
};
export const environmentName = 'Env';
export const secretsPassword = "Priya@123+,-./:;_{|}~'()*<=>?[]^!#$%&";

export const successfulResultSubstrings = ['Found test case.',
  'Test Output INFO: Adding Test File.  File/Folder:',
  'Test Output INFO: Added Execution Item.  tests',
  'Test Output INFO: Loading test case.  File:',
  'Test Output INFO: Added Execution Item.',
  'Listening for transport dt_socket at address:',
  'Test Run Started',
  'Execution Item Started.  Title:',
  'Execution Item Ended.  Title:',
  'Test Run Ended',
  'JUnit XML report written ',
  'successfully.'
];

export const outputFileAtRelativeLocation = './test/commands/provar/manager/testcase/Result.txt';
