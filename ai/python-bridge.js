// Python Bridge for AI Integration
const { spawn } = require('child_process');
const path = require('path');

class PythonAIBridge {
  constructor() {
    this.pythonPath = 'python'; // or 'python3' depending on your system
    this.aiScriptPath = path.join(__dirname, 'ai_client.py');
  }

  // Call Python AI function to parse transcript
  async parseTranscript(transcript) {
    return new Promise((resolve, reject) => {
      console.log('🐍 Calling Python AI to parse transcript:', transcript);

      // Spawn Python process
      const pythonProcess = spawn(this.pythonPath, [this.aiScriptPath, transcript]);

      let result = '';
      let error = '';

      // Collect data from Python script
      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      // Handle process completion
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Parse JSON response from Python
            const parsedResult = JSON.parse(result.trim());
            console.log('✅ Python AI parsing successful:', parsedResult);
            resolve(parsedResult);
          } catch (parseError) {
            console.error('❌ Failed to parse Python response:', result);
            reject(new Error(`Invalid JSON response from Python: ${result}`));
          }
        } else {
          console.error('❌ Python process failed:', error);
          reject(new Error(`Python process failed with code ${code}: ${error}`));
        }
      });

      // Handle process errors
      pythonProcess.on('error', (err) => {
        console.error('❌ Failed to start Python process:', err);
        reject(new Error(`Failed to start Python process: ${err.message}`));
      });
    });
  }

  // Alternative method using Python with JSON input/output
  async parseTranscriptAdvanced(transcript, userId = null) {
    return new Promise((resolve, reject) => {
      console.log('🧠 Advanced Python AI parsing for user:', userId);

      const inputData = JSON.stringify({
        transcript,
        userId,
        timestamp: new Date().toISOString()
      });

      const pythonProcess = spawn(this.pythonPath, [
        this.aiScriptPath,
        '--mode', 'advanced',
        '--input', inputData
      ]);

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const parsedResult = JSON.parse(result.trim());
            resolve(parsedResult);
          } catch (parseError) {
            reject(new Error(`Invalid JSON response: ${result}`));
          }
        } else {
          reject(new Error(`Python process failed: ${error}`));
        }
      });

      pythonProcess.on('error', (err) => {
        reject(new Error(`Python process error: ${err.message}`));
      });
    });
  }

  // Test Python AI connection
  async testConnection() {
    try {
      const testResult = await this.parseTranscript("I spent $10 on coffee");
      return {
        success: true,
        message: 'Python AI connection successful',
        testResult
      };
    } catch (error) {
      return {
        success: false,
        message: 'Python AI connection failed',
        error: error.message
      };
    }
  }
}

module.exports = PythonAIBridge;