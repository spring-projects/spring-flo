import { Flo } from 'spring-flo';
import { convertGraphToText } from './graph-to-text';
import { convertTextToGraph } from './text-to-graph';

const metamodelData: Array<RawMetadata> = [{
  name: 'http', group: 'source', description: 'Receive HTTP input',
  properties: [
    {id: 'port', name: 'port', defaultValue: '80', description: 'Port on which to listen', type: 'number'}
  ],
}, {
  name: 'rabbit', group: 'source', description: 'Receives messages from RabbitMQ',
  properties: [
    {id: 'queue', name: 'queue', description: 'the queue(s) from which messages will be received'},
    {id: 'time-unit', name: 'time-unit', description: 'Time unit for heart beat messages', type: 'enum', options: ['HOURS', 'MINUTES', 'SECONDS', 'MILIOSECONDS'], defaultValue: 'SECONDS'},
    {id: 'heart-beat', name: 'heart-beat', description: 'Heart beat on/off', type: 'boolean', defaultValue: false},
    {id: 'interval', name: 'interval', description: 'Time period being consecutive heart beat messages', type: 'number', defaultValue: 20},
    {id: 'url', name: 'url', description: 'Service URL', type: 'url'},
    {id: 'password', name: 'password', description: 'Password to login to service', type: 'password'},
    {id: 'messages', name: 'messages', description: 'List of messages', type: 'list'},
    {id: 'counts', name: 'counts', description: 'List of counts', type: 'list[number]'},
    {id: 'language', name: 'language', description: 'Code snippet language', type: 'enum', options: ['javascript', 'ruby', 'java'], defaultValue: 'javascript'},
    {id: 'snippet', name: 'snippet', description: 'Code snippet', type: 'code', defaultValue: ''},
    {id: 'successes', name: 'successes', description: 'List of successes', type: 'list[boolean]'},
  ],
}, {
  name: 'filewatch', group: 'source', description: 'Produce messages from the content of files created in a directory',
  properties: [
    {id: 'dir', name: 'dir', description: 'the absolute path to monitor for files'},
    {id: 'withSubDir', name: 'withSubDir', description: 'With subdirectories', defaultValue: true, type: 'boolean'},
    {id: 'type', name: 'type', description: 'Type of file watching', type: 'enum', options: ['tough', 'so-so', 'easy']}
  ],
}, {
//   name: 'multi', group: 'processor', description: 'Custom element with multiple inputs and outputs',
//   properties: [
//     {id: 'inputChannel', name: 'input-channel', description: 'input channel name', type: 'string'}
//   ],
// }, {
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
  name: 'end', group: 'sink', description: 'Writes messages to a file',
  properties: [
    {id: 'dir', name: 'dir', description: 'Absolute path to directory'},
    {id: 'name', name: 'name', description: 'The name of the file to create'}
  ],
}, {
  name: 'null', group: 'sink', description: 'Writes messages to a file',
  properties: [
    {id: 'dir', name: 'dir', description: 'Absolute path to directory'},
    {id: 'name', name: 'name', description: 'The name of the file to create'}
  ],
}, {
  name: 'console', group: 'sink', description: 'Writes messages to a file',
  properties: [
    {id: 'dir', name: 'dir', description: 'Absolute path to directory'},
    {id: 'name', name: 'name', description: 'The name of the file to create'}
  ],
}, {
  name: 'hdfs', group: 'sink', description: 'Writes messages to a file',
  properties: [
    {id: 'dir', name: 'dir', description: 'Absolute path to directory'},
    {id: 'name', name: 'name', description: 'The name of the file to create'}
  ],
}, {
  name: 'jdbc', group: 'sink', description: 'Writes messages to a file',
  properties: [
    {id: 'dir', name: 'dir', description: 'Absolute path to directory'},
    {id: 'name', name: 'name', description: 'The name of the file to create'}
  ],
}, {
  name: 'ftp', group: 'sink', description: 'Send messages over FTP',
  properties: [
    {id: 'host', name: 'host', description: 'the host name for the FTP server'},
    {id: 'port', name: 'port', description: 'The port for the FTP server', type: 'number'},
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

  properties() : Promise<Map<string,Flo.PropertyMetadata>> {
    let propertiesMap = new Map<string, Flo.PropertyMetadata>();
    this.rawData.properties.forEach(p => propertiesMap.set(p.id, p));
    return Promise.resolve(propertiesMap);
  }

}

export class Metamodel implements Flo.Metamodel {

  private rawData: Array<RawMetadata>;

  constructor() {
    this.rawData = metamodelData;
  }

  textToGraph(flo: Flo.EditorContext, dsl : string): Promise<any> {
    console.log('Text -> Graph');
    return this.load().then(metamodel => {
      convertTextToGraph(flo, metamodel, dsl);
      flo.performLayout();
      flo.fitToPage();
    })
  }

  graphToText(flo: Flo.EditorContext): Promise<string> {
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
