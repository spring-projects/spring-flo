# Spring Flo

[![macOS Build Status](https://travis-ci.org/spring-projects/spring-flo.svg?branch=master)](https://travis-ci.org/spring-projects/spring-flo) [![Dependency Status](https://david-dm.org/spring-projects/spring-flo.svg)](https://david-dm.org/spring-projects/spring-flo)

Spring Flo is a JavaScript library that offers a basic embeddable HTML5 visual builder for pipelines and simple graphs. This library is used as the basis of the stream builder in Spring Cloud Data Flow.

[![dataflow ui](docs/Flo.png)](http://cloud.spring.io/spring-cloud-dataflow/)

Here is a https://www.youtube.com/watch?v=78CgV46OstI[youtube video] of Spring Flo in action.

## Consuming Spring Flo

Refer to the https://github.com/spring-projects/spring-flo/wiki[wiki] for more information on how to embed it in an application.

## Build

Spring Flo is built using NPM commands. Simplest way to build is via `npm run build` to build the project and run the tests (Prerequisite for th build is `npm install` executed before the build command is). Build results are produced under the __dist__ folder.

## Getting Help

If you have any questions, issues, feedback or feature request please https://github.com/spring-projects/spring-flo/issues[raise an issue].

## Samples

A small self contained sample usage of Spring Flo is available in the https://github.com/spring-projects/spring-flo/tree/master/src/demo[demo] sub folder. Execute `npm start` to run the sample. The https://github.com/spring-cloud/spring-cloud-dataflow-ui[Spring Cloud Data Flow UI] at github shows a larger scale usage of Spring Flo.

## Contributing

Pull requests are welcome, but before accepting them we will need you to sign the https://support.springsource.com/spring_committer_signup[Contributors Agreement].

## License

Spring Flo is Open Source software released under the http://www.apache.org/licenses/LICENSE-2.0.html[Apache 2.0 license].
