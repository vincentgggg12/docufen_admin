import * as fs from 'fs';
import * as path from 'path';

export interface TestStep {
  stepNumber: string;
  procedure: string;
  expectedResult: string;
  requiresScreenshot: boolean;
  extractionPatterns: string[];
}

export interface TestConfig {
  testId: string;
  testName: string;
  description: string;
  prerequisites: {
    role?: string;
    state?: string[];
  };
  steps: TestStep[];
}

export interface SectionConfig {
  sectionId: string;
  sectionName: string;
  tests: TestConfig[];
}

export interface Subsection {
  id: string;
  name: string;
  configFile: string;
  expanded: boolean;
}

export interface Section {
  id: string;
  name: string;
  expanded: boolean;
  subsections: Subsection[];
}

export interface TestHierarchy {
  title: string;
  sections: Section[];
}

export class ConfigLoader {
  private static instance: ConfigLoader;
  private configCache: Map<string, any> = new Map();
  private metadataRoot: string;

  private constructor() {
    this.metadataRoot = path.join(process.cwd(), 'playwright', 'test-metadata');
  }

  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  /**
   * Load the test hierarchy configuration
   */
  loadHierarchy(): TestHierarchy {
    const cacheKey = 'hierarchy';
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }

    try {
      const hierarchyPath = path.join(this.metadataRoot, 'test-hierarchy.json');
      const content = fs.readFileSync(hierarchyPath, 'utf-8');
      const hierarchy = JSON.parse(content) as TestHierarchy;
      this.configCache.set(cacheKey, hierarchy);
      return hierarchy;
    } catch (error) {
      console.error('Failed to load test hierarchy:', error);
      throw error;
    }
  }

  /**
   * Load a section configuration by file path
   */
  loadSectionConfig(configFile: string): SectionConfig | null {
    if (this.configCache.has(configFile)) {
      return this.configCache.get(configFile);
    }

    try {
      const configPath = path.join(this.metadataRoot, configFile);
      if (!fs.existsSync(configPath)) {
        return null;
      }

      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content) as SectionConfig;
      this.configCache.set(configFile, config);
      return config;
    } catch (error) {
      console.error(`Failed to load config file ${configFile}:`, error);
      return null;
    }
  }

  /**
   * Get test configuration by test ID
   */
  getTestConfig(testId: string): TestConfig | null {
    const hierarchy = this.loadHierarchy();
    
    // Extract section ID from test ID (e.g., "TS.6.1-01" -> "6.1")
    const match = testId.match(/TS\.(\d+\.\d+)-\d+/);
    if (!match) return null;
    
    const sectionId = match[1];
    
    // Find the subsection in hierarchy
    for (const section of hierarchy.sections) {
      for (const subsection of section.subsections) {
        if (subsection.id === sectionId) {
          const sectionConfig = this.loadSectionConfig(subsection.configFile);
          if (sectionConfig) {
            return sectionConfig.tests.find(t => t.testId === testId) || null;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Get all test configurations
   */
  getAllTests(): Map<string, TestConfig> {
    const allTests = new Map<string, TestConfig>();
    const hierarchy = this.loadHierarchy();

    for (const section of hierarchy.sections) {
      for (const subsection of section.subsections) {
        const sectionConfig = this.loadSectionConfig(subsection.configFile);
        if (sectionConfig) {
          for (const test of sectionConfig.tests) {
            allTests.set(test.testId, test);
          }
        }
      }
    }

    return allTests;
  }

  /**
   * Clear the configuration cache
   */
  clearCache(): void {
    this.configCache.clear();
  }
}