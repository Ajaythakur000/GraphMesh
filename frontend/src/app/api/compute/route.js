import { spawn } from "child_process";
import path from "path";
import os from "os"; 
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // 1. Get the JSON data sent from our React frontend
    const body = await req.json();

    // 2. Find the exact path to your compiled C++ engine
    // Windows ke liye 'engine.exe', Linux/Mac (Render) ke liye sirf 'engine'
    const isWindows = os.platform() === "win32";
    const executableName = isWindows ? "engine.exe" : "engine";
    
    // process.cwd() is the 'frontend' folder, so we go up one level to 'engine'
    const enginePath = path.join(process.cwd(), "../engine", executableName);

    // Start measuring time
    const startTime = performance.now();

    // 3. We use a Promise because running an external C++ program takes time
    const result = await new Promise((resolve, reject) => {
      // Spawn the C++ process in the background
      const cppProcess = spawn(enginePath);

      let outputData = "";
      let errorData = "";

      // Listen for standard output from C++ (the JSON you cout)
      cppProcess.stdout.on("data", (data) => {
        outputData += data.toString();
      });

      // Listen for any errors or crashes from the C++ side
      cppProcess.stderr.on("data", (data) => {
        errorData += data.toString();
      });

      // When the C++ program finishes and exits (return 0)
      cppProcess.on("close", (code) => {
        const endTime = performance.now(); // Stop timer immediately on close

        if (code !== 0) {
          reject(new Error(`C++ Engine failed! Code: ${code}. Error: ${errorData}`));
          return;
        }
        try {
          // Parse the JSON string that C++ returned
          const parsedOutput = JSON.parse(outputData);
          
          // Calculate and attach the execution time
          parsedOutput.executionTime = (endTime - startTime).toFixed(2);
          
          resolve(parsedOutput);
        } catch (e) {
          reject(new Error(`Failed to parse C++ output. Raw output: ${outputData}`));
        }
      });

      // 4. Send our frontend JSON to the C++ engine's standard input (cin)
      cppProcess.stdin.write(JSON.stringify(body));

      // 5. Send the EOF signal (This is exactly like pressing Ctrl+Z in terminal!)
      cppProcess.stdin.end();
    });

    // 6. Send the final computed result back to the Next.js frontend
    return NextResponse.json(result);
  } catch (error) {
    console.error("GraphMesh API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}