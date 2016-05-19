# A sample app for spring-flo

This is a very basic example of spring-flo usage.

# Running the sample

A basic Spring Boot app is used to serve the sample. Launch it with:

    mvn spring-boot:run

then open http://localhost:8080 then you can type text into the box
(e.g. "filewatch > ftp") or drag elements from the palette and link them
together to build a pipeline.

# Understanding the sample

Spring Flo allows simultaneous synchronization between some textual domain 
specific language (DSL) and the graphical representation. You can type in the
text version or you can interactively build the graph version. Any custom
usage of spring-flo therefore needs three things:

- a metamodel of the domain. What are the 'things' you are connecting in your
  pipeline and what are their properties?
- a converter from the text form to the graph form.
- a converter from the graph form to the text form.

The same here includes a very basic domain that you can easily customize:

- there are a handful of nodes with basic properties. These are defined in
  `metamodel-sample.json` - that is a JSON array of the modules supported.
- the DSL form is `module --key=value --key=value > nextModule --key=value`.
- the conversion from text to graph is done in `text-to-graph.js`
- the conversion from graph to text is done in `graph-to-text.js`

Note the convertors (and the DSL) do not describe or support linking multiple nodes
to a single node, but spring-flo supports that, you just need to enhance the
convertors and have a representation in the DSL.

If you wanted to use this sample in your domain, perhaps you would enhance `index.html`
to include some kind of 'execute' button that used the text representation to
drive some other (perhaps backend) API.

The included `index.html` has basic buttons that exercise some of the control features
of flo - for example turning off the palette and switching it to a read-only mode (for
use when embedding flo into something that should just be showing a read only view of a
pipeline).

# Navigating the sample

In order to keep the project to a single build file, spring-flo is referenced
through the maven pom using webjars dependencies.

- `index.html` the single HTML file that embeds sping-flo
- `main.js` the launch config file for requirejs, referenced from index.html
- `sample-app.js` setup the angular app with custom services
- `metamodel-service.js` the custom metamodel service for this usage of spring-flo
- `editor-service.js` the custom editor service for this usage of spring-flo
- `render-service.js` the custom render service for this usage of spring-flo
- `metamodel-sample.json` a basic json description of the domain
- `graph-to-text.js` convert from the graph form to our custom DSL text
- `text-to-graph.js` convert from the custom DSL text to our graph form

