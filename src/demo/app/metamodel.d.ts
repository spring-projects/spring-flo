import { Flo } from 'spring-flo';
export interface RawMetadata {
    name: string;
    group: string;
    description: string;
    properties: Array<Flo.PropertyMetadata>;
}
export declare class Metamodel implements Flo.Metamodel {
    private rawData;
    constructor();
    textToGraph(flo: Flo.EditorContext, dsl: string): void;
    graphToText(flo: Flo.EditorContext): Promise<{}>;
    load(): Promise<Map<string, Map<string, Flo.ElementMetadata>>>;
    groups(): Array<string>;
}
