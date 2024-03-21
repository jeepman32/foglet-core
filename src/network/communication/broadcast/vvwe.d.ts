declare module "version-vector-with-exceptions" {
  interface IncrementReturn {
    e: string;
    c: number;
  }

  class VVwEEntry {
    public e: string;
    public v: number;
    public x: [];

    public increment(): void;
    public incrementFrom(): void;
  }

  class VVwE {
    constructor(id: string);

    public increment(): IncrementReturn;
    public isLower(prev: IncrementReturn): void;
    public isReady(prev: IncrementReturn): void;
    public incrementFrom(from: IncrementReturn): void;
    public merge(subject: VVwE): void;
    public clone(): void;

    public local: VVwEEntry;
  }

  export default VVwE;
  export { IncrementReturn };
}
