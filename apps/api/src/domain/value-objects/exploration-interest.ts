import { ValidacionError } from "../errors.js";

enum EnumInterest {
  interest1 = "Evaluate talent in real work experience",
  interest2 = "Get multiple solutions for your project",
  interest3 = "Increase employability of my students",
}

class ExplorationInterest {
  private readonly interests: EnumInterest[];

  constructor(interests: string[]) {
    if (interests.length === 0) {
      throw new ValidacionError("At least one interest is required");
    }

    const invalidInterests: string[] = [];

    interests.forEach((interest) => {
      if (!ExplorationInterest.isValidInterest(interest)) {
        invalidInterests.push(interest);
      }
    });

    if (invalidInterests.length > 0) {
      throw new ValidacionError(
        `Invalid interests: ${invalidInterests.join(", ")}`,
      );
    }

    this.interests = interests.map((interest) => interest as EnumInterest);
  }

  private static isValidInterest(interest: string): boolean {
    return Object.values(EnumInterest).includes(interest as EnumInterest);
  }

  public getInterest(): EnumInterest[] {
    return this.interests;
  }
}

export { ExplorationInterest };
