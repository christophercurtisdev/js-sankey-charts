class CanvasHandler {
  constructor(canvasId, styleWidth, styleHeight) {
    let canvasDiv = document.getElementById(canvasId);
    let canvasElement = document.createElement('canvas');
    let canvas = canvasDiv.appendChild(canvasElement);
    this.config = {};

    if (canvas.getContext) {
      console.log("Canvas found.");

      // DEFAULT CUSTOMISATIONS TO THE CHART
      this.setConfig({});

      //////////////////////////////

      this.canvas = canvas;
      this.canvas.style.border = 'solid 2px black';
      this.context = canvas.getContext("2d");
      this.dpi = window.devicePixelRatio || 1;
      this.nodeMap = [];
      this.flowMap = [];

      this.canvas.style.width = `${styleWidth}px`; // CSS size
      this.canvas.style.height = `${styleHeight}px`; // CSS size
      var width = styleWidth * this.dpi; // Adjust for DPI
      var height = styleHeight * this.dpi;
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  setConfig(config) {
    this.nodeGap = config.nodeGap ?? 1;
    this.nodeWidth = config.nodeWidth ?? 2;
    this.showLabels = config.showLabels ?? false;
  }

  drawChart() {
    this.initialiseMaps();
    this.drawNodes();
    this.drawFlows();
  }

  initialiseMaps() {
    let layers = this.jsonData.nodeLayers
    this.dataTocanvasHeightPercentage = this.canvas.height / this.jsonData.scale;
    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      let layer = layers[layerIndex];

      let layerX = 0;
      let canvasWidthPercentage = this.canvas.width / 100;
      let canvasHeightPercentage = this.canvas.height / 100;

      layerX = (this.canvas.width / (layers.length - 1)) * (layerIndex);
      let previousEndY = 0;

      this.nodeMap[layerIndex] = [];
      this.flowMap[layerIndex] = [];

      for(let nodeIndex = 0; nodeIndex < layer.length; nodeIndex++) {
        let node = layer[nodeIndex];
        node.index = nodeIndex;

        

        let startX = layerX - (((this.nodeWidth) * canvasWidthPercentage) / 2);
        let startY = previousEndY + ((this.nodeGap / 2) * canvasHeightPercentage);
        let endX = startX + this.nodeWidth * canvasWidthPercentage;
        let endY = startY + (node.size * this.dataTocanvasHeightPercentage) - (this.nodeGap * canvasHeightPercentage)
        
        this.nodeMap[layerIndex][node.index] = {
          "position": [[startX, startY],[endX, endY]], 
          "size": node.size, 
          "label": node.label,
          "lowestFlowInput": startY, 
          "colour": node.colour ?? this.randomColour()
        };
        this.flowMap[layerIndex][node.index] = node.flow ?? {};

        previousEndY += (node.size * this.dataTocanvasHeightPercentage);
      }
    }
  }

  drawNodes() {
    // Customisations
    this.context.fillStyle = this.colour;

    // Nested loop Variables
    let layer, node;

    for (let layerIndex = 0; layerIndex < this.nodeMap.length; layerIndex++) {
      layer = this.nodeMap[layerIndex];
      // Draw node layers
      for(let nodeIndex = 0; nodeIndex < layer.length; nodeIndex++) {
        node = layer[nodeIndex];
        this.drawNode(node);
      }
    }
  }

  drawNode(node) {
    // Abstracted to method for easier node customisation later
    this.context.fillStyle = node.colour;

    let startX, startY, endX, endY;
    [[startX, startY],[endX, endY]] = node.position;

    this.context.shadowOffsetX = 2;
    this.context.shadowOffsetY = 2;
    this.context.shadowColor = 'rgba(100, 100, 100, 0.5)';
    this.context.shadowBlur = 20;
    this.context.beginPath();
    this.context.moveTo(startX, startY);
    this.context.lineTo(endX, startY);
    this.context.lineTo(endX, endY);
    this.context.lineTo(startX, endY);
    this.context.closePath();
    this.context.fill();

    if (this.showLabels) {
      this.context.textBaseline = "middle";
      this.context.fillStyle = "black";
      this.context.textAlign = "center";
      this.context.fillText(node.label, ((endX - startX) / 2) + startX, ((endY - startY) / 2) + startY);
    }
  }

  drawFlows() {
    // Customisations
    // this.context.fillStyle = this.colour;
    // this.context.fillStyle = '#44ff0050';

    // Nested loop Variables
    let layer, node;

    for (let layerIndex = 0; layerIndex < this.flowMap.length; layerIndex++) {
      layer = this.flowMap[layerIndex];
      for(let nodeIndex = 0; nodeIndex < layer.length; nodeIndex++) {
        node = layer[nodeIndex];

        let sourceStartX,sourceStartY,sourceEndX,sourceEndY, sourceNode;
        [[sourceStartX, sourceStartY],[sourceEndX, sourceEndY]] = this.nodeMap[layerIndex][nodeIndex].position;
        sourceNode = this.nodeMap[layerIndex][nodeIndex];
        this.context.fillStyle = sourceNode.colour + '33';

        let totalFlowHeight = sourceStartY;
        let nodeTocanvasHeightPercentage = (sourceEndY - sourceStartY) / this.nodeMap[layerIndex][nodeIndex].size;
        for (let flow in node) {
          // Set target node
          let targetStartX, targetStartY, targetEndX, targetEndY, targetNode;
          targetNode = this.nodeMap[layerIndex + 1][flow];

          [[targetStartX, targetStartY],[targetEndX, targetEndY]] = targetNode.position;

          let flowStartX, flowStartY, flowEndX, flowEndY, flowCurveSeverity;
          flowStartX = sourceEndX;
          flowStartY = totalFlowHeight;
          flowEndX = targetStartX;
          flowEndY = targetNode.lowestFlowInput;
          flowCurveSeverity = 20;

          this.context.beginPath();
          this.context.moveTo(flowStartX, flowStartY);
          this.context.bezierCurveTo(
            flowStartX + (((flowEndX - flowStartX) / 50) * flowCurveSeverity), 
            flowStartY, 
            flowEndX - (((flowEndX - flowStartX) / 50) * flowCurveSeverity), 
            flowEndY, 
            flowEndX, 
            flowEndY);

          // Calculate flow height on target node
          let targetFlowHeight = ((targetEndY - targetStartY) / targetNode.size) * node[flow];
          let targetLowestFlowInput = targetNode.lowestFlowInput + targetFlowHeight;
          this.context.lineTo(flowEndX, targetLowestFlowInput);

          // Increment source lowest flow point
          totalFlowHeight += (node[flow] * nodeTocanvasHeightPercentage);

          this.context.bezierCurveTo(
            flowEndX - (((flowEndX - flowStartX) / 50) * flowCurveSeverity), 
            targetLowestFlowInput, 
            flowStartX + (((flowEndX - flowStartX) / 50) * flowCurveSeverity), 
            totalFlowHeight, 
            flowStartX, 
            totalFlowHeight);
          this.context.closePath();
          this.context.fill();

          // Increment target node's lowest flow point
          targetNode.lowestFlowInput = targetLowestFlowInput;
          this.nodeMap[layerIndex + 1][flow] = targetNode;
        }
      }
    }
  }

  randomColour() {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  }

  exampleSankey() {
    this.jsonData = {
      "scale": 1000,
      "nodeLayers": [
        [
          {
            "label": "Node 1",
            "size": 700,
            "flow": {
              0: 100,
              2: 100,
              3: 100,
              4: 100,
              6: 300,
            }
          },
          {
            "label": "Node 2",
            "size": 300,
            "flow": {
              1: 100,
              5: 100,
              6: 50,
              7: 50
            }
          },
        ],
        [
          {
            "label": "Node 1",
            "size": 100,
            "colour": "#00ff00",
            "flow": {
              0: 30,
              1: 70
            }
          },
          {
            "label": "Node 1",
            "size": 100,
            "colour": "#00ff00",
            "flow": {
              0: 70,
              1: 30
            }
          },
          {
            "label": "Node 1",
            "size": 100,
            "colour": "#00ff00",
            "flow": {
              0: 100
            }
          },
          {
            "label": "Node 1",
            "size": 100,
            "colour": "#0000ff",
            "flow": {
              0: 100
            }
          },
          {
            "label": "Node 1",
            "size": 100,
            "colour": "#0000ff",
            "flow": {
              0: 50,
              1: 50
            }
          },
          {
            "label": "Node 2",
            "size": 100,
            "colour": "#0000ff",
            "flow": {
              0: 50,
              1: 50
            }
          },
          {
            "label": "Node 3",
            "size": 350,
            "flow": {
              0: 100,
              1: 250,
            }
          },
          {
            "label": "Node 4",
            "size": 50,
            "flow": {
              1: 50
            }
          }
        ],
        [
          {
            "label": "Node 1",
            "size": 500,
            "flow": {
              0: 500,
            }
          },
          {
            "label": "Node 1",
            "size": 500,
            "flow": {
              2: 50,
              1: 450,
            }
          },
        ],
        [
          {
            "label": "Node 1",
            "size": 500
          },
          {
            "label": "Node 3",
            "size": 450
          },
          {
            "label": "Node 4",
            "size": 50
          }
        ],
      ]
    };

    this.drawChart();
    
    // Scale canvas to dpi AFTER drawing
    this.context.scale(this.dpi, this.dpi);
  }
}

module.exports = CanvasHandler;
