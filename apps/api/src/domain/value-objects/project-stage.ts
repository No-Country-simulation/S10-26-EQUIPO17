import { ValidacionError } from "../errors.js";

enum EnumProjectStage {
  mvp = "MVP",
  idea = "Idea",
  poc = "POC",
  scaling = "Scaling",
  legacy = "Legacy",
}

class ProjectStage {
  private readonly stage: EnumProjectStage;

  constructor(stage: string) {
    if (!ProjectStage.isValidStage(stage)) {
      throw new ValidacionError(`Invalid project stage: ${stage}`);
    }
    this.stage = stage as EnumProjectStage;
  }

  public getStage(): EnumProjectStage {
    return this.stage;
  }

  private static isValidStage(stage: string): boolean {
    return Object.values(EnumProjectStage).includes(stage as EnumProjectStage);
  }
}

export { ProjectStage };
