# Overview

* NPM package for making sankey charts.

* Raw javascript.

* As dev friendly as possible

<br />

### Principles

1. All configuration is a JSON object.
2. All input data is a JSON object.
3. End product should be as simple as:

<br />

```
let sankeyChart = new SankeyChart(canvasId, width, height);

sankeyChart.setConfig({
  // Config Object
});

sankeyChart.setData({
  // Data Object
});

sankeyChart.drawChart();
```

4. All customisation has a default value.
5. No customisation should depend on another.

<br />

### Design

1. The canvas handler does the drawing and the pixel mapping.

2. The canvas handler has its own JSON object standard for low level adjustments (border radii, bezier curve severity, node/ flow specific customisation, etc)

   * This makes the JSON at canvas level really cumbersome. This is by design.

3. The data handler converts the data JSON object into the canvas handler JSON object standard.

4. The data handler injects relevant values from the config JSON into the canvas handler JSON object standard.

### Data Object

<br />

```
{
  // TBD
}
```

### Config Object

<br />

```
{
    "nodeGap": {as a percentage of canvas height},
    "nodeWidth": {as a percentage of canvas width},
    "showLabels": {boolean},
}
```

### Further Development

Ideally, this would be the first of a suite of packages for simple and direct chart creation.

Ultimately, drawing charts is messy when working directly with the canvas. Because of that, sharing the data handler between charts is ideal, but sharing any functionality between canvas handlers turns the long term prospects of this project into a chart engine.

**This should not become a chart engine**

<br />

One package per chart and being inefficient by lifting and shifting some common code snippets is not best practice and a bit annoying.

Having a main core of shared functionality for complex, to-scale 2D graphics rendering and maintaining it is an entirely different project.

<br />

Just turn the numbers into a chart.

Put the data in the data handler.

Put the config in the config handler.

Make the canvas handler do something with it. Any canvas handler that makes a good chart will be messy.

<br />

