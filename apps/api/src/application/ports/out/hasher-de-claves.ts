export interface HasherDeClaves {
  hashear(clavePlana: string): Promise<string>;
}
