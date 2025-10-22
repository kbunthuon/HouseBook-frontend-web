import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  globals: { 'ts-jest': { tsconfig: 'tsconfig.json' } },
  roots: ['<rootDir>/tests/api'],
  reporters: [
    'default',
    (['jest-html-reporter', {
      pageTitle: 'API Test Report',
      outputPath: 'tests/reports/jest-api-report.html'
    }] as [string, Record<string, unknown>]),
  ],  
  coverageDirectory: 'tests/reports/coverage',
  collectCoverageFrom: ['src/**/*.{ts,tsx}', 'tests/api/**/*.{ts,tsx}'],
  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
};

export default config;
