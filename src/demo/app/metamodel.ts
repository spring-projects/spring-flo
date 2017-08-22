import { Flo } from 'spring-flo';
import { convertGraphToText } from './graph-to-text';
import { convertTextToGraph } from './text-to-graph';

const metamodelData: Array<RawMetadata> = [{
  name: 'http', group: 'source', description: 'Receive HTTP input',
  properties: [
    {id: 'port', name: 'port', defaultValue: '80', description: 'Port on which to listen'}
  ],
}, {
  name: 'rabbit', group: 'source', description: 'Receives messages from RabbitMQ',
  properties: [
    {id: 'queue', name: 'queue', description: 'the queue(s) from which messages will be received'}
  ],
}, {
  name: 'filewatch', group: 'source', description: 'Produce messages from the content of files created in a directory',
  properties: [
    {id: 'dir', name: 'dir', description: 'the absolute path to monitor for files'}
  ],
}, {
  name: 'transform', group: 'processor', description: 'Apply an expression to modify incoming messages',
  properties: [
    {id: 'expression', name: 'expression', defaultValue: 'payload', description: 'SpEL expression to apply'}
  ],
}, {
  name: 'filter', group: 'processor', description: 'Only allow messages through that pass the filter expression',
  properties: [
    {id: 'expression', name: 'expression', defaultValue: 'true', description: 'SpEL expression to use for filtering'}
  ],
}, {
  name: 'filesave', group: 'sink', description: 'Writes messages to a file',
  properties: [
    {id: 'dir', name: 'dir', description: 'Absolute path to directory'},
    {id: 'name', name: 'name', description: 'The name of the file to create'}
  ],
}, {
  name: 'ftp', group: 'sink', description: 'Send messages over FTP',
  properties: [
    {id: 'host', name: 'host', description: 'the host name for the FTP server'},
    {id: 'port', name: 'port', description: 'The port for the FTP server'},
    {id: 'remoteDir', name: 'remoteDir', description: 'The remote directory on the server'},
  ],
}];

export interface RawMetadata {
  name: string;
  group: string;
  description: string;
  properties: Array < Flo.PropertyMetadata >;
}

class Metadata implements Flo.ElementMetadata {

  constructor(private rawData: RawMetadata) {
  }

  get name(): string {
    return this.rawData.name;
  }

  get group(): string {
    return this.rawData.group;
  }

  description(): Promise < string > {
    return Promise.resolve(this.rawData.description);
  }

  get(property: String): Promise < Flo.PropertyMetadata > {
    return Promise.resolve(this.rawData.properties.find(p => p.id === property));
  }

  properties() : Promise<Array<Flo.PropertyMetadata>> {
    return Promise.resolve(this.rawData.properties);
  }

}

export class Metamodel implements Flo.Metamodel {

  private rawData: Array<RawMetadata>;

  constructor() {
    this.rawData = metamodelData;
  }

  textToGraph(flo: Flo.EditorContext, dsl : string) {
    console.log('Text -> Graph');
    this.load().then(metamodel => {
      convertTextToGraph(flo, metamodel, dsl);
      flo.performLayout();
      flo.fitToPage();
    })
  }

  graphToText(flo: Flo.EditorContext) {
    console.log('Graph -> Text');
    return new Promise((resolve) => resolve(convertGraphToText(flo.getGraph())));
  }

  load(): Promise < Map < string, Map < string, Flo.ElementMetadata >>> {
    let data: Map < string, Map < string, Flo.ElementMetadata >> = new Map < string, Map < string, Flo.ElementMetadata >>();
    this.rawData
      .map(rawData => new Metadata(rawData))
      .forEach(metadata => {
          if (!data.has(metadata.group)) {
            data.set(metadata.group, new Map < string, Flo.ElementMetadata >());
          }
          data.get(metadata.group).set(metadata.name, metadata);
        }
      );
    return Promise.resolve(data);
  }

  groups(): Array < string > {
    let groups: Set < string > = new Set < string >();
    this.rawData.forEach(metadata => groups.add(metadata.group));
    return Array.from(groups);
  }

}
