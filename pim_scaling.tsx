import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Sector
} from 'recharts';

export default function PIMChipletEnergyVisualization() {
  const [selectedChiplet, setSelectedChiplet] = useState("Standard");
  
  // Define the chiplet types and their energy distributions
  const chipletData = {
    "Standard": {
      baseSize: "128×128",
      rowKnob: 87.5,
      colKnob: 12.5,
      components: [
        { name: "Row Components", value: 87.5, color: "#8884d8" },
        { name: "Column Components", value: 12.5, color: "#82ca9d" }
      ]
    },
    "Shared": {
      baseSize: "764×764",
      rowKnob: 68,
      colKnob: 1.3,
      components: [
        { name: "bitcell_capacitor", value: 42.12, color: "#8884d8" },
        { name: "row_drivers", value: 24.26, color: "#82ca9d" },
        { name: "input_zero_gating", value: 1.14, color: "#ffc658" },
        { name: "column_drivers", value: 0.71, color: "#ff8042" },
        { name: "adc", value: 24.43, color: "#0088fe" },
        { name: "shift_add", value: 6.76, color: "#00c49f" },
        { name: "out_datapath", value: 0.59, color: "#ffbb28" }
      ]
    },
    "Adder": {
      baseSize: "64×64",
      rowKnob: 81,
      colKnob: 0.4,
      components: [
        { name: "RowDriver", value: 80.83, color: "#8884d8" },
        { name: "Binary_weightingCap", value: 0.35, color: "#82ca9d" },
        { name: "ColDriver", value: 0.1, color: "#ffc658" },
        { name: "Adder", value: 0.98, color: "#ff8042" },
        { name: "ADC", value: 17.83, color: "#0088fe" }
      ]
    },
    "Accumulator": {
      baseSize: "128×128", // Assumed base size
      rowKnob: 55,
      colKnob: 51,
      components: [
        { name: "Crossbar", value: 8.25, color: "#8884d8" },
        { name: "RowDriver", value: 47.32, color: "#82ca9d" },
        { name: "ADC", value: 3.53, color: "#ffc658" },
        { name: "Shift/ADD", value: 1.18, color: "#ff8042" },
        { name: "WordlineCap", value: 1.95, color: "#0088fe" },
        { name: "Accum", value: 37.78, color: "#00c49f" }
      ]
    },
    "ADC_Less": {
      baseSize: "128×128", // Assumed base size
      rowKnob: 94.4,
      colKnob: 20,
      components: [
        { name: "crossbar", value: 16.56, color: "#8884d8" },
        { name: "cim_unit", value: 0.02, color: "#82ca9d" },
        { name: "register", value: 3.76, color: "#ffc658" },
        { name: "column_drivers", value: 2.84, color: "#ff8042" },
        { name: "digital_logic_input_ports", value: 18.19, color: "#0088fe" },
        { name: "row_drivers", value: 58.64, color: "#00c49f" }
      ]
    }
  };

  // Generate scaling data for the selected chiplet
  const generateScalingData = (chipletType) => {
    const chiplet = chipletData[chipletType];
    const scalingFactors = [1, 0.5, 0.25, 0.125]; // 100%, 50%, 25%, 12.5%
    
    const data = [];
    
    // For each scaling factor
    scalingFactors.forEach(rowScale => {
      scalingFactors.forEach(colScale => {
        // Calculate energy based on knob percentages
        const rowEnergy = chiplet.rowKnob * rowScale;
        const colEnergy = chiplet.colKnob * colScale;
        const otherEnergy = 100 - chiplet.rowKnob - chiplet.colKnob;
        const totalEnergy = rowEnergy + colEnergy + otherEnergy;
        
        // Calculate the relative crossbar dimensions
        const baseSize = chiplet.baseSize.split("×").map(num => parseInt(num));
        const scaledRows = Math.round(baseSize[0] * rowScale);
        const scaledCols = Math.round(baseSize[1] * colScale);
        
        data.push({
          id: `${scaledRows}×${scaledCols}`,
          rows: scaledRows,
          cols: scaledCols,
          rowScale,
          colScale,
          rowEnergy,
          colEnergy,
          otherEnergy,
          totalEnergy,
          energyPercentage: (totalEnergy / 100) * 100 // Normalized to 100%
        });
      });
    });
    
    return data;
  };

  const scalingData = generateScalingData(selectedChiplet);
  
  // Format the data for the heatmap-like visualization
  const formatHeatmapData = () => {
    const baseSize = chipletData[selectedChiplet].baseSize.split("×").map(num => parseInt(num));
    const rows = [baseSize[0], baseSize[0]/2, baseSize[0]/4, baseSize[0]/8].map(r => Math.round(r));
    
    return rows.map(row => {
      const dataPoint = {};
      dataPoint.name = row;
      
      const colSizes = [baseSize[1], baseSize[1]/2, baseSize[1]/4, baseSize[1]/8].map(c => Math.round(c));
      
      colSizes.forEach(col => {
        const matchingData = scalingData.find(d => d.rows === row && d.cols === col);
        if (matchingData) {
          dataPoint[`${col}`] = Math.round(matchingData.energyPercentage);
        }
      });
      
      return dataPoint;
    });
  };
  
  const heatmapData = formatHeatmapData();
  
  // Format data for line chart visualization
  const formatLineData = () => {
    const baseSize = chipletData[selectedChiplet].baseSize.split("×").map(num => parseInt(num));
    const result = [];
    
    // Generate row and column combinations with scaled dimensions
    const rowScales = [1, 0.5, 0.25, 0.125];
    const colScales = [1, 0.5, 0.25, 0.125];
    
    rowScales.forEach(rowScale => {
      const scaledRow = Math.round(baseSize[0] * rowScale);
      
      colScales.forEach(colScale => {
        const scaledCol = Math.round(baseSize[1] * colScale);
        const matchingData = scalingData.find(d => 
          d.rows === scaledRow && d.cols === scaledCol
        );
        
        if (matchingData) {
          result.push({
            name: `${scaledRow}×${scaledCol}`,
            energy: Math.round(matchingData.energyPercentage),
            rowSize: scaledRow,
            colSize: scaledCol
          });
        }
      });
    });
    
    // Sort by row size (primary) and col size (secondary)
    result.sort((a, b) => {
      if (a.rowSize !== b.rowSize) return b.rowSize - a.rowSize;
      return b.colSize - a.colSize;
    });
    
    return result;
  };
  
  const lineData = formatLineData();
  
  return (
    <div className="flex flex-col p-4 gap-6 w-full">
      <h1 className="text-2xl font-bold text-center">PIM Chiplet Energy Scaling Visualization</h1>
      
      <div className="flex justify-center mb-4">
        <div className="flex gap-2">
          <label className="font-medium">Select Chiplet Type:</label>
          <select 
            value={selectedChiplet}
            onChange={(e) => setSelectedChiplet(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {Object.keys(chipletData).map(type => (
              <option key={type} value={type}>{type} ({chipletData[type].baseSize})</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Energy Breakdown By Component */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Energy Distribution by Component</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chipletData[selectedChiplet].components}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" unit="%" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, 'Energy']} />
                <Legend />
                <Bar dataKey="value" name="Energy %" fill="#8884d8">
                  {chipletData[selectedChiplet].components.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <p><strong>Row Knob Components:</strong> {chipletData[selectedChiplet].rowKnob.toFixed(1)}%</p>
            <p><strong>Column Knob Components:</strong> {chipletData[selectedChiplet].colKnob.toFixed(1)}%</p>
          </div>
        </div>
      
        {/* Energy Scaling Visualization */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Energy Scaling with Crossbar Dimensions</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 5, right: 30, left: 20, bottom: 45 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end"
                  height={60}
                  label={{ value: "Crossbar Dimensions (Rows×Columns)", position: "insideBottom", offset: -35 }}
                />
                <YAxis 
                  label={{ value: "Relative Energy (%)", angle: -90, position: "insideLeft" }}
                  domain={[0, 100]} 
                />
                <Tooltip formatter={(value) => [`${value}%`, 'Energy']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="energy" 
                  name="Relative Energy" 
                  stroke="#ff7300" 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Energy Heatmap */}
        <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Energy Consumption Heatmap</h2>
          <p className="mb-4 text-sm text-gray-600">This shows the relative energy consumption (%) for different crossbar dimensions</p>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-100">Rows ↓ / Columns →</th>
                  {heatmapData[0] && Object.keys(heatmapData[0])
                    .filter(key => key !== 'name')
                    .map(col => (
                      <th key={col} className="border p-2 bg-gray-100">{col}</th>
                    ))
                  }
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="border p-2 font-medium bg-gray-50">{row.name}</td>
                    {Object.keys(row)
                      .filter(key => key !== 'name')
                      .map(col => {
                        // Calculate color intensity based on energy value
                        const energyValue = row[col];
                        const hue = 120 - (energyValue * 1.2); // Red to green gradient
                        const backgroundColor = `hsl(${hue}, 80%, 80%)`;
                        
                        return (
                          <td 
                            key={col} 
                            className="border p-2 text-center"
                            style={{ backgroundColor }}
                          >
                            {energyValue}%
                          </td>
                        );
                      })
                    }
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg mt-2">
        <h3 className="text-lg font-medium mb-2">Scaling Analysis for {selectedChiplet}</h3>
        <p>
          For the {selectedChiplet} chiplet with base size {chipletData[selectedChiplet].baseSize}, 
          reducing row dimensions affects {chipletData[selectedChiplet].rowKnob.toFixed(1)}% of the energy consumption,
          while reducing column dimensions affects {chipletData[selectedChiplet].colKnob.toFixed(1)}% of the energy.
        </p>
        <p className="mt-2">
          When scaling to half the rows ({Math.round(parseInt(chipletData[selectedChiplet].baseSize.split("×")[0])/2)}), 
          the energy consumption reduces by approximately {(chipletData[selectedChiplet].rowKnob * 0.5).toFixed(1)}%.
          When scaling to half the columns ({Math.round(parseInt(chipletData[selectedChiplet].baseSize.split("×")[1])/2)}), 
          the energy consumption reduces by approximately {(chipletData[selectedChiplet].colKnob * 0.5).toFixed(1)}%.
        </p>
      </div>
    </div>
  );
}