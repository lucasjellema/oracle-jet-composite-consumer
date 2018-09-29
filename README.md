# oracle-jet-composite-consumer
An example JET application that consumes multiple JET Composite Components in various ways, using jwcm (JET Web Component Manager)

To run the Jet WebComponent Manager tool use jwcm.bat with two command line parameters:

- a reference to [the directory containing the] jet-composites.json as first command line parameter (default is the file jet-composites.json in the current directory or in the /src/js/jet-composites directory under the current directory)
- a reference to the root directory of the target project (default is the current work directory)

For example: ./jwcm C:\oow2018\jet-composites.json C:\oow2018\jet-web-components\oow-demo

instead of the bat file you can also invoke with node:

node jccm.js C:\oow2018\jet-web-components\oow-demo