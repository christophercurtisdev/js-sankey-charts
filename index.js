class CanvasHandler {
  constructor(canvasId, styleWidth, styleHeight) {
    let canvasDiv = document.getElementById(canvasId);
    let canvasElement = document.createElement('canvas');
    let canvas = canvasDiv.appendChild(canvasElement);
    this.config = {};

    if (canvas.getContext) {
      this.canvas = canvas;
      console.log("Canvas found.");

      // DEFAULT CUSTOMISATIONS TO THE CHART
      this.setConfig({});

      //////////////////////////////
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
    this.nodeLabels = config.nodeLabels ?? false;
    this.nodePercentages = config.nodePercentages ?? false;
    this.nodeValues = config.nodeValues ?? false;
    this.chartPadding = config.chartPadding ?? 10;
    this.canvas.style.background = config.background ?? '#777777';
    this.key = config.key ?? false;
  }

  drawChart() {
    this.initialiseMaps();
    this.drawNodes();
    this.drawFlows();
    this.drawNodeLabels();
    this.drawKey();
  }

  initialiseMaps() {
    let keyCompensation = 0;
    if (this.key) {
      keyCompensation = this.key.height ?? 150;
    }

    let layers = this.jsonData.nodeLayers
    this.dataToCanvasHeightPercentage = (this.canvas.height - keyCompensation) / this.jsonData.scale;
    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      let layer = layers[layerIndex];

      let layerX = 0;
      let canvasWidthPercentage = this.canvas.width / 100;
      let canvasHeightPercentage = this.canvas.height / 100;

      layerX = (this.canvas.width / (layers.length - 1)) * (layerIndex);
      let previousEndY = 0;

      this.nodeMap[layerIndex] = [];
      this.flowMap[layerIndex] = [];

      let xCompensation = ((this.nodeWidth * (layerIndex / (layers.length - 1))) - (this.nodeWidth / 2)) * canvasWidthPercentage;
      let paddingCompensation = ((this.chartPadding * (layerIndex / (layers.length - 1))) - (this.chartPadding / 2));

      for(let nodeIndex = 0; nodeIndex < layer.length; nodeIndex++) {
        let node = layer[nodeIndex];
        node.index = nodeIndex;

        let startX = layerX - (((this.nodeWidth) * canvasWidthPercentage) / 2) - xCompensation - paddingCompensation;
        let startY = previousEndY + ((this.nodeGap / 2) * canvasHeightPercentage);
        let endX = startX + this.nodeWidth * canvasWidthPercentage;
        let endY = startY + (node.size * this.dataToCanvasHeightPercentage) - (this.nodeGap * canvasHeightPercentage);
        
        this.nodeMap[layerIndex][node.index] = {
          "position": [[startX, startY],[endX, endY]], 
          "size": node.size, 
          "label": node.label,
          "lowestFlowInput": startY, 
          "colour": node.colour ?? this.randomColour(),
          "type": node.type ?? "spacer",
          "spacerFlowCounter": 0,
          "showLabel": node.label && this.nodeLabels,
          "showPercentage": this.nodePercentages,
          "showValue": this.nodeValues
        };
        
        this.flowMap[layerIndex][node.index] = {
          "streams": node.flow ?? {},
          "colours": {}
        }

        previousEndY += (node.size * this.dataToCanvasHeightPercentage);
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
      // Draw nodes
      for(let nodeIndex = 0; nodeIndex < layer.length; nodeIndex++) {
        node = layer[nodeIndex];
        this.drawNode(node);
      }
    }
  }

  drawNode(node) {
    this.context.fillStyle = node.colour;

    let startX, startY, endX, endY;
    [[startX, startY],[endX, endY]] = node.position;

    if (node.type == "node") {
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
    }
  }

  drawNodeLabels() {
    // Customisations
    this.context.fillStyle = this.colour;

    // Nested loop Variables
    let layer, node;

    for (let layerIndex = 0; layerIndex < this.nodeMap.length; layerIndex++) {
      layer = this.nodeMap[layerIndex];
      // Draw node labels
      for(let nodeIndex = 0; nodeIndex < layer.length; nodeIndex++) {
        node = layer[nodeIndex];
        this.drawNodeLabel(node);
      }
    }
  }

  drawNodeLabel(node) {
    let startX, startY, endX, endY;
    [[startX, startY],[endX, endY]] = node.position;

    let labelLines = {};
    let labelTextHeight = 15;
    let lineCount = 0;

    this.context.textBaseline = "middle";
    this.context.fillStyle = "black";
    this.context.textAlign = "center";
    this.context.font = `bold ${labelTextHeight}px sans-serif`;

    if (node.showLabel) {
      labelLines.label = { "position": ((endY - startY) / 2) + startY + ((labelTextHeight * (lineCount - 1))), "text": node.label };
      lineCount++;
    }

    if (node.showPercentage) {
      let percentage = (node.size / this.jsonData.scale) * 100;
      labelLines.percentage = { "position": ((endY - startY) / 2) + startY + ((labelTextHeight * (lineCount - 1))), "text": `${percentage}%` };
      lineCount++;
    }

    if (node.showValue) {
      labelLines.value = { "position": ((endY - startY) / 2) + startY + ((labelTextHeight * (lineCount - 1))), "text": node.size }
      lineCount++;
    }

    for (let labelLine in labelLines) {
      this.context.fillStyle = 'white';
      this.context.fillText(labelLines[labelLine].text, ((endX - startX) / 2) + startX, labelLines[labelLine].position);
      this.context.strokeStyle = 'black';
      this.context.lineWidth = 0.5 / this.dpi;
      this.context.strokeText(labelLines[labelLine].text, ((endX - startX) / 2) + startX, labelLines[labelLine].position);
    }
  }

  drawFlows() {
    // Nested loop Variables
    let layer, node;

    for (let layerIndex = 0; layerIndex < this.flowMap.length; layerIndex++) {
      layer = this.flowMap[layerIndex];
      for(let nodeIndex = 0; nodeIndex < layer.length; nodeIndex++) {
        node = layer[nodeIndex];

        let sourceStartX,sourceStartY,sourceEndX,sourceEndY,sourceNode;
        [[sourceStartX, sourceStartY],[sourceEndX, sourceEndY]] = this.nodeMap[layerIndex][nodeIndex].position;
        sourceNode = this.nodeMap[layerIndex][nodeIndex];

        let totalFlowHeight = sourceStartY;
        let nodeTocanvasHeightPercentage = (sourceEndY - sourceStartY) / this.nodeMap[layerIndex][nodeIndex].size;
        for (let flow in node["streams"]) {

          // Set target node
          let targetStartX, targetStartY, targetEndX, targetEndY, targetNode;
          targetNode = this.nodeMap[layerIndex + 1][flow];

          [[targetStartX, targetStartY],[targetEndX, targetEndY]] = targetNode.position;

          let flowStartX, flowStartY, flowEndX, flowEndY, flowSourceHeight, flowTargetHeight, flowCurveSeverity, flowColour;
          flowStartX = sourceEndX;
          flowStartY = totalFlowHeight;
          flowEndX = targetStartX;
          flowEndY = targetNode.lowestFlowInput;
          flowCurveSeverity = 20;
          flowSourceHeight = (node["streams"][flow] * nodeTocanvasHeightPercentage) + totalFlowHeight;
          flowTargetHeight = targetNode.lowestFlowInput + (((targetEndY - targetStartY) / targetNode.size) * node["streams"][flow]);
          flowColour = node["colours"][flow] ?? sourceNode.colour + '33';

          if (targetNode.type == "spacer") {
            let targetFlow = this.flowMap[layerIndex + 1][flow];
            let targetNodeStreamKeys = Object.keys(targetFlow["streams"]);
            let nextKey = targetNodeStreamKeys[targetNode.spacerFlowCounter];
            targetFlow["colours"][nextKey] = sourceNode.colour + '33';
            targetNode.spacerFlowCounter++;
            this.nodeMap[layerIndex + 1][flow]["colour"] = sourceNode.colour; 
          }

          let extension = targetNode.type == "spacer" ? targetEndX : 0;
          this.drawFlow(flowStartX, flowStartY, flowEndX, flowEndY, flowSourceHeight, flowTargetHeight, flowCurveSeverity, flowColour, extension);

          totalFlowHeight += (node["streams"][flow] * nodeTocanvasHeightPercentage);
          targetNode.lowestFlowInput = flowTargetHeight;
          this.nodeMap[layerIndex + 1][flow] = targetNode;
        }
      }
    }
  }

  drawFlow(flowStartX, flowStartY, flowEndX, flowEndY, flowSourceHeight, flowTargetHeight, flowCurveSeverity, flowColour, extension = 0) {
    this.context.fillStyle = flowColour;
    this.context.beginPath();
    this.context.moveTo(flowStartX, flowStartY);
    this.context.bezierCurveTo(
      flowStartX + (((flowEndX - flowStartX) / 50) * flowCurveSeverity), 
      flowStartY, 
      flowEndX - (((flowEndX - flowStartX) / 50) * flowCurveSeverity), 
      flowEndY, 
      flowEndX, 
      flowEndY);
    
    if(extension > 0) {
      this.context.lineTo(extension, flowEndY);
      this.context.lineTo(extension, flowTargetHeight);
    }
    
    this.context.lineTo(flowEndX, flowTargetHeight);
    this.context.bezierCurveTo(
      flowEndX - (((flowEndX - flowStartX) / 50) * flowCurveSeverity), 
      flowTargetHeight, 
      flowStartX + (((flowEndX - flowStartX) / 50) * flowCurveSeverity), 
      flowSourceHeight, 
      flowStartX, 
      flowSourceHeight);

    this.context.closePath();
    this.context.fill();
  }

  drawKey() {
    if (this.key) {
      // Draw key
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
            "type": "node",
            "label": "Node 1",
            "size": 1000,
            "flow": {
              0: 250,
              1: 250,
              2: 500
            }
          },
        ],
        [
          {
            "type": "node",
            "label": "Node 1",
            "size": 250,
            "flow": {
              0: 250
            }
          },
          {
            "type": "node",
            "label": "Node 1",
            "size": 250,
            "flow": {
              0: 200,
              1: 50
            }
          },
          {
            "type": "spacer",
            "size": 500,
            "flow": {
              0: 50,
              1: 50,
              2: 400
            }
          },
        ],
        [
          {
            "type": "node",
            "label": "Node 1",
            "size": 500,
            "colour": "#0000FF",
            "flow": {
              0: 450,
              1: 50
            }
          },
          {
            "type": "spacer",
            "label": "Flow Information",
            "size": 100,
            "flow": {
              0: 50,
              1: 50
            }
          },
          {
            "type": "node",
            "label": "Node 1",
            "size": 400,
            "flow": {
              1: 400
            }
          },
        ],
        [
          {
            "type": "node",
            "label": "Node 1",
            "size": 500,
          },
          {
            "type": "node",
            "label": "Node 1",
            "size": 500,
          },
        ]
      ]
    };

    this.drawChart();
    
    // Scale canvas to dpi AFTER drawing
    this.context.scale(this.dpi, this.dpi);
  }
}

module.exports = CanvasHandler;
